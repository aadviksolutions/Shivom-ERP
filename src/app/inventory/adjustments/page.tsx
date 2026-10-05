"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import DataTable, { Column } from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format";
import { SlidersHorizontal, RefreshCw } from "lucide-react";

export default function StockAdjustmentsPage() {
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdjustments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory/adjustments");
      const json = await res.json();
      if (json.success) setAdjustments(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdjustments();
  }, []);

  const columns: Column<any>[] = [
    {
      header: "Date & Time",
      accessorKey: "createdAt",
      sortable: true,
      cell: (row) => (
        <span className="text-xs text-slate-600">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      header: "Product / Material",
      cell: (row) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{row.product.name}</span>
          <span className="text-[10px] text-slate-400 font-mono">SKU: {row.product.sku}</span>
        </div>
      ),
    },
    {
      header: "Godown / Yard",
      cell: (row) => (
        <span className="text-xs text-slate-600">{row.warehouse?.name || "Main Yard"}</span>
      ),
    },
    {
      header: "Adjustment Type",
      accessorKey: "type",
      cell: (row) => (
        <StatusBadge
          status={row.type === "ADJUSTMENT_INCREASE" ? "+ Increase" : "- Decrease"}
          variant={row.type === "ADJUSTMENT_INCREASE" ? "success" : "danger"}
          size="sm"
        />
      ),
    },
    {
      header: "Quantity",
      accessorKey: "quantity",
      className: "text-right",
      cell: (row) => (
        <span
          className={`font-mono text-xs font-bold ${
            row.quantity > 0 ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {row.quantity > 0 ? `+${row.quantity}` : row.quantity}
        </span>
      ),
    },
    {
      header: "Balance After",
      accessorKey: "balanceAfter",
      className: "text-right",
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-slate-900">
          {row.balanceAfter}
        </span>
      ),
    },
    {
      header: "Reason / Verification Notes",
      accessorKey: "reason",
      cell: (row) => (
        <span className="text-xs text-slate-700 italic">{row.reason || "-"}</span>
      ),
    },
    {
      header: "Adjusted By",
      cell: (row) => (
        <span className="text-xs text-slate-500 font-medium">
          {row.createdBy?.name || "Store Admin"}
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
              <SlidersHorizontal className="h-6 w-6 text-orange-600" />
              <span>Stock Adjustment Audit Log</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Traceable record of all manual physical inventory corrections and variance reconciliations
            </p>
          </div>

          <button
            onClick={fetchAdjustments}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-orange-600" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        <DataTable
          columns={columns}
          data={adjustments}
          searchPlaceholder="Search adjustment notes..."
          pageSize={12}
        />
      </div>
    </AppLayout>
  );
}
