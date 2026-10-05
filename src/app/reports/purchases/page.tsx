"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import DataTable, { Column } from "@/components/ui/DataTable";
import { formatINR, formatDate } from "@/lib/format";
import { BarChart3, Printer } from "lucide-react";

export default function PurchasesReportPage() {
  const [purchases, setPurchases] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/purchases");
      const json = await res.json();
      if (json.success) setPurchases(json.data);
    }
    load();
  }, []);

  const totalPurchase = purchases.reduce((acc, p) => acc + p.grandTotal, 0);

  const columns: Column<any>[] = [
    {
      header: "PO #",
      accessorKey: "purchaseNumber",
      cell: (row) => <span className="font-mono font-bold text-xs">{row.purchaseNumber}</span>,
    },
    {
      header: "Date",
      accessorKey: "date",
      cell: (row) => <span className="text-xs text-slate-600">{formatDate(row.date)}</span>,
    },
    {
      header: "Supplier",
      cell: (row) => <span className="font-semibold text-xs text-slate-800">{row.supplier.name}</span>,
    },
    {
      header: "Taxable (₹)",
      accessorKey: "taxableAmount",
      className: "text-right",
      cell: (row) => <span className="font-mono text-xs">{formatINR(row.taxableAmount)}</span>,
    },
    {
      header: "Tax (₹)",
      accessorKey: "taxAmount",
      className: "text-right",
      cell: (row) => <span className="font-mono text-xs text-blue-600">{formatINR(row.taxAmount)}</span>,
    },
    {
      header: "Total Bill (₹)",
      accessorKey: "grandTotal",
      className: "text-right",
      cell: (row) => <span className="font-mono text-xs font-black text-slate-900">{formatINR(row.grandTotal)}</span>,
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between no-print">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <span>Purchase & Procurement Report</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Material purchases, supplier billing and input tax credit record
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white border border-slate-200 px-3 py-1.5 shadow-xs text-right">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Purchases</p>
              <p className="text-sm font-black text-blue-600 font-mono">{formatINR(totalPurchase)}</p>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-500 shadow-md shadow-blue-600/20"
            >
              <Printer className="h-4 w-4" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={purchases}
          searchKey="purchaseNumber"
          searchPlaceholder="Search purchase order..."
          pageSize={12}
        />
      </div>
    </AppLayout>
  );
}
