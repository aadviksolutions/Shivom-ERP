"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import DataTable, { Column } from "@/components/ui/DataTable";
import { formatINR } from "@/lib/format";
import { ArrowDownLeft, Phone, RefreshCw } from "lucide-react";

export default function ReceivablesPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReceivables = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/customers");
      const json = await res.json();
      if (json.success) {
        // filter customers who owe money
        setCustomers(json.data.filter((c: any) => c.currentBalance > 0));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceivables();
  }, []);

  const totalReceivable = customers.reduce((acc, c) => acc + c.currentBalance, 0);

  const columns: Column<any>[] = [
    {
      header: "Customer / Firm",
      accessorKey: "name",
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{row.name}</span>
          <span className="text-[10px] text-slate-400">{row.contactPerson || row.city}</span>
        </div>
      ),
    },
    {
      header: "Mobile Number",
      accessorKey: "mobile",
      cell: (row) => (
        <span className="font-mono text-xs text-slate-700">{row.mobile}</span>
      ),
    },
    {
      header: "Total Billed",
      accessorKey: "totalSales",
      sortable: true,
      className: "text-right",
      cell: (row) => (
        <span className="font-mono text-xs text-slate-600">{formatINR(row.totalSales)}</span>
      ),
    },
    {
      header: "Total Collected",
      accessorKey: "totalPaid",
      sortable: true,
      className: "text-right",
      cell: (row) => (
        <span className="font-mono text-xs text-emerald-600 font-semibold">
          {formatINR(row.totalPaid)}
        </span>
      ),
    },
    {
      header: "Current Outstanding",
      accessorKey: "currentBalance",
      sortable: true,
      className: "text-right",
      cell: (row) => (
        <span className="font-mono text-xs font-black text-rose-600">
          {formatINR(row.currentBalance)}
        </span>
      ),
    },
    {
      header: "Credit Limit",
      accessorKey: "creditLimit",
      className: "text-right",
      cell: (row) => (
        <span className="font-mono text-xs text-slate-500">
          {row.creditLimit > 0 ? formatINR(row.creditLimit) : "No Limit"}
        </span>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <ArrowDownLeft className="h-6 w-6 text-amber-600" />
              <span>Customer Receivables (Outstanding)</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live aging balances and amounts due from contractors, builders and trade clients
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white border border-slate-200 px-3 py-1.5 shadow-xs text-right">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Market Outstanding</p>
              <p className="text-sm font-black text-rose-600 font-mono">
                {formatINR(totalReceivable)}
              </p>
            </div>
            <button
              onClick={fetchReceivables}
              disabled={loading}
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-orange-600" : ""}`} />
            </button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={customers}
          searchKey="name"
          searchPlaceholder="Search customer..."
          pageSize={12}
        />
      </div>
    </AppLayout>
  );
}
