"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { formatINR } from "@/lib/format";
import { TrendingUp, Printer, Download } from "lucide-react";
import { exportToCSV } from "@/lib/export";

export default function ProfitReportPage() {
  const [sales, setSales] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/sales");
      const json = await res.json();
      if (json.success) setSales(json.data);
    }
    load();
  }, []);

  let totalSalesValue = 0;
  let totalEstimatedCost = 0;

  sales.forEach((s) => {
    totalSalesValue += s.taxableAmount;
    s.items?.forEach((i: any) => {
      const purchaseCost = i.product?.purchasePrice || (i.rate * 0.82);
      totalEstimatedCost += purchaseCost * i.quantity;
    });
  });

  const grossProfit = Math.max(0, totalSalesValue - totalEstimatedCost);
  const profitMargin = totalSalesValue > 0 ? ((grossProfit / totalSalesValue) * 100).toFixed(1) : "0";

  const handleExportCSV = () => {
    const headers = ["Invoice #", "Customer", "Sale Value (₹)", "Est. Material Cost (₹)", "Gross Profit (₹)", "Margin %"];
    const rows = sales.map((s) => {
      let cost = 0;
      s.items?.forEach((i: any) => {
        cost += (i.product?.purchasePrice || (i.rate * 0.82)) * i.quantity;
      });
      const p = Math.max(0, s.taxableAmount - cost);
      const m = s.taxableAmount > 0 ? ((p / s.taxableAmount) * 100).toFixed(1) : "0";
      return [s.invoiceNumber, s.customer?.name || "Customer", s.taxableAmount, cost, p, `${m}%`];
    });
    exportToCSV(`Profit_Report_${new Date().toISOString().split("T")[0]}`, headers, rows);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between no-print">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
              <span>Gross Profit & Margin Report</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Gross profit estimation calculated from material purchase cost and sales realization
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Download className="h-4 w-4 text-slate-600" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
            >
              <Printer className="h-4 w-4" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* Profit Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <span className="text-xs font-bold uppercase text-slate-400">Total Net Sales</span>
            <h3 className="text-2xl font-black text-slate-900 mt-2 font-mono">
              {formatINR(totalSalesValue)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Excluding GST taxes</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <span className="text-xs font-bold uppercase text-slate-400">Cost of Goods Sold (COGS)</span>
            <h3 className="text-2xl font-black text-slate-700 mt-2 font-mono">
              {formatINR(totalEstimatedCost)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Direct material acquisition cost</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <span className="text-xs font-bold uppercase text-slate-400">Gross Profit (₹)</span>
            <h3 className="text-2xl font-black text-emerald-600 mt-2 font-mono">
              {formatINR(grossProfit)}
            </h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">Realized Gross Margin</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <span className="text-xs font-bold uppercase text-slate-400">Profit Margin %</span>
            <h3 className="text-2xl font-black text-emerald-600 mt-2 font-mono">
              {profitMargin}%
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Healthy hardware benchmark &gt;12%</p>
          </div>
        </div>

        {/* Invoice-wise Margin Breakdown Table */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Invoice-Wise Profit Contribution</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Invoice #</th>
                  <th className="px-4 py-2.5">Customer</th>
                  <th className="px-4 py-2.5 text-right">Sale Value (₹)</th>
                  <th className="px-4 py-2.5 text-right">Est. Material Cost (₹)</th>
                  <th className="px-4 py-2.5 text-right">Gross Profit (₹)</th>
                  <th className="px-4 py-2.5 text-right">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {sales.map((s) => {
                  let cost = 0;
                  s.items?.forEach((i: any) => {
                    cost += (i.product?.purchasePrice || (i.rate * 0.82)) * i.quantity;
                  });
                  const p = Math.max(0, s.taxableAmount - cost);
                  const m = s.taxableAmount > 0 ? ((p / s.taxableAmount) * 100).toFixed(1) : "0";

                  return (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-bold text-slate-900">{s.invoiceNumber}</td>
                      <td className="px-4 py-2.5 font-sans font-semibold text-slate-800">
                        {s.customer.name}
                      </td>
                      <td className="px-4 py-2.5 text-right">{formatINR(s.taxableAmount)}</td>
                      <td className="px-4 py-2.5 text-right text-slate-500">{formatINR(cost)}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-emerald-600">
                        {formatINR(p)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-slate-900">{m}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
