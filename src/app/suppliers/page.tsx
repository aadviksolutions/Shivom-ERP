"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import DataTable, { Column } from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import { formatINR, formatDate } from "@/lib/format";
import { Plus, Truck, BookOpen, ArrowUpRight, Edit, RefreshCw, Phone, MessageSquare } from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  contactPerson?: string | null;
  mobile: string;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state: string;
  stateCode: string;
  gstin?: string | null;
  pan?: string | null;
  openingBalance: number;
  currentBalance: number;
  totalPurchase: number;
  totalPaid: number;
  notes?: string | null;
  isActive: boolean;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState<Supplier | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    mobile: "",
    whatsapp: "",
    email: "",
    address: "",
    city: "Pune",
    state: "Maharashtra",
    stateCode: "27",
    pincode: "",
    gstin: "",
    pan: "",
    openingBalance: 0,
    notes: "",
  });

  // Payment Form State
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentMode: "BANK_TRANSFER",
    referenceNo: "",
    notes: "Payment to supplier",
  });

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/suppliers");
      const json = await res.json();
      if (json.success) setSuppliers(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      name: "",
      contactPerson: "",
      mobile: "",
      whatsapp: "",
      email: "",
      address: "",
      city: "Pune",
      state: "Maharashtra",
      stateCode: "27",
      pincode: "",
      gstin: "",
      pan: "",
      openingBalance: 0,
      notes: "",
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setCurrentSupplier(s);
    setFormData({
      name: s.name,
      contactPerson: s.contactPerson || "",
      mobile: s.mobile,
      whatsapp: s.whatsapp || "",
      email: s.email || "",
      address: s.address || "",
      city: s.city || "Pune",
      state: s.state || "Maharashtra",
      stateCode: s.stateCode || "27",
      pincode: "",
      gstin: s.gstin || "",
      pan: s.pan || "",
      openingBalance: s.openingBalance,
      notes: s.notes || "",
    });
    setIsEditModalOpen(true);
  };

  const handleOpenLedger = async (s: Supplier) => {
    setCurrentSupplier(s);
    setIsLedgerOpen(true);
    setLedgerLoading(true);
    try {
      const res = await fetch(`/api/accounts/ledger?type=SUPPLIER&id=${s.id}`);
      const json = await res.json();
      if (json.success) setLedgerEntries(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleOpenPayment = (s: Supplier) => {
    setCurrentSupplier(s);
    setPaymentData({
      amount: s.currentBalance > 0 ? s.currentBalance : 0,
      paymentMode: "BANK_TRANSFER",
      referenceNo: "",
      notes: "Payment to supplier",
    });
    setIsPaymentModalOpen(true);
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setIsAddModalOpen(false);
        fetchSuppliers();
      } else {
        alert(data.error || "Failed to create supplier");
      }
    } catch {
      alert("Error creating supplier");
    }
  };

  const handleUpdateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSupplier) return;
    try {
      const res = await fetch("/api/suppliers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentSupplier.id, ...formData }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsEditModalOpen(false);
        fetchSuppliers();
      } else {
        alert(data.error || "Failed to update supplier");
      }
    } catch {
      alert("Error updating supplier");
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSupplier) return;
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "SUPPLIER",
          supplierId: currentSupplier.id,
          ...paymentData,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsPaymentModalOpen(false);
        fetchSuppliers();
      } else {
        alert(data.error || "Failed to record payment");
      }
    } catch {
      alert("Error recording payment");
    }
  };

  const columns: Column<Supplier>[] = [
    {
      header: "Supplier / Distributor",
      accessorKey: "name",
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-bold text-slate-900 block">{row.name}</span>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
            {row.contactPerson && <span>Attn: {row.contactPerson}</span>}
            {row.city && <span>• {row.city}</span>}
          </div>
        </div>
      ),
    },
    {
      header: "Mobile / Phone",
      accessorKey: "mobile",
      cell: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700">
          <Phone className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-mono">{row.mobile}</span>
          {row.whatsapp && (
            <a
              href={`https://wa.me/91${row.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-600 hover:text-emerald-700"
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      ),
    },
    {
      header: "GSTIN",
      accessorKey: "gstin",
      cell: (row) => (
        <span className="font-mono text-xs text-slate-600">
          {row.gstin || <span className="text-slate-400 italic">Unregistered</span>}
        </span>
      ),
    },
    {
      header: "Total Purchases",
      accessorKey: "totalPurchase",
      sortable: true,
      className: "text-right",
      cell: (row) => (
        <span className="text-xs font-semibold text-slate-800 font-mono">
          {formatINR(row.totalPurchase)}
        </span>
      ),
    },
    {
      header: "Total Paid",
      accessorKey: "totalPaid",
      sortable: true,
      className: "text-right",
      cell: (row) => (
        <span className="text-xs text-blue-600 font-semibold font-mono">
          {formatINR(row.totalPaid)}
        </span>
      ),
    },
    {
      header: "Payable Balance",
      accessorKey: "currentBalance",
      sortable: true,
      className: "text-right",
      cell: (row) => {
        const isPayable = row.currentBalance > 0;
        return (
          <span
            className={`font-mono text-xs font-black ${
              isPayable ? "text-rose-600" : "text-slate-700"
            }`}
          >
            {formatINR(row.currentBalance)}
          </span>
        );
      },
    },
    {
      header: "Actions",
      className: "text-center",
      cell: (row) => (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => handleOpenPayment(row)}
            className="rounded p-1 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
            title="Make Payment"
          >
            <ArrowUpRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleOpenLedger(row)}
            className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-orange-600"
            title="View Statement of Account"
          >
            <BookOpen className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(row)}
            className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
            title="Edit Supplier"
          >
            <Edit className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Truck className="h-6 w-6 text-blue-600" />
              <span>Supplier Master</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Cement companies, steel syndicates, paint and hardware distributors
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchSuppliers}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-orange-600" : ""}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-500 transition-colors shadow-md shadow-blue-600/20"
            >
              <Plus className="h-4 w-4" />
              <span>Add Supplier</span>
            </button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={suppliers}
          searchKey="name"
          searchPlaceholder="Search supplier by name or phone..."
          pageSize={12}
        />
      </div>

      {/* Add Supplier Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Supplier"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateSupplier} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supplier / Company Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Apex Cement & Building Materials Distributors"
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value, whatsapp: formData.whatsapp || e.target.value })}
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-mono focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GSTIN Number
              </label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                placeholder="27AAHCA9014L1ZM"
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-mono uppercase focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Address & City
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Opening Payable Balance (₹)
              </label>
              <input
                type="number"
                value={formData.openingBalance}
                onChange={(e) => setFormData({ ...formData, openingBalance: Number(e.target.value) })}
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-mono focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 shadow-sm"
            >
              Save Supplier
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Supplier Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Supplier"
        maxWidth="2xl"
      >
        <form onSubmit={handleUpdateSupplier} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supplier Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number
              </label>
              <input
                type="text"
                required
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-mono focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 shadow-sm"
            >
              Update Supplier
            </button>
          </div>
        </form>
      </Modal>

      {/* Supplier Ledger Statement Modal */}
      <Modal
        isOpen={isLedgerOpen}
        onClose={() => setIsLedgerOpen(false)}
        title={`Supplier Statement: ${currentSupplier?.name}`}
        subtitle={`Current Payable: ${formatINR(currentSupplier?.currentBalance)}`}
        maxWidth="4xl"
      >
        <div className="space-y-4">
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Ref #</th>
                  <th className="px-3 py-2">Particulars / Notes</th>
                  <th className="px-3 py-2 text-right">Debit (Paid ₹)</th>
                  <th className="px-3 py-2 text-right">Credit (Billed ₹)</th>
                  <th className="px-3 py-2 text-right">Running Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {ledgerLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Loading statement of account...
                    </td>
                  </tr>
                ) : ledgerEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No ledger entries found.
                    </td>
                  </tr>
                ) : (
                  ledgerEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2">{formatDate(entry.date)}</td>
                      <td className="px-3 py-2">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                          {entry.transactionType}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono">{entry.referenceNo || "-"}</td>
                      <td className="px-3 py-2">{entry.notes || "-"}</td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-blue-600">
                        {entry.debit > 0 ? formatINR(entry.debit) : "-"}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-slate-900">
                        {entry.credit > 0 ? formatINR(entry.credit) : "-"}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                        {formatINR(entry.runningBalance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setIsLedgerOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Close Statement
            </button>
          </div>
        </div>
      </Modal>

      {/* Pay Supplier Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Make Supplier Payment"
        subtitle={`Supplier: ${currentSupplier?.name} (Payable: ${formatINR(currentSupplier?.currentBalance)})`}
        maxWidth="md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              required
              value={paymentData.amount}
              onChange={(e) => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-bold font-mono focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Mode
            </label>
            <select
              value={paymentData.paymentMode}
              onChange={(e) => setPaymentData({ ...paymentData, paymentMode: e.target.value })}
              className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-semibold focus:border-blue-500 focus:outline-hidden"
            >
              <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</option>
              <option value="CHEQUE">Cheque</option>
              <option value="UPI">UPI / QR Code</option>
              <option value="CASH">Cash</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Transaction / UTR Reference No.
            </label>
            <input
              type="text"
              value={paymentData.referenceNo}
              onChange={(e) => setPaymentData({ ...paymentData, referenceNo: e.target.value })}
              placeholder="e.g. HDFC-NEFT-99128"
              className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 shadow-sm"
            >
              Record Payment & Update Payable
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
