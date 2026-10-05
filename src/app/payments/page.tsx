"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import DataTable, { Column } from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import SearchableSelect, { Option } from "@/components/ui/SearchableSelect";
import { formatINR, formatDate } from "@/lib/format";
import { Plus, CreditCard, ArrowDownLeft, ArrowUpRight, RefreshCw } from "lucide-react";

import { Suspense } from "react";

function PaymentsContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") || "CUSTOMER";

  const [activeTab, setActiveTab] = useState<"CUSTOMER" | "SUPPLIER">(
    initialType === "SUPPLIER" ? "SUPPLIER" : "CUSTOMER"
  );
  const [payments, setPayments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [referenceNo, setReferenceNo] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payRes, custRes, supRes] = await Promise.all([
        fetch(`/api/payments?type=${activeTab}`),
        fetch("/api/customers"),
        fetch("/api/suppliers"),
      ]);

      const payJson = await payRes.json();
      const custJson = await custRes.json();
      const supJson = await supRes.json();

      if (payJson.success) setPayments(payJson.data);
      if (custJson.success) setCustomers(custJson.data);
      if (supJson.success) setSuppliers(supJson.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntityId || amount <= 0) {
      alert("Please select party and enter positive amount");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeTab,
          customerId: activeTab === "CUSTOMER" ? selectedEntityId : undefined,
          supplierId: activeTab === "SUPPLIER" ? selectedEntityId : undefined,
          amount,
          paymentMode,
          referenceNo,
          notes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsAddModalOpen(false);
        setAmount(0);
        setReferenceNo("");
        fetchData();
      } else {
        alert(data.error || "Failed to record payment");
      }
    } catch {
      alert("Error recording payment");
    } finally {
      setSubmitting(false);
    }
  };

  const entityOptions: Option[] =
    activeTab === "CUSTOMER"
      ? customers.map((c) => ({
          value: c.id,
          label: c.name,
          sublabel: `Mob: ${c.mobile} | Balance: ${formatINR(c.currentBalance)}`,
        }))
      : suppliers.map((s) => ({
          value: s.id,
          label: s.name,
          sublabel: `Mob: ${s.mobile} | Payable: ${formatINR(s.currentBalance)}`,
        }));

  const columns: Column<any>[] = [
    {
      header: "Receipt #",
      accessorKey: "paymentNumber",
      sortable: true,
      cell: (row) => (
        <span className="font-mono font-bold text-slate-900 text-xs">
          {row.paymentNumber}
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
      header: activeTab === "CUSTOMER" ? "Customer" : "Supplier",
      cell: (row) => (
        <span className="font-bold text-slate-800 text-xs block">
          {row.customer?.name || row.supplier?.name}
        </span>
      ),
    },
    {
      header: "Payment Mode",
      accessorKey: "paymentMode",
      cell: (row) => (
        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
          {row.paymentMode}
        </span>
      ),
    },
    {
      header: "Ref / UTR",
      accessorKey: "referenceNo",
      cell: (row) => (
        <span className="font-mono text-xs text-slate-500">
          {row.referenceNo || "-"}
        </span>
      ),
    },
    {
      header: "Amount",
      accessorKey: "amount",
      sortable: true,
      className: "text-right",
      cell: (row) => (
        <span
          className={`font-mono text-xs font-bold ${
            activeTab === "CUSTOMER" ? "text-emerald-600" : "text-blue-600"
          }`}
        >
          {formatINR(row.amount)}
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
              <CreditCard className="h-6 w-6 text-purple-600" />
              <span>Payments & Collections Register</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Record collections from contractors and payments made to raw material suppliers
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-orange-600" : ""}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-orange-500 transition-colors shadow-md shadow-orange-600/20"
            >
              <Plus className="h-4 w-4" />
              <span>{activeTab === "CUSTOMER" ? "Receive Payment" : "Make Payment"}</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab("CUSTOMER")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "CUSTOMER"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <ArrowDownLeft className="h-4 w-4" />
            <span>Customer Collections (Money In)</span>
          </button>

          <button
            onClick={() => setActiveTab("SUPPLIER")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "SUPPLIER"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>Supplier Payments (Money Out)</span>
          </button>
        </div>

        <DataTable
          columns={columns}
          data={payments}
          searchKey="paymentNumber"
          searchPlaceholder="Search receipt number..."
          pageSize={12}
        />
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={activeTab === "CUSTOMER" ? "Record Customer Collection" : "Record Supplier Payment"}
        maxWidth="md"
      >
        <form onSubmit={handleCreatePayment} className="space-y-4">
          <div>
            <SearchableSelect
              label={activeTab === "CUSTOMER" ? "Customer" : "Supplier"}
              options={entityOptions}
              value={selectedEntityId}
              onChange={(val) => setSelectedEntityId(val)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-bold font-mono focus:border-orange-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Mode
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-orange-500 focus:outline-hidden"
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI / QR Code</option>
              <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reference / UTR / Cheque No.
            </label>
            <input
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="e.g. UPI-202611 or UTR-9981"
              className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-orange-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Remarks
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional remarks"
              className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-orange-500 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`rounded-lg px-5 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-50 ${
                activeTab === "CUSTOMER"
                  ? "bg-emerald-600 hover:bg-emerald-500"
                  : "bg-blue-600 hover:bg-blue-500"
              }`}
            >
              {submitting ? "Saving..." : "Save Transaction"}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense
      fallback={
        <AppLayout>
          <div className="p-8 text-center text-xs text-slate-500">Loading payments...</div>
        </AppLayout>
      }
    >
      <PaymentsContent />
    </Suspense>
  );
}
