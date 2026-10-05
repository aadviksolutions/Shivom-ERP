"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import DataTable, { Column } from "@/components/ui/DataTable";
import { formatINR } from "@/lib/format";
import { DollarSign, Printer, ArrowDownLeft, ArrowUpRight } from "lucide-react";

export default function OutstandingReportPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [cRes, sRes] = await Promise.all([
        fetch("/api/customers"),
        fetch("/api/suppliers"),
      ]);
      const cJson = await cRes.json();
      const sJson = await sRes.json();
      if (cJson.success) setCustomers(cJson.data.filter((c: any) => c.currentBalance > 0));
      if (sJson.success) setSuppliers(sJson.data.filter((s: any) => s.currentBalance > 0));
      setLoading(false);
    }
    load();
  }, []);

  const totalReceivable = customers.reduce((acc, c) => acc + c.currentBalance, 0);
  const totalPayable = suppliers.reduce((acc, s) => acc + s.currentBalance, 0);

  const customerColumns: Column<any>[] = [
    {
      header: "Customer",
      accessorKey: "name",
      cell: (row) => <span className="font-bold text-xs">{row.name}</span>,
    },
    {
      header: "Mobile",
      accessorKey: "mobile",
      cell: (row) => <span className="font-mono text-xs">{row.mobile}</span>,
    },
    {
      header: "Receivable (₹)",
      accessorKey: "currentBalance",
      className: "text-right",
      cell: (row) => <span className="font-mono text-xs font-black text-rose-600">{formatINR(row.currentBalance)}</span>,
    },
  ];

  const supplierColumns: Column<any>[] = [
    {
      header: "Supplier",
      accessorKey: "name",
      cell: (row) => <span className="font-bold text-xs">{row.name}</span>,
    },
    {
      header: "Mobile",
      accessorKey: "mobile",
      cell: (row) => <span className="font-mono text-xs">{row.mobile}</span>,
    },
    {
      header: "Payable (₹)",
      accessorKey: "currentBalance",
      className: "text-right",
      cell: (row) => <span className="font-mono text-xs font-black text-rose-600">{formatINR(row.currentBalance)}</span>,
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between no-print">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-purple-600" />
              <span>Outstanding Balances Report</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Net balance comparison between market receivables and supplier liabilities
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-orange-500 shadow-md shadow-orange-600/20"
          >
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <span className="text-xs font-bold uppercase text-slate-400">Total Customer Receivables</span>
            <h3 className="text-2xl font-black text-emerald-600 mt-2 font-mono">{formatINR(totalReceivable)}</h3>
            <p className="text-[11px] text-slate-500 mt-1">{customers.length} Accounts with pending dues</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <span className="text-xs font-bold uppercase text-slate-400">Total Supplier Payables</span>
            <h3 className="text-2xl font-black text-rose-600 mt-2 font-mono">{formatINR(totalPayable)}</h3>
            <p className="text-[11px] text-slate-500 mt-1">{suppliers.length} Vendor accounts payable</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
              <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
              <span>Customer Debtors</span>
            </h3>
            <DataTable columns={customerColumns} data={customers} pageSize={8} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
              <ArrowUpRight className="h-4 w-4 text-rose-600" />
              <span>Supplier Creditors</span>
            </h3>
            <DataTable columns={supplierColumns} data={suppliers} pageSize={8} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
