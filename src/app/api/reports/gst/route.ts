import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const saleItems = await prisma.saleItem.findMany({
      where: Object.keys(dateFilter).length > 0 ? { sale: { date: dateFilter } } : {},
      include: { sale: true, product: true },
    });

    const purchaseItems = await prisma.purchaseItem.findMany({
      where: Object.keys(dateFilter).length > 0 ? { purchase: { date: dateFilter } } : {},
      include: { purchase: true, product: true },
    });

    // Sales Tax Aggregations
    let totalSalesTaxable = 0;
    let totalSalesCGST = 0;
    let totalSalesSGST = 0;
    let totalSalesIGST = 0;
    let totalSalesTax = 0;

    const hsnSummary: Record<string, { hsn: string; description: string; qty: number; taxable: number; tax: number }> = {};

    for (const item of saleItems) {
      totalSalesTaxable += item.taxableAmount;
      totalSalesCGST += item.cgstAmount;
      totalSalesSGST += item.sgstAmount;
      totalSalesIGST += item.igstAmount;
      totalSalesTax += item.cgstAmount + item.sgstAmount + item.igstAmount;

      const hsn = item.hsnCode || "Other";
      if (!hsnSummary[hsn]) {
        hsnSummary[hsn] = {
          hsn,
          description: item.description || item.product.name,
          qty: 0,
          taxable: 0,
          tax: 0,
        };
      }
      hsnSummary[hsn].qty += item.quantity;
      hsnSummary[hsn].taxable += item.taxableAmount;
      hsnSummary[hsn].tax += item.cgstAmount + item.sgstAmount + item.igstAmount;
    }

    // Purchase Tax Aggregations (Input Tax Credit)
    let totalPurchaseTaxable = 0;
    let totalPurchaseCGST = 0;
    let totalPurchaseSGST = 0;
    let totalPurchaseIGST = 0;
    let totalPurchaseTax = 0;

    for (const item of purchaseItems) {
      totalPurchaseTaxable += item.taxableAmount;
      totalPurchaseCGST += item.cgstAmount;
      totalPurchaseSGST += item.sgstAmount;
      totalPurchaseIGST += item.igstAmount;
      totalPurchaseTax += item.cgstAmount + item.sgstAmount + item.igstAmount;
    }

    const netTaxPayable = Math.max(0, totalSalesTax - totalPurchaseTax);

    return NextResponse.json({
      success: true,
      data: {
        salesGST: {
          taxable: totalSalesTaxable,
          cgst: totalSalesCGST,
          sgst: totalSalesSGST,
          igst: totalSalesIGST,
          totalTax: totalSalesTax,
        },
        purchaseGST: {
          taxable: totalPurchaseTaxable,
          cgst: totalPurchaseCGST,
          sgst: totalPurchaseSGST,
          igst: totalPurchaseIGST,
          totalTax: totalPurchaseTax,
        },
        netTaxPayable,
        hsnSummary: Object.values(hsnSummary),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
