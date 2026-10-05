import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { calculateGSTBreakdown } from "@/lib/format";

export async function GET() {
  try {
    const quotations = await prisma.quotation.findMany({
      include: {
        customer: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: quotations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { customerId, items, isInterState = false, notes, terms, validDays = 15 } = body;

    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Customer and items are required" },
        { status: 400 }
      );
    }

    const company = await prisma.company.findFirst() || {
      quotationPrefix: "QTN-26/",
    };

    const count = await prisma.quotation.count();
    const quotationNumber = `${company.quotationPrefix}${String(count + 1).padStart(4, "0")}`;

    let subtotal = 0;
    let totalDiscount = 0;
    let taxableAmount = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;
    let taxAmount = 0;
    let grandTotal = 0;

    const quotationItemsData = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) continue;

      const qty = Number(item.quantity) || 1;
      const rate = Number(item.rate) || product.salePrice;
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

      quotationItemsData.push({
        productId: product.id,
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
    }

    const validUntil = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000);

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        customerId,
        date: new Date(),
        validUntil,
        status: "DRAFT",
        subtotal,
        discount: totalDiscount,
        taxableAmount,
        cgstAmount,
        sgstAmount,
        igstAmount,
        taxAmount,
        grandTotal,
        notes: notes?.trim() || null,
        terms: terms?.trim() || null,
        createdById: user?.id,
        items: {
          create: quotationItemsData,
        },
      },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });

    return NextResponse.json({ success: true, data: quotation }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
