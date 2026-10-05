import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { calculateGSTBreakdown } from "@/lib/format";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const supplierId = searchParams.get("supplierId");

    const where: any = {};

    if (search) {
      where.OR = [
        { purchaseNumber: { contains: search, mode: "insensitive" } },
        { supplierInvoiceNo: { contains: search, mode: "insensitive" } },
        { supplier: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (supplierId) where.supplierId = supplierId;

    const purchases = await prisma.purchase.findMany({
      where,
      include: {
        supplier: true,
        items: {
          include: { product: true },
        },
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: purchases });
  } catch (error: any) {
    console.error("Purchases GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();

    const {
      supplierId,
      supplierInvoiceNo,
      items, // array of { productId, quantity, rate, discountPercent, gstRate }
      paymentMode = "BANK_TRANSFER",
      paidAmount = 0,
      isInterState = false,
      notes,
      warehouseId,
    } = body;

    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Supplier and at least one item are required" },
        { status: 400 }
      );
    }

    const company = await prisma.company.findFirst() || {
      purchasePrefix: "PO-26/",
    };

    const targetWarehouse = warehouseId
      ? await prisma.warehouse.findUnique({ where: { id: warehouseId } })
      : await prisma.warehouse.findFirst({ where: { isDefault: true } }) ||
        await prisma.warehouse.findFirst();

    if (!targetWarehouse) {
      return NextResponse.json(
        { error: "No warehouse found for goods inward" },
        { status: 400 }
      );
    }

    const count = await prisma.purchase.count();
    const purchaseNumber = `${company.purchasePrefix}${String(count + 1).padStart(4, "0")}`;

    let subtotal = 0;
    let totalDiscount = 0;
    let taxableAmount = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;
    let taxAmount = 0;
    let grandTotal = 0;

    const purchaseItemsData: any[] = [];
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
      const rate = Number(item.rate) || product.purchasePrice;
      const discountPercent = Number(item.discountPercent) || 0;
      const gstRate = Number(item.gstRate !== undefined ? item.gstRate : product.gstRate);

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

      purchaseItemsData.push({
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
        newStock: product.currentStock + qty,
      });
    }

    const paid = Math.min(grandTotal, Math.max(0, Number(paidAmount) || 0));
    const balance = Math.max(0, Math.round((grandTotal - paid) * 100) / 100);
    const status = balance === 0 ? "PAID" : paid > 0 ? "PARTIAL" : "ISSUED";

    // Pre-fetch supplier and calculate payment number outside transaction
    const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
    let paymentNumber = "";
    if (paid > 0) {
      const paymentCount = await prisma.payment.count();
      paymentNumber = `PAY-26/${String(paymentCount + 1).padStart(4, "0")}`;
    }

    const result = await prisma.$transaction(
      async (tx) => {
        // Create Purchase
        const purchase = await tx.purchase.create({
        data: {
          purchaseNumber,
          supplierInvoiceNo: supplierInvoiceNo?.trim() || null,
          supplierId,
          date: new Date(),
          status,
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
          createdById: user?.id,
          items: {
            create: purchaseItemsData,
          },
        },
        include: {
          supplier: true,
          items: { include: { product: true } },
        },
      });

      // Update Inventory (Current Stock + Purchased Quantity)
      for (const update of stockUpdates) {
        await tx.product.update({
          where: { id: update.product.id },
          data: { currentStock: update.newStock },
        });

        await tx.stock.upsert({
          where: {
            productId_warehouseId: {
              productId: update.product.id,
              warehouseId: targetWarehouse.id,
            },
          },
          update: { quantity: { increment: update.qty } },
          create: {
            productId: update.product.id,
            warehouseId: targetWarehouse.id,
            quantity: update.newStock,
          },
        });

        await tx.stockMovement.create({
          data: {
            productId: update.product.id,
            warehouseId: targetWarehouse.id,
            type: "PURCHASE",
            quantity: update.qty,
            balanceAfter: update.newStock,
            referenceType: "PURCHASE",
            referenceId: purchaseNumber,
            reason: `Purchase Inward ${purchaseNumber}`,
            createdById: user?.id,
          },
        });
      }

      // Update Supplier Ledger & Outstanding
      if (supplier) {
        const newBalance = supplier.currentBalance + balance;
        await tx.supplier.update({
          where: { id: supplierId },
          data: {
            totalPurchase: supplier.totalPurchase + grandTotal,
            totalPaid: supplier.totalPaid + paid,
            currentBalance: newBalance,
          },
        });

        // Supplier Credit increases our liability / payable
        await tx.ledgerEntry.create({
          data: {
            entityType: "SUPPLIER",
            supplierId,
            transactionType: "INVOICE",
            referenceNo: purchaseNumber,
            purchaseId: purchase.id,
            debit: 0,
            credit: grandTotal,
            runningBalance: supplier.currentBalance + grandTotal,
            notes: `Purchase Bill ${purchaseNumber}`,
            createdById: user?.id,
          },
        });

        if (paid > 0 && paymentNumber) {
          const payment = await tx.payment.create({
            data: {
              paymentNumber,
              type: "SUPPLIER",
              supplierId,
              purchaseId: purchase.id,
              amount: paid,
              paymentMode,
              referenceNo: purchaseNumber,
              notes: `Payment for Purchase ${purchaseNumber}`,
              createdById: user?.id,
            },
          });

          // Supplier Debit decreases our liability
          await tx.ledgerEntry.create({
            data: {
              entityType: "SUPPLIER",
              supplierId,
              transactionType: "PAYMENT",
              referenceNo: paymentNumber,
              purchaseId: purchase.id,
              paymentId: payment.id,
              debit: paid,
              credit: 0,
              runningBalance: newBalance,
              notes: `Paid to supplier via ${paymentMode}`,
              createdById: user?.id,
            },
          });
        }
      }

      return purchase;
    }, { maxWait: 15000, timeout: 35000 });

    await recordAudit({
      userId: user?.id,
      userName: user?.name,
      action: "CREATE",
      module: "PURCHASE",
      recordId: result.id,
      recordTitle: result.purchaseNumber,
      details: `Created purchase order ${result.purchaseNumber} from ${result.supplier.name} (Total: ₹${result.grandTotal})`,
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    console.error("Purchases POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
