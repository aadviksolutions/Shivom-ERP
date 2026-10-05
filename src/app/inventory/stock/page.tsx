"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import DataTable, { Column } from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatINR, getStockStatus } from "@/lib/format";
import { Boxes, RefreshCw } from "lucide-react";

export default function StockPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStock = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      const json = await res.json();
      if (json.success) setProducts(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const totalStockValuation = products.reduce(
    (acc, p) => acc + p.currentStock * p.purchasePrice,
    0
  );

  const columns: Column<any>[] = [
    {
      header: "Product / Material",
      accessorKey: "name",
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-bold text-slate-900 block">{row.name}</span>
          <span className="text-[10px] text-slate-400 font-mono">
            SKU: {row.sku} • {row.category?.name || "General"}
          </span>
        </div>
      ),
    },
    {
      header: "Unit",
      cell: (row) => (
        <span className="font-bold text-slate-700 uppercase text-xs">
          {row.unit?.code || "PCS"}
        </span>
      ),
    },
    {
      header: "Purchase Cost (₹)",
      accessorKey: "purchasePrice",
      sortable: true,
      className: "text-right",
      cell: (row) => (
        <span className="font-mono text-xs text-slate-600">
          {formatINR(row.purchasePrice)}
        </span>
      ),
    },
    {
      header: "Current Quantity",
      accessorKey: "currentStock",
      sortable: true,
      className: "text-right",
      cell: (row) => (
        <span className="font-bold font-mono text-slate-900 text-xs">
          {row.currentStock} {row.unit?.code}
        </span>
      ),
    },
    {
      header: "Min Stock Alert",
      accessorKey: "minStockLevel",
      className: "text-right",
      cell: (row) => (
        <span className="text-xs text-slate-500 font-mono">
          {row.minStockLevel} {row.unit?.code}
        </span>
      ),
    },
    {
      header: "Total Stock Value (₹)",
      className: "text-right",
      cell: (row) => (
        <span className="font-bold font-mono text-slate-900 text-xs">
          {formatINR(row.currentStock * row.purchasePrice)}
        </span>
      ),
    },
    {
      header: "Inventory Status",
      cell: (row) => {
        const s = getStockStatus(row.currentStock, row.minStockLevel);
        return <StatusBadge status={s.label} variant={s.variant} size="sm" />;
      },
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Boxes className="h-6 w-6 text-purple-600" />
              <span>Current Stock & Valuation</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live valuation and inventory count across all central yards and godowns
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white border border-slate-200 px-3 py-1.5 shadow-xs text-right">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Stock Value</p>
              <p className="text-sm font-black text-purple-700 font-mono">
                {formatINR(totalStockValuation)}
              </p>
            </div>
            <button
              onClick={fetchStock}
              disabled={loading}
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-orange-600" : ""}`} />
            </button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={products}
          searchKey="name"
          searchPlaceholder="Search material stock..."
          pageSize={12}
        />
      </div>
    </AppLayout>
  );
}
