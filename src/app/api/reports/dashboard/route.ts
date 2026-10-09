import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isStore = user.role === "STORE";
    const isBilling = user.role === "BILLING";
    const isAdmin = user.role === "ADMIN";

    // 1. Today's Sales (ADMIN & BILLING)
    let todaySalesGrandTotal = 0;
    let todaySalesCount = 0;
    if (isAdmin || isBilling) {
      const todaySalesAgg = await prisma.sale.aggregate({
        where: {
          date: { gte: today },
          status: { notIn: ["CANCELLED", "VOID"] },
        },
        _sum: { grandTotal: true },
        _count: { id: true },
      });
      todaySalesGrandTotal = todaySalesAgg._sum.grandTotal || 0;
      todaySalesCount = todaySalesAgg._count.id || 0;
    }

    // 2. Today's Purchases (ADMIN & STORE)
    let todayPurchaseGrandTotal = 0;
    let todayPurchaseCount = 0;
    if (isAdmin || isStore) {
      const todayPurchaseAgg = await prisma.purchase.aggregate({
        where: {
          date: { gte: today },
          status: { notIn: ["CANCELLED", "VOID"] },
        },
        _sum: { grandTotal: true },
        _count: { id: true },
      });
      todayPurchaseGrandTotal = todayPurchaseAgg._sum.grandTotal || 0;
      todayPurchaseCount = todayPurchaseAgg._count.id || 0;
    }

    // 3. Today's Collection (ADMIN & BILLING)
    let todayCollectionAmount = 0;
    if (isAdmin || isBilling) {
      const todayCollectionAgg = await prisma.payment.aggregate({
        where: {
          date: { gte: today },
          type: "CUSTOMER",
        },
        _sum: { amount: true },
      });
      todayCollectionAmount = todayCollectionAgg._sum.amount || 0;
    }

    // 4. Total Receivables (ADMIN & BILLING)
    let totalReceivableBalance = 0;
    if (isAdmin || isBilling) {
      const customerBalanceAgg = await prisma.customer.aggregate({
        where: { isActive: true },
        _sum: { currentBalance: true },
        _count: { id: true },
      });
      totalReceivableBalance = customerBalanceAgg._sum.currentBalance || 0;
    }

    // 5. Total Payables (ADMIN only)
    let totalPayableBalance = 0;
    if (isAdmin) {
      const supplierBalanceAgg = await prisma.supplier.aggregate({
        where: { isActive: true },
        _sum: { currentBalance: true },
        _count: { id: true },
      });
      totalPayableBalance = supplierBalanceAgg._sum.currentBalance || 0;
    }

    // 6. Current Stock Value & Low Stock Items
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        sku: true,
        currentStock: true,
        minStockLevel: true,
        purchasePrice: true,
        salePrice: true,
        unit: { select: { code: true } },
      },
    });

    let totalStockValue = 0;
    const lowStockItems = [];

    for (const p of products) {
      totalStockValue += p.currentStock * p.purchasePrice;
      if (p.currentStock <= p.minStockLevel) {
        lowStockItems.push(p);
      }
    }

    // 7. Recent Invoices (ADMIN & BILLING)
    let recentSales: any[] = [];
    if (isAdmin || isBilling) {
      recentSales = await prisma.sale.findMany({
        take: 6,
        orderBy: { date: "desc" },
        include: { customer: true },
      });
    }

    // 8. Recent Purchases (ADMIN & STORE)
    let recentPurchases: any[] = [];
    if (isAdmin || isStore) {
      recentPurchases = await prisma.purchase.findMany({
        take: 6,
        orderBy: { date: "desc" },
        include: { supplier: true },
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          role: user.role,
          kpis: {
            todaySales: todaySalesGrandTotal,
            todaySalesCount: todaySalesCount,
            todayPurchase: todayPurchaseGrandTotal,
            todayPurchaseCount: todayPurchaseCount,
            todayCollection: todayCollectionAmount,
            totalReceivable: totalReceivableBalance,
            totalPayable: totalPayableBalance,
            currentStockValue: Math.round(totalStockValue),
            totalProductsCount: products.length,
            lowStockCount: lowStockItems.length,
          },
          lowStockItems: lowStockItems.slice(0, 6),
          recentSales,
          recentPurchases,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
