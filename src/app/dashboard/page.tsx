"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import StatusBadge from "@/components/ui/StatusBadge";
import PrintableInvoice from "@/components/invoice/PrintableInvoice";
import { formatINR, formatDate } from "@/lib/format";
import { useAuth } from "@/lib/AuthContext";
import {
  ShoppingCart,
  Truck,
  ArrowDownLeft,
  AlertTriangle,
  Plus,
  PackagePlus,
  CreditCard,
  Eye,
  RefreshCw,
  FileText,
  Boxes,
  Package,
  SlidersHorizontal,
  Users,
  ShieldAlert,
} from "lucide-react";

function DashboardContent() {
  const searchParams = useSearchParams();
  const deniedParam = searchParams.get("denied");

  const { user } = useAuth();
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

  const role = user?.role || "ADMIN";
  const isStore = role === "STORE";
  const isBilling = role === "BILLING";
  const isAdmin = role === "ADMIN";

  const kpis = data?.kpis || {
    todaySales: 0,
    todaySalesCount: 0,
    todayPurchase: 0,
    todayPurchaseCount: 0,
    todayCollection: 0,
    totalReceivable: 0,
    totalPayable: 0,
    currentStockValue: 0,
    totalProductsCount: 0,
    lowStockCount: 0,
  };

  const lowStockItems = data?.lowStockItems || [];
  const recentSales = data?.recentSales || [];
  const recentPurchases = data?.recentPurchases || [];

  return (
    <AppLayout lowStockCount={kpis.lowStockCount}>
      <div className="space-y-6">
        {/* Access Denied Alert if redirected by middleware */}
        {deniedParam && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
              <div>
                <span className="font-bold block">Access Restricted</span>
                <span>
                  You do not have administrative clearance to access the requested module ({deniedParam}).
                </span>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="px-2.5 py-1 bg-white border border-rose-300 rounded-md text-rose-700 font-bold hover:bg-rose-100"
            >
              Dismiss
            </Link>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-[#24282c] flex items-center gap-2">
              <span>
                {isAdmin
                  ? "Executive Dashboard"
                  : isBilling
                  ? "Sales & Billing Desk"
                  : "Store & Inventory Control"}
              </span>
              <span className="rounded-md bg-orange-100 px-2 py-0.5 text-xs font-bold text-[#e16718]">
                {company?.name || "Shivom Construction"}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAdmin
                ? "Building Material Supply • Complete business & operations summary"
                : isBilling
                ? "Active Sales Counter & Customer Receivables Tracking"
                : "Godown Stock Levels, Material Inward & Low Stock Alerts"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-[#e16718]" : ""}`} />
              <span>Refresh</span>
            </button>

            {isStore ? (
              <Link
                href="/purchase"
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>New Purchase</span>
              </Link>
            ) : (
              <Link
                href="/sales/new"
                className="flex items-center gap-1.5 rounded-lg bg-[#e16718] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#c9550e] transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>New Billing</span>
              </Link>
            )}
          </div>
        </div>

        {/* 1. ROLE-BASED KPI SUMMARY CARDS */}
        {isStore ? (
          /* STORE / INVENTORY KPI CARDS */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Low Stock Items */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Low Stock Alert</span>
                <div
                  className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                    kpis.lowStockCount > 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-[#24282c]">
                  {kpis.lowStockCount} <span className="text-xs font-normal text-slate-500">items</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {kpis.lowStockCount > 0 ? "Requires reordering soon" : "All products within safe stock"}
                </p>
              </div>
            </div>

            {/* Total Products */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Catalog Products</span>
                <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Package className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-[#24282c]">{kpis.totalProductsCount}</div>
                <p className="text-[11px] text-slate-500 mt-1">Total active material SKUs in catalog</p>
              </div>
            </div>

            {/* Stock Valuation */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Stock Valuation</span>
                <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Boxes className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-[#24282c]">
                  {formatINR(kpis.currentStockValue)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Calculated at purchase valuation</p>
              </div>
            </div>

            {/* Today's Inward Purchases */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Today&apos;s Goods Inward</span>
                <div className="h-9 w-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Truck className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-[#24282c]">
                  {kpis.todayPurchaseCount} <span className="text-xs font-normal text-slate-500">entries</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Inward purchase receipts recorded</p>
              </div>
            </div>
          </div>
        ) : isBilling ? (
          /* BILLING / SALES KPI CARDS */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Today's Sales */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Today&apos;s Sales</span>
                <div className="h-9 w-9 rounded-lg bg-orange-50 text-[#e16718] flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-[#24282c]">{formatINR(kpis.todaySales)}</div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {kpis.todaySalesCount} bill(s) generated today
                </p>
              </div>
            </div>

            {/* Today's Collection */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Today&apos;s Collection</span>
                <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ArrowDownLeft className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-[#24282c]">
                  {formatINR(kpis.todayCollection)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Cash, UPI & Bank receipts</p>
              </div>
            </div>

            {/* Customer Outstanding */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Customer Outstanding</span>
                <div className="h-9 w-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <CreditCard className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-rose-600">
                  {formatINR(kpis.totalReceivable)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Pending balance due from customers</p>
              </div>
            </div>

            {/* Low Stock Warning */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Stock Availability</span>
                <div className="h-9 w-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-[#24282c]">
                  {kpis.lowStockCount} <span className="text-xs font-normal text-slate-500">low</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Check stock before high-volume billing</p>
              </div>
            </div>
          </div>
        ) : (
          /* OWNER / ADMIN KPI CARDS */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Today's Sales */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Today&apos;s Sales</span>
                <div className="h-9 w-9 rounded-lg bg-orange-50 text-[#e16718] flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-[#24282c]">{formatINR(kpis.todaySales)}</div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {kpis.todaySalesCount} bill(s) generated today
                </p>
              </div>
            </div>

            {/* Card 2: Today's Collection */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Today&apos;s Collection</span>
                <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ArrowDownLeft className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-[#24282c]">
                  {formatINR(kpis.todayCollection)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Cash, UPI & Bank receipts</p>
              </div>
            </div>

            {/* Card 3: Customer Outstanding */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Customer Outstanding</span>
                <div className="h-9 w-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <CreditCard className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-rose-600">
                  {formatINR(kpis.totalReceivable)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Pending balance due from customers</p>
              </div>
            </div>

            {/* Card 4: Low Stock Items */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Low Stock Items</span>
                <div
                  className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                    kpis.lowStockCount > 0 ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-[#24282c]">
                  {kpis.lowStockCount} <span className="text-xs font-normal text-slate-500">items</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {kpis.lowStockCount > 0 ? "Requires reordering soon" : "Stock levels are healthy"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. ROLE-TAILORED QUICK ACTIONS */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {isStore ? (
              <>
                <Link
                  href="/purchase"
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-blue-100 bg-blue-50/70 hover:bg-blue-100/70 text-[#24282c] transition-all cursor-pointer group"
                >
                  <div className="h-10 w-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-[#24282c]">Goods Inward</span>
                    <span className="block text-[11px] text-slate-500">New Purchase Bill</span>
                  </div>
                </Link>

                <Link
                  href="/products"
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/70 hover:bg-emerald-100/70 text-[#24282c] transition-all cursor-pointer group"
                >
                  <div className="h-10 w-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <PackagePlus className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-[#24282c]">Add Product</span>
                    <span className="block text-[11px] text-slate-500">Update Catalog</span>
                  </div>
                </Link>

                <Link
                  href="/inventory/adjustments"
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-amber-100 bg-amber-50/70 hover:bg-amber-100/70 text-[#24282c] transition-all cursor-pointer group"
                >
                  <div className="h-10 w-10 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <SlidersHorizontal className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-[#24282c]">Stock Adjustment</span>
                    <span className="block text-[11px] text-slate-500">Godown Variance</span>
                  </div>
                </Link>

                <Link
                  href="/inventory/stock"
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-purple-100 bg-purple-50/70 hover:bg-purple-100/70 text-[#24282c] transition-all cursor-pointer group"
                >
                  <div className="h-10 w-10 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Boxes className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-[#24282c]">Current Stock</span>
                    <span className="block text-[11px] text-slate-500">Check Yard Quantities</span>
                  </div>
                </Link>
              </>
            ) : isBilling ? (
              <>
                <Link
                  href="/sales/new"
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-orange-100 bg-orange-50/70 hover:bg-orange-100/70 text-[#24282c] transition-all cursor-pointer group"
                >
                  <div className="h-10 w-10 rounded-lg bg-[#e16718] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-[#24282c]">New Billing</span>
                    <span className="block text-[11px] text-slate-500">Create GST Invoice</span>
                  </div>
                </Link>

                <Link
                  href="/sales"
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-blue-100 bg-blue-50/70 hover:bg-blue-100/70 text-[#24282c] transition-all cursor-pointer group"
                >
                  <div className="h-10 w-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-[#24282c]">Sales Invoices</span>
                    <span className="block text-[11px] text-slate-500">View All Bills</span>
                  </div>
                </Link>

                <Link
                  href="/customers"
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/70 hover:bg-emerald-100/70 text-[#24282c] transition-all cursor-pointer group"
                >
                  <div className="h-10 w-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-[#24282c]">Customers</span>
                    <span className="block text-[11px] text-slate-500">Directory & Ledger</span>
                  </div>
                </Link>

                <Link
                  href="/payments?type=CUSTOMER"
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-purple-100 bg-purple-50/70 hover:bg-purple-100/70 text-[#24282c] transition-all cursor-pointer group"
                >
                  <div className="h-10 w-10 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-[#24282c]">Receive Payment</span>
                    <span className="block text-[11px] text-slate-500">Record Customer Dues</span>
                  </div>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/sales/new"
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-orange-100 bg-orange-50/70 hover:bg-orange-100/70 text-[#24282c] transition-all cursor-pointer group"
                >
                  <div className="h-10 w-10 rounded-lg bg-[#e16718] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-[#24282c]">New Billing</span>
                    <span className="block text-[11px] text-slate-500">Create GST Invoice</span>
                  </div>
                </Link>

                <Link
                  href="/purchase"
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-blue-100 bg-blue-50/70 hover:bg-blue-100/70 text-[#24282c] transition-all cursor-pointer group"
                >
                  <div className="h-10 w-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-[#24282c]">New Purchase</span>
                    <span className="block text-[11px] text-slate-500">Goods Inward Entry</span>
                  </div>
                </Link>

                <Link
                  href="/products"
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/70 hover:bg-emerald-100/70 text-[#24282c] transition-all cursor-pointer group"
                >
                  <div className="h-10 w-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <PackagePlus className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-[#24282c]">Add Product</span>
                    <span className="block text-[11px] text-slate-500">Hardware Catalog</span>
                  </div>
                </Link>

                <Link
                  href="/payments?type=CUSTOMER"
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-purple-100 bg-purple-50/70 hover:bg-purple-100/70 text-[#24282c] transition-all cursor-pointer group"
                >
                  <div className="h-10 w-10 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-[#24282c]">Receive Payment</span>
                    <span className="block text-[11px] text-slate-500">Customer Dues</span>
                  </div>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* 3. LOW STOCK ALERT SECTION */}
        {lowStockItems.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Attention Required: Low Stock Items ({lowStockItems.length})
                </h3>
              </div>
              <Link
                href="/purchase"
                className="text-xs font-bold text-amber-800 hover:text-amber-900 underline"
              >
                Create Purchase Order &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {lowStockItems.slice(0, 6).map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-amber-200/80 text-xs shadow-2xs"
                >
                  <div className="truncate pr-2">
                    <span className="font-bold text-[#24282c] block truncate">{item.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">SKU: {item.sku}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-rose-600 block">
                      {item.currentStock} {item.unit?.code}
                    </span>
                    <span className="text-[10px] text-slate-500">Min: {item.minStockLevel}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. RECENT TRANSACTIONS TABLE (ROLE TAILED) */}
        {isStore ? (
          /* Recent Goods Inward (Purchases) for STORE */
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-[#24282c]">Recent Goods Inward</h2>
                <p className="text-xs text-slate-500">Latest supplier purchase receipts</p>
              </div>
              <Link
                href="/purchase"
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>View All Inward</span>
                <span>&rarr;</span>
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Bill Number</th>
                    <th className="py-2.5 px-3">Supplier</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentPurchases.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        <Truck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        No recent purchase entries found.
                      </td>
                    </tr>
                  ) : (
                    recentPurchases.map((pur: any) => (
                      <tr key={pur.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-3 text-slate-600 font-medium whitespace-nowrap">
                          {formatDate(pur.date)}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {pur.billNumber || pur.invoiceNumber || pur.id.slice(-6)}
                        </td>
                        <td className="py-3 px-3 text-slate-800 font-medium">
                          {pur.supplier?.name || "Direct Supplier"}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                          {formatINR(pur.grandTotal)}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <StatusBadge status={pur.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Recent Sales Transactions for BILLING & ADMIN */
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-[#24282c]">Recent Transactions</h2>
                <p className="text-xs text-slate-500">Latest sales invoices generated</p>
              </div>
              <Link
                href="/sales"
                className="text-xs font-bold text-[#e16718] hover:underline flex items-center gap-1"
              >
                <span>View All Sales</span>
                <span>&rarr;</span>
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Invoice Number</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-center">Payment Status</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentSales.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        No recent sales found. Create your first bill above.
                      </td>
                    </tr>
                  ) : (
                    recentSales.map((sale: any) => (
                      <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-3 text-slate-600 font-medium whitespace-nowrap">
                          {formatDate(sale.date)}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {sale.invoiceNumber}
                        </td>
                        <td className="py-3 px-3 text-slate-800 font-medium">
                          {sale.customer?.name || "Walk-in Customer"}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                          {formatINR(sale.grandTotal)}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <StatusBadge status={sale.status} />
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => setSelectedInvoice(sale)}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Eye className="h-3 w-3 text-slate-500" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Printable Invoice Modal */}
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

export default function DashboardPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-[#16181b] text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 border-3 border-[#e16718] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-300">Loading Shivom ERP dashboard...</p>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </React.Suspense>
  );
}
