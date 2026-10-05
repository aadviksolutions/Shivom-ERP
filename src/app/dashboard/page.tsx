"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import KpiCard from "@/components/ui/KpiCard";
import StatusBadge from "@/components/ui/StatusBadge";
import PrintableInvoice from "@/components/invoice/PrintableInvoice";
import { formatINR, formatDate } from "@/lib/format";
import {
  TrendingUp,
  ShoppingCart,
  Truck,
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  AlertTriangle,
  Plus,
  UserPlus,
  PackagePlus,
  CreditCard,
  Eye,
  Building2,
  RefreshCw,
} from "lucide-react";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [dashRes, compRes] = await Promise.all([
        fetch("/api/reports/dashboard"),
        fetch("/api/company"),
      ]);

      const dashJson = await dashRes.json();
      const compJson = await compRes.json();

      if (dashJson.success) setData(dashJson.data);
      if (compJson.success) setCompany(compJson.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const kpis = data?.kpis || {
    todaySales: 0,
    todaySalesCount: 0,
    todayPurchase: 0,
    todayPurchaseCount: 0,
    todayCollection: 0,
    totalReceivable: 0,
    totalPayable: 0,
    currentStockValue: 0,
    lowStockCount: 0,
  };

  return (
    <AppLayout lowStockCount={kpis.lowStockCount}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <span>Owner Dashboard</span>
              <span className="rounded-md bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-800">
                {company?.name || "BuildStock ERP"}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live financial & inventory operations overview
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-orange-600" : ""}`} />
              <span>Refresh</span>
            </button>
            <Link
              href="/sales/new"
              className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-orange-500 transition-colors shadow-md shadow-orange-600/20"
            >
              <Plus className="h-4 w-4" />
              <span>New Sale (POS)</span>
            </Link>
          </div>
        </div>

        {/* Quick Action Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Link
            href="/sales/new"
            className="flex flex-col items-center justify-center p-3 rounded-xl border border-orange-100 bg-orange-50/70 hover:bg-orange-100/70 text-orange-800 transition-colors text-center shadow-xs"
          >
            <ShoppingCart className="h-5 w-5 mb-1.5 text-orange-600" />
            <span className="text-xs font-bold">New Sale</span>
            <span className="text-[10px] text-orange-600/80">POS Billing</span>
          </Link>

          <Link
            href="/purchase"
            className="flex flex-col items-center justify-center p-3 rounded-xl border border-blue-100 bg-blue-50/70 hover:bg-blue-100/70 text-blue-800 transition-colors text-center shadow-xs"
          >
            <Truck className="h-5 w-5 mb-1.5 text-blue-600" />
            <span className="text-xs font-bold">New Purchase</span>
            <span className="text-[10px] text-blue-600/80">Goods Inward</span>
          </Link>

          <Link
            href="/customers"
            className="flex flex-col items-center justify-center p-3 rounded-xl border border-emerald-100 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-800 transition-colors text-center shadow-xs"
          >
            <UserPlus className="h-5 w-5 mb-1.5 text-emerald-600" />
            <span className="text-xs font-bold">New Customer</span>
            <span className="text-[10px] text-emerald-600/80">Builder / Party</span>
          </Link>

          <Link
            href="/payments?type=CUSTOMER"
            className="flex flex-col items-center justify-center p-3 rounded-xl border border-purple-100 bg-purple-50/70 hover:bg-purple-100/70 text-purple-800 transition-colors text-center shadow-xs"
          >
            <CreditCard className="h-5 w-5 mb-1.5 text-purple-600" />
            <span className="text-xs font-bold">Receive Payment</span>
            <span className="text-[10px] text-purple-600/80">Collection</span>
          </Link>

          <Link
            href="/products"
            className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 transition-colors text-center shadow-xs col-span-2 sm:col-span-1"
          >
            <PackagePlus className="h-5 w-5 mb-1.5 text-slate-700" />
            <span className="text-xs font-bold">Add Product</span>
            <span className="text-[10px] text-slate-500">Hardware item</span>
          </Link>
        </div>

        {/* Low Stock Banner Alert */}
        {kpis.lowStockCount > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-200/80 p-2 text-amber-800">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  Stock Alert: {kpis.lowStockCount} Items Below Reorder Level
                </h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  Items like TMT bars or cement bags require immediate procurement to avoid stockouts.
                </p>
              </div>
            </div>
            <Link
              href="/inventory/low-stock"
              className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-500 transition-colors shrink-0"
            >
              Review Low Stock
            </Link>
          </div>
        )}

        {/* Top 6 KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <KpiCard
            title="Today's Sales"
            value={formatINR(kpis.todaySales)}
            subtitle={`${kpis.todaySalesCount} Invoices generated today`}
            icon={ShoppingCart}
            color="orange"
            trend={{ value: "+14.2%", isPositive: true }}
          />

          <KpiCard
            title="Today's Purchase"
            value={formatINR(kpis.todayPurchase)}
            subtitle={`${kpis.todayPurchaseCount} Material orders received`}
            icon={Truck}
            color="blue"
          />

          <KpiCard
            title="Today's Collection"
            value={formatINR(kpis.todayCollection)}
            subtitle="Cash, UPI & Bank inflows"
            icon={ArrowDownLeft}
            color="emerald"
          />

          <KpiCard
            title="Total Receivables"
            value={formatINR(kpis.totalReceivable)}
            subtitle="Customer outstanding balance"
            icon={ArrowDownLeft}
            color="amber"
          />

          <KpiCard
            title="Total Payables"
            value={formatINR(kpis.totalPayable)}
            subtitle="Supplier / Dealer outstanding"
            icon={ArrowUpRight}
            color="rose"
          />

          <KpiCard
            title="Current Stock Value"
            value={formatINR(kpis.currentStockValue)}
            subtitle={`${kpis.totalProductsCount} SKUs across godowns`}
            icon={Boxes}
            color="purple"
          />
        </div>

        {/* Charts & Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Sales vs Purchase Bar Comparison */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Sales vs Purchase (Last 6 Months)
                </h3>
                <p className="text-xs text-slate-500">
                  Monthly turnover comparison (in ₹)
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-xs bg-orange-500 inline-block" />
                  Sales
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-xs bg-blue-500 inline-block" />
                  Purchase
                </span>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              {data?.monthlyData?.map((item: any, idx: number) => {
                const maxVal = 600000;
                const salesPercent = Math.min(100, (item.sales / maxVal) * 100);
                const purchasePercent = Math.min(100, (item.purchase / maxVal) * 100);

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{item.month}</span>
                      <div className="flex gap-4">
                        <span className="text-orange-600 font-bold">{formatINR(item.sales)}</span>
                        <span className="text-blue-600 font-bold">{formatINR(item.purchase)}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {/* Sales bar */}
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 rounded-full transition-all duration-500"
                          style={{ width: `${salesPercent}%` }}
                        />
                      </div>
                      {/* Purchase bar */}
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${purchasePercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Low Stock Items Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span>Items Needing Restock</span>
                </h3>
                <Link
                  href="/inventory/low-stock"
                  className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                >
                  View All
                </Link>
              </div>

              <div className="divide-y divide-slate-100">
                {data?.lowStockItems?.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-400">
                    All inventory levels are optimal.
                  </p>
                ) : (
                  data?.lowStockItems?.map((p: any) => (
                    <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-800">{p.name}</p>
                        <p className="text-[11px] text-slate-400">SKU: {p.sku}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-rose-600">
                          {p.currentStock} {p.unit?.code}
                        </span>
                        <p className="text-[10px] text-slate-400">
                          Min: {p.minStockLevel} {p.unit?.code}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <Link
                href="/purchase"
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                <Truck className="h-4 w-4" />
                <span>Create Purchase Inward</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity: Sales and Collections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Invoices Table */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Recent Sales Invoices
              </h3>
              <Link
                href="/sales"
                className="text-xs font-semibold text-orange-600 hover:text-orange-700"
              >
                View Invoices →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Invoice #</th>
                    <th className="px-3 py-2">Customer</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2 text-center">Status</th>
                    <th className="px-3 py-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {data?.recentSales?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        No recent sales recorded.
                      </td>
                    </tr>
                  ) : (
                    data?.recentSales?.map((sale: any) => (
                      <tr key={sale.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5 font-mono font-semibold text-slate-900">
                          {sale.invoiceNumber}
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="font-semibold text-slate-800 truncate max-w-[140px]">
                            {sale.customer.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {formatDate(sale.date)}
                          </p>
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-slate-900">
                          {formatINR(sale.grandTotal)}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <StatusBadge status={sale.status} size="sm" />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <button
                            onClick={() => setSelectedInvoice(sale)}
                            className="rounded p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                            title="View / Print Invoice"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Collections Table */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Recent Collections & Payments
              </h3>
              <Link
                href="/payments?type=CUSTOMER"
                className="text-xs font-semibold text-orange-600 hover:text-orange-700"
              >
                View Payments →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Receipt #</th>
                    <th className="px-3 py-2">Party</th>
                    <th className="px-3 py-2">Mode</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {data?.recentPayments?.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400">
                        No recent payments recorded.
                      </td>
                    </tr>
                  ) : (
                    data?.recentPayments?.map((payment: any) => (
                      <tr key={payment.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5 font-mono text-slate-700">
                          {payment.paymentNumber}
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="font-semibold text-slate-800 truncate max-w-[140px]">
                            {payment.customer?.name || payment.supplier?.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {formatDate(payment.date)}
                          </p>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                            {payment.paymentMode}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-emerald-600">
                          +{formatINR(payment.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Viewer Modal */}
      {selectedInvoice && (
        <PrintableInvoice
          sale={selectedInvoice}
          company={company}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </AppLayout>
  );
}
