"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import DataTable, { Column } from "@/components/ui/DataTable";
import { formatINR, formatDate } from "@/lib/format";
import { TrendingUp, Printer, Download } from "lucide-react";
import { exportToCSV } from "@/lib/export";

export default function SalesReportPage() {
  const [sales, setSales] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/sales");
      const json = await res.json();
      if (json.success) setSales(json.data);
    }
    load();
  }, []);

  const totalSales = sales.reduce((acc, s) => acc + s.grandTotal, 0);
  const totalTax = sales.reduce((acc, s) => acc + s.taxAmount, 0);

  const columns: Column<any>[] = [
    {
      header: "Invoice #",
      accessorKey: "invoiceNumber",
      cell: (row) => <span className="font-mono font-bold text-xs">{row.invoiceNumber}</span>,
    },
    {
      header: "Date",
      accessorKey: "date",
      cell: (row) => <span className="text-xs text-slate-600">{formatDate(row.date)}</span>,
    },
    {
      header: "Customer",
      cell: (row) => <span className="font-semibold text-xs text-slate-800">{row.customer.name}</span>,
    },
    {
      header: "Payment Mode",
      accessorKey: "paymentMode",
      cell: (row) => (
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
          {row.paymentMode}
        </span>
      ),
    },
    {
      header: "Taxable Value (₹)",
      accessorKey: "taxableAmount",
      className: "text-right",
      cell: (row) => <span className="font-mono text-xs">{formatINR(row.taxableAmount)}</span>,
    },
    {
      header: "GST Tax (₹)",
      accessorKey: "taxAmount",
      className: "text-right",
      cell: (row) => <span className="font-mono text-xs text-orange-600">{formatINR(row.taxAmount)}</span>,
    },
    {
      header: "Invoice Total (₹)",
      accessorKey: "grandTotal",
      className: "text-right",
      cell: (row) => <span className="font-mono text-xs font-black text-slate-900">{formatINR(row.grandTotal)}</span>,
    },
  ];

  const handleExportCSV = () => {
    const headers = ["Invoice #", "Date", "Customer", "Payment Mode", "Taxable Amount (₹)", "GST Tax (₹)", "Grand Total (₹)"];
    const rows = sales.map((s) => [
      s.invoiceNumber,
      formatDate(s.date),
      s.customer?.name || "Cash Customer",
      s.paymentMode,
      s.taxableAmount,
      s.taxAmount,
      s.grandTotal,
    ]);
    exportToCSV(`Sales_Report_${new Date().toISOString().split("T")[0]}`, headers, rows);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between no-print">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-orange-600" />
              <span>Sales Turnover Report</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive report of daily and monthly material billings
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="rounded-lg bg-white border border-slate-200 px-3 py-1.5 shadow-xs text-right">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Billed</p>
              <p className="text-sm font-black text-orange-600 font-mono">{formatINR(totalSales)}</p>
            </div>
            <div className="rounded-lg bg-white border border-slate-200 px-3 py-1.5 shadow-xs text-right">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total GST</p>
              <p className="text-sm font-black text-slate-800 font-mono">{formatINR(totalTax)}</p>
            </div>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Download className="h-4 w-4 text-slate-600" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-orange-500 shadow-md shadow-orange-600/20"
            >
              <Printer className="h-4 w-4" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={sales}
          searchKey="invoiceNumber"
          searchPlaceholder="Search invoice..."
          pageSize={12}
        />
      </div>
    </AppLayout>
  );
}
