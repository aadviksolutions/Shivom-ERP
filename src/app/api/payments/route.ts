import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // CUSTOMER or SUPPLIER
    const customerId = searchParams.get("customerId");
    const supplierId = searchParams.get("supplierId");

    const where: any = {};
    if (type) where.type = type;
    if (customerId) where.customerId = customerId;
    if (supplierId) where.supplierId = supplierId;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        customer: true,
        supplier: true,
        sale: true,
        purchase: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: payments });
  } catch (error: any) {
    console.error("Payments GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();

    const {
      type, // CUSTOMER or SUPPLIER
      customerId,
      supplierId,
      saleId,
      purchaseId,
      amount,
      paymentMode = "CASH",
      referenceNo,
      bankName,
      chequeNo,
      notes,
    } = body;

    const paymentAmount = Number(amount);
    if (!type || !paymentAmount || paymentAmount <= 0) {
      return NextResponse.json(
        { error: "Valid payment type and positive amount are required" },
        { status: 400 }
      );
    }

    if (type === "CUSTOMER" && !customerId) {
      return NextResponse.json(
        { error: "Customer is required for customer payment" },
        { status: 400 }
      );
    }

    if (type === "SUPPLIER" && !supplierId) {
      return NextResponse.json(
        { error: "Supplier is required for supplier payment" },
        { status: 400 }
      );
    }

    const count = await prisma.payment.count();
    const prefix = type === "CUSTOMER" ? "REC-26/" : "PAY-26/";
    const paymentNumber = `${prefix}${String(count + 1).padStart(4, "0")}`;

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          type,
          customerId: type === "CUSTOMER" ? customerId : null,
          supplierId: type === "SUPPLIER" ? supplierId : null,
          saleId: saleId || null,
          purchaseId: purchaseId || null,
          amount: paymentAmount,
          paymentMode,
          referenceNo: referenceNo?.trim() || null,
          bankName: bankName?.trim() || null,
          chequeNo: chequeNo?.trim() || null,
          notes: notes?.trim() || null,
          createdById: user?.id,
        },
        include: {
          customer: true,
          supplier: true,
        },
      });

      if (type === "CUSTOMER" && customerId) {
        const customer = await tx.customer.findUnique({ where: { id: customerId } });
        if (customer) {
          const newBalance = customer.currentBalance - paymentAmount;
          await tx.customer.update({
            where: { id: customerId },
            data: {
              totalPaid: customer.totalPaid + paymentAmount,
              currentBalance: newBalance,
            },
          });

          await tx.ledgerEntry.create({
            data: {
              entityType: "CUSTOMER",
              customerId,
              transactionType: "PAYMENT",
              referenceNo: paymentNumber,
              saleId: saleId || null,
              paymentId: payment.id,
              debit: 0,
              credit: paymentAmount,
              runningBalance: newBalance,
              notes: `Received payment (${paymentMode})`,
              createdById: user?.id,
            },
          });

          if (saleId) {
            const sale = await tx.sale.findUnique({ where: { id: saleId } });
            if (sale) {
              const newPaid = sale.paidAmount + paymentAmount;
              const newSaleBalance = Math.max(0, sale.grandTotal - newPaid);
              await tx.sale.update({
                where: { id: saleId },
                data: {
                  paidAmount: newPaid,
                  balanceAmount: newSaleBalance,
                  status: newSaleBalance === 0 ? "PAID" : "PARTIAL",
                },
              });
            }
          }
        }
      } else if (type === "SUPPLIER" && supplierId) {
        const supplier = await tx.supplier.findUnique({ where: { id: supplierId } });
        if (supplier) {
          const newBalance = supplier.currentBalance - paymentAmount;
          await tx.supplier.update({
            where: { id: supplierId },
            data: {
              totalPaid: supplier.totalPaid + paymentAmount,
              currentBalance: newBalance,
            },
          });

          await tx.ledgerEntry.create({
            data: {
              entityType: "SUPPLIER",
              supplierId,
              transactionType: "PAYMENT",
              referenceNo: paymentNumber,
              purchaseId: purchaseId || null,
              paymentId: payment.id,
              debit: paymentAmount,
              credit: 0,
              runningBalance: newBalance,
              notes: `Paid to supplier (${paymentMode})`,
              createdById: user?.id,
            },
          });

          if (purchaseId) {
            const purchase = await tx.purchase.findUnique({ where: { id: purchaseId } });
            if (purchase) {
              const newPaid = purchase.paidAmount + paymentAmount;
              const newPurBalance = Math.max(0, purchase.grandTotal - newPaid);
              await tx.purchase.update({
                where: { id: purchaseId },
                data: {
                  paidAmount: newPaid,
                  balanceAmount: newPurBalance,
                  status: newPurBalance === 0 ? "PAID" : "PARTIAL",
                },
              });
            }
          }
        }
      }

      return payment;
    });

    await recordAudit({
      userId: user?.id,
      userName: user?.name,
      action: "PAYMENT",
      module: "PAYMENT",
      recordId: result.id,
      recordTitle: result.paymentNumber,
      details: `Recorded ${result.type} payment ${result.paymentNumber} of ₹${result.amount}`,
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    console.error("Payments POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
