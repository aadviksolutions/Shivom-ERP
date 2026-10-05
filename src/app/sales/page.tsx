"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import DataTable, { Column } from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import PrintableInvoice from "@/components/invoice/PrintableInvoice";
import { formatINR, formatDate } from "@/lib/format";
import { Plus, ShoppingCart, Eye, Printer, RefreshCw, FileText } from "lucide-react";

interface Sale {
  id: string;
  invoiceNumber: string;
  date: string | Date;
  dueDate?: string | Date | null;
  customerId: string;
  status: string;
  paymentMode: string;
  subtotal: number;
  discount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  customer: {
    name: string;
    mobile: string;
    address?: string | null;
    city?: string | null;
    gstin?: string | null;
  };
  items: any[];
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Sale | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchSales = async () => {
    setLoading(true);
    try {
      const [salesRes, compRes] = await Promise.all([
        fetch("/api/sales"),
        fetch("/api/company"),
      ]);

      const salesJson = await salesRes.json();
      const compJson = await compRes.json();

      if (salesJson.success) setSales(salesJson.data);
      if (compJson.success) setCompany(compJson.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const filteredSales = sales.filter((s) => {
    if (statusFilter && s.status !== statusFilter) return false;
    return true;
  });

  const columns: Column<Sale>[] = [
    {
      header: "Invoice #",
      accessorKey: "invoiceNumber",
      sortable: true,
      cell: (row) => (
        <span className="font-mono font-bold text-slate-900 text-xs">
          {row.invoiceNumber}
        </span>
      ),
    },
    {
      header: "Date",
      accessorKey: "date",
      sortable: true,
      cell: (row) => (
        <span className="text-xs text-slate-600">{formatDate(row.date)}</span>
      ),
    },
    {
      header: "Customer",
      cell: (row) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">
            {row.customer.name}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {row.customer.mobile}
          </span>
        </div>
      ),
    },
    {
      header: "Payment Mode",
      accessorKey: "paymentMode",
      cell: (row) => (
        <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 uppercase">
          {row.paymentMode}
        </span>
      ),
    },
    {
      header: "Taxable Value",
      accessorKey: "taxableAmount",
      sortable: true,
      className: "text-right",
      cell: (row) => (
        <span className="font-mono text-xs text-slate-600">
          {formatINR(row.taxableAmount)}
        </span>
      ),
    },
    {
      header: "GST Tax",
      accessorKey: "taxAmount",
      sortable: true,
      className: "text-right",
      cell: (row) => (
        <span className="font-mono text-xs text-orange-600 font-medium">
          {formatINR(row.taxAmount)}
        </span>
      ),
    },
    {
      header: "Grand Total",
      accessorKey: "grandTotal",
      sortable: true,
      className: "text-right",
      cell: (row) => (
        <span className="font-mono text-xs font-black text-slate-900">
          {formatINR(row.grandTotal)}
        </span>
      ),
    },
    {
      header: "Paid",
      accessorKey: "paidAmount",
      sortable: true,
      className: "text-right",
      cell: (row) => (
        <span className="font-mono text-xs text-emerald-600 font-semibold">
          {formatINR(row.paidAmount)}
        </span>
      ),
    },
    {
      header: "Balance Due",
      accessorKey: "balanceAmount",
      sortable: true,
      className: "text-right",
      cell: (row) => (
        <span
          className={`font-mono text-xs font-bold ${
            row.balanceAmount > 0 ? "text-rose-600" : "text-slate-400"
          }`}
        >
          {formatINR(row.balanceAmount)}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      header: "Actions",
      className: "text-center",
      cell: (row) => (
        <button
          onClick={() => setSelectedInvoice(row)}
          className="flex items-center gap-1 rounded bg-slate-100 hover:bg-orange-50 hover:text-orange-600 px-2 py-1 text-slate-700 text-xs font-semibold transition-colors mx-auto"
          title="View & Print GST Invoice"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print</span>
        </button>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-orange-600" />
              <span>Sales Invoices</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              GST compliant sales registers, customer billings and print receipts
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchSales}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
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

        <DataTable
          columns={columns}
          data={filteredSales}
          searchKey="invoiceNumber"
          searchPlaceholder="Search invoice number..."
          pageSize={12}
          filterComponent={
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-orange-500 focus:outline-hidden"
            >
              <option value="">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="PARTIAL">Partial</option>
              <option value="ISSUED">Unpaid / Issued</option>
            </select>
          }
        />
      </div>

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
