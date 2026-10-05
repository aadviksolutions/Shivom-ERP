import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { calculateGSTBreakdown } from "@/lib/format";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const customerId = searchParams.get("customerId");
    const status = searchParams.get("status");

    const where: any = {};

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { customer: { mobile: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (customerId) where.customerId = customerId;
    if (status) where.status = status;

    const sales = await prisma.sale.findMany({
      where,
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: sales });
  } catch (error: any) {
    console.error("Sales GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();

    const {
      customerId,
      items, // array of { productId, quantity, rate, discountPercent, gstRate }
      paymentMode = "CASH",
      paidAmount = 0,
      isInterState = false,
      notes,
      terms,
      warehouseId,
    } = body;

    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Customer and at least one item are required" },
        { status: 400 }
      );
    }

    // 1. Fetch Company Settings
    const company = await prisma.company.findFirst() || {
      invoicePrefix: "INV-26/",
      invoiceTerms: "Goods once sold cannot be returned.",
    };

    const allowNegativeStockSetting = await prisma.setting.findUnique({
      where: { key: "allow_negative_stock" },
    });
    const allowNegativeStock = allowNegativeStockSetting?.value === "true";

    // 2. Fetch default warehouse if not specified
    const targetWarehouse = warehouseId
      ? await prisma.warehouse.findUnique({ where: { id: warehouseId } })
      : await prisma.warehouse.findFirst({ where: { isDefault: true } }) ||
        await prisma.warehouse.findFirst();

    if (!targetWarehouse) {
      return NextResponse.json(
        { error: "No warehouse found to fulfill sale" },
        { status: 400 }
      );
    }

    // 3. Generate sequential Invoice Number
    const count = await prisma.sale.count();
    const invoiceNumber = `${company.invoicePrefix}${String(count + 1).padStart(4, "0")}`;

    // 4. Validate stock and prepare item calculations
    let subtotal = 0;
    let totalDiscount = 0;
    let taxableAmount = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;
    let taxAmount = 0;
    let grandTotal = 0;

    const saleItemsData: any[] = [];
    const stockUpdates: any[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return NextResponse.json(
          { error: `Product ID ${item.productId} not found` },
          { status: 400 }
        );
      }

      const qty = Number(item.quantity) || 1;
      const rate = Number(item.rate) || product.salePrice;
      const discountPercent = Number(item.discountPercent) || 0;
      const gstRate = Number(item.gstRate !== undefined ? item.gstRate : product.gstRate);

      if (!allowNegativeStock && product.currentStock < qty) {
        return NextResponse.json(
          {
            error: `Insufficient stock for "${product.name}". Available: ${product.currentStock}, Requested: ${qty}`,
          },
          { status: 400 }
        );
      }

      const breakdown = calculateGSTBreakdown({
        rate,
        quantity: qty,
        discountPercent,
        gstRate,
        isInterState,
      });

      subtotal += breakdown.lineSubtotal;
      totalDiscount += breakdown.discountAmount;
      taxableAmount += breakdown.taxableAmount;
      cgstAmount += breakdown.cgstAmount;
      sgstAmount += breakdown.sgstAmount;
      igstAmount += breakdown.igstAmount;
      taxAmount += breakdown.taxAmount;
      grandTotal += breakdown.totalAmount;

      saleItemsData.push({
        productId: product.id,
        warehouseId: targetWarehouse.id,
        description: product.name,
        hsnCode: product.hsnCode,
        unit: product.unitId,
        quantity: qty,
        rate,
        discount: breakdown.discountAmount,
        taxableAmount: breakdown.taxableAmount,
        gstRate,
        cgstAmount: breakdown.cgstAmount,
        sgstAmount: breakdown.sgstAmount,
        igstAmount: breakdown.igstAmount,
        totalAmount: breakdown.totalAmount,
      });

      stockUpdates.push({
        product,
        qty,
        newStock: product.currentStock - qty,
      });
    }

    const paid = Math.min(grandTotal, Math.max(0, Number(paidAmount) || 0));
    const balance = Math.max(0, Math.round((grandTotal - paid) * 100) / 100);
    const invoiceStatus = balance === 0 ? "PAID" : paid > 0 ? "PARTIAL" : "ISSUED";

    // Pre-fetch customer and calculate payment number outside transaction
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    let paymentNumber = "";
    if (paid > 0) {
      const paymentCount = await prisma.payment.count();
      paymentNumber = `REC-26/${String(paymentCount + 1).padStart(4, "0")}`;
    }

    // 5. Database transaction for atomic consistency
    const result = await prisma.$transaction(
      async (tx) => {
        // Create Sale Record
        const sale = await tx.sale.create({
        data: {
          invoiceNumber,
          customerId,
          date: new Date(),
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          status: invoiceStatus,
          paymentMode,
          isInterState,
          subtotal,
          discount: totalDiscount,
          taxableAmount,
          cgstAmount,
          sgstAmount,
          igstAmount,
          taxAmount,
          grandTotal,
          paidAmount: paid,
          balanceAmount: balance,
          notes: notes?.trim() || null,
          terms: terms?.trim() || company.invoiceTerms,
          createdById: user?.id,
          items: {
            create: saleItemsData,
          },
        },
        include: {
          customer: true,
          items: { include: { product: true } },
        },
      });

      // Update Inventory & Record Movements
      for (const update of stockUpdates) {
        await tx.product.update({
          where: { id: update.product.id },
          data: { currentStock: update.newStock },
        });

        // Update warehouse specific stock
        await tx.stock.upsert({
          where: {
            productId_warehouseId: {
              productId: update.product.id,
              warehouseId: targetWarehouse.id,
            },
          },
          update: { quantity: { decrement: update.qty } },
          create: {
            productId: update.product.id,
            warehouseId: targetWarehouse.id,
            quantity: update.newStock,
          },
        });

        // Create traceable stock movement
        await tx.stockMovement.create({
          data: {
            productId: update.product.id,
            warehouseId: targetWarehouse.id,
            type: "SALE",
            quantity: -update.qty,
            balanceAfter: update.newStock,
            referenceType: "SALE",
            referenceId: invoiceNumber,
            reason: `Invoice ${invoiceNumber}`,
            createdById: user?.id,
          },
        });
      }

      // Update Customer Outstanding & Create Ledger Entry
      if (customer) {
        const newBalance = customer.currentBalance + balance;
        await tx.customer.update({
          where: { id: customerId },
          data: {
            totalSales: customer.totalSales + grandTotal,
            totalPaid: customer.totalPaid + paid,
            currentBalance: newBalance,
          },
        });

        // Invoice Ledger Entry (Debit increases customer receivable)
        await tx.ledgerEntry.create({
          data: {
            entityType: "CUSTOMER",
            customerId,
            transactionType: "INVOICE",
            referenceNo: invoiceNumber,
            saleId: sale.id,
            debit: grandTotal,
            credit: 0,
            runningBalance: customer.currentBalance + grandTotal,
            notes: `Tax Invoice ${invoiceNumber}`,
            createdById: user?.id,
          },
        });

        // Payment Entry if paid at counter
        if (paid > 0 && paymentNumber) {
          const payment = await tx.payment.create({
            data: {
              paymentNumber,
              type: "CUSTOMER",
              customerId,
              saleId: sale.id,
              amount: paid,
              paymentMode,
              referenceNo: invoiceNumber,
              notes: `Payment for ${invoiceNumber}`,
              createdById: user?.id,
            },
          });

          // Payment Ledger Entry (Credit decreases customer receivable)
          await tx.ledgerEntry.create({
            data: {
              entityType: "CUSTOMER",
              customerId,
              transactionType: "PAYMENT",
              referenceNo: paymentNumber,
              saleId: sale.id,
              paymentId: payment.id,
              debit: 0,
              credit: paid,
              runningBalance: newBalance,
              notes: `Payment received (${paymentMode})`,
              createdById: user?.id,
            },
          });
        }
      }

      return sale;
    }, { maxWait: 15000, timeout: 35000 });

    await recordAudit({
      userId: user?.id,
      userName: user?.name,
      action: "CREATE",
      module: "SALE",
      recordId: result.id,
      recordTitle: result.invoiceNumber,
      details: `Generated sale invoice ${result.invoiceNumber} for ${result.customer.name} (Total: ₹${result.grandTotal}, Paid: ₹${result.paidAmount})`,
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    console.error("Sales POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
