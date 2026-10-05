"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import DataTable, { Column } from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatINR, getStockStatus } from "@/lib/format";
import { AlertTriangle, Truck, RefreshCw } from "lucide-react";

export default function LowStockPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLowStock = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products?lowStock=true");
      const json = await res.json();
      if (json.success) setProducts(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStock();
  }, []);

  const columns: Column<any>[] = [
    {
      header: "Product / Material",
      accessorKey: "name",
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-bold text-slate-900 block">{row.name}</span>
          <span className="text-[10px] text-slate-400 font-mono">
            SKU: {row.sku} • {row.brand?.name || "Standard"}
          </span>
        </div>
      ),
    },
    {
      header: "Current Stock",
      accessorKey: "currentStock",
      sortable: true,
      className: "text-right",
      cell: (row) => (
        <span className="font-bold font-mono text-rose-600 text-xs">
          {row.currentStock} {row.unit?.code}
        </span>
      ),
    },
    {
      header: "Min Reorder Level",
      accessorKey: "minStockLevel",
      className: "text-right",
      cell: (row) => (
        <span className="text-xs text-slate-600 font-mono">
          {row.minStockLevel} {row.unit?.code}
        </span>
      ),
    },
    {
      header: "Deficit (Need to Order)",
      className: "text-right",
      cell: (row) => {
        const deficit = Math.max(0, row.minStockLevel - row.currentStock);
        return (
          <span className="font-bold font-mono text-amber-600 text-xs">
            +{deficit} {row.unit?.code}
          </span>
        );
      },
    },
    {
      header: "Status",
      cell: (row) => {
        const s = getStockStatus(row.currentStock, row.minStockLevel);
        return <StatusBadge status={s.label} variant={s.variant} size="sm" />;
      },
    },
    {
      header: "Procure",
      className: "text-center",
      cell: (row) => (
        <Link
          href="/purchase"
          className="inline-flex items-center gap-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white px-2.5 py-1 text-xs font-semibold transition-colors"
        >
          <Truck className="h-3.5 w-3.5" />
          <span>Purchase Order</span>
        </Link>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <span>Low Stock Procurement Alerts</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Materials requiring immediate reordering to prevent construction site delays
            </p>
          </div>

          <button
            onClick={fetchLowStock}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 self-start sm:self-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-orange-600" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        <DataTable
          columns={columns}
          data={products}
          searchKey="name"
          searchPlaceholder="Search low stock items..."
          pageSize={12}
          emptyMessage="Great news! No items are currently below minimum stock level."
        />
      </div>
    </AppLayout>
  );
}
