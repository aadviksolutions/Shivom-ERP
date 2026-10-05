"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import DataTable, { Column } from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatINR, formatDate } from "@/lib/format";
import { Plus, Users, BookOpen, CreditCard, Edit, RefreshCw, Phone, MessageSquare } from "lucide-react";

interface Customer {
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
  creditLimit: number;
  openingBalance: number;
  currentBalance: number;
  totalSales: number;
  totalPaid: number;
  notes?: string | null;
  isActive: boolean;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
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
    creditLimit: 100000,
    openingBalance: 0,
    notes: "",
  });

  // Payment Form State
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentMode: "CASH",
    referenceNo: "",
    notes: "",
  });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/customers");
      const json = await res.json();
      if (json.success) setCustomers(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
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
      creditLimit: 100000,
      openingBalance: 0,
      notes: "",
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setCurrentCustomer(c);
    setFormData({
      name: c.name,
      contactPerson: c.contactPerson || "",
      mobile: c.mobile,
      whatsapp: c.whatsapp || "",
      email: c.email || "",
      address: c.address || "",
      city: c.city || "Pune",
      state: c.state || "Maharashtra",
      stateCode: c.stateCode || "27",
      pincode: "",
      gstin: c.gstin || "",
      pan: c.pan || "",
      creditLimit: c.creditLimit,
      openingBalance: c.openingBalance,
      notes: c.notes || "",
    });
    setIsEditModalOpen(true);
  };

  const handleOpenLedger = async (c: Customer) => {
    setCurrentCustomer(c);
    setIsLedgerOpen(true);
    setLedgerLoading(true);
    try {
      const res = await fetch(`/api/accounts/ledger?type=CUSTOMER&id=${c.id}`);
      const json = await res.json();
      if (json.success) setLedgerEntries(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleOpenPayment = (c: Customer) => {
    setCurrentCustomer(c);
    setPaymentData({
      amount: c.currentBalance > 0 ? c.currentBalance : 0,
      paymentMode: "CASH",
      referenceNo: "",
      notes: "Payment from customer",
    });
    setIsPaymentModalOpen(true);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setIsAddModalOpen(false);
        fetchCustomers();
      } else {
        alert(data.error || "Failed to create customer");
      }
    } catch {
      alert("Error creating customer");
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCustomer) return;
    try {
      const res = await fetch("/api/customers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentCustomer.id, ...formData }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsEditModalOpen(false);
        fetchCustomers();
      } else {
        alert(data.error || "Failed to update customer");
      }
    } catch {
      alert("Error updating customer");
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCustomer) return;
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "CUSTOMER",
          customerId: currentCustomer.id,
          ...paymentData,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsPaymentModalOpen(false);
        fetchCustomers();
      } else {
        alert(data.error || "Failed to record payment");
      }
    } catch {
      alert("Error recording payment");
    }
  };

  const columns: Column<Customer>[] = [
    {
      header: "Customer / Firm Name",
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
      header: "Contact / Phone",
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
              title="Chat on WhatsApp"
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
      header: "Credit Limit",
      accessorKey: "creditLimit",
      sortable: true,
      className: "text-right",
      cell: (row) => (
        <span className="text-xs text-slate-500 font-mono">
          {row.creditLimit > 0 ? formatINR(row.creditLimit) : "No Limit"}
        </span>
      ),
    },
    {
      header: "Total Sales",
      accessorKey: "totalSales",
      sortable: true,
      className: "text-right",
      cell: (row) => (
        <span className="text-xs font-semibold text-slate-800 font-mono">
          {formatINR(row.totalSales)}
        </span>
      ),
    },
    {
      header: "Total Paid",
      accessorKey: "totalPaid",
      sortable: true,
      className: "text-right",
      cell: (row) => (
        <span className="text-xs text-emerald-600 font-semibold font-mono">
          {formatINR(row.totalPaid)}
        </span>
      ),
    },
    {
      header: "Outstanding Balance",
      accessorKey: "currentBalance",
      sortable: true,
      className: "text-right",
      cell: (row) => {
        const isDue = row.currentBalance > 0;
        return (
          <span
            className={`font-mono text-xs font-black ${
              isDue ? "text-rose-600" : "text-emerald-600"
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
            className="rounded p-1 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600"
            title="Receive Payment"
          >
            <CreditCard className="h-4 w-4" />
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
            title="Edit Customer"
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
        {/* Header Title & Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Users className="h-6 w-6 text-orange-600" />
              <span>Customer Master</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Builders, civil contractors, and retail trade accounts
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchCustomers}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-orange-600" : ""}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-orange-500 transition-colors shadow-md shadow-orange-600/20"
            >
              <Plus className="h-4 w-4" />
              <span>Add Customer</span>
            </button>
          </div>
        </div>

        {/* Customer Table */}
        <DataTable
          columns={columns}
          data={customers}
          searchKey="name"
          searchPlaceholder="Search customer by name or phone..."
          pageSize={12}
        />
      </div>

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Customer"
        subtitle="Register builder, developer, or contractor account"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer / Firm Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Sharma Builders & Infra Developers"
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-orange-500 focus:outline-hidden"
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
                placeholder="e.g. Rajesh Sharma"
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-orange-500 focus:outline-hidden"
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
                placeholder="10-digit mobile"
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-mono focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                WhatsApp Number
              </label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-mono focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-orange-500 focus:outline-hidden"
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
                placeholder="27AAACS8912K1ZT"
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-mono uppercase focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PAN Number
              </label>
              <input
                type="text"
                value={formData.pan}
                onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                placeholder="AAACS8912K"
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-mono uppercase focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Billing Address & Site Location
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Plot / Complex name, Area, City"
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Credit Limit (₹)
              </label>
              <input
                type="number"
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-mono focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Opening Balance (Receivable ₹)
              </label>
              <input
                type="number"
                value={formData.openingBalance}
                onChange={(e) => setFormData({ ...formData, openingBalance: Number(e.target.value) })}
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-mono focus:border-orange-500 focus:outline-hidden"
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
              className="rounded-lg bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-500 shadow-sm"
            >
              Save Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Customer"
        maxWidth="2xl"
      >
        <form onSubmit={handleUpdateCustomer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-orange-500 focus:outline-hidden"
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
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-orange-500 focus:outline-hidden"
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
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-mono focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Credit Limit (₹)
              </label>
              <input
                type="number"
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-mono focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-orange-500 focus:outline-hidden"
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
              className="rounded-lg bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-500 shadow-sm"
            >
              Update Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* Customer Ledger Statement Modal */}
      <Modal
        isOpen={isLedgerOpen}
        onClose={() => setIsLedgerOpen(false)}
        title={`Customer Statement: ${currentCustomer?.name}`}
        subtitle={`Current Outstanding: ${formatINR(currentCustomer?.currentBalance)}`}
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
                  <th className="px-3 py-2 text-right">Debit (₹)</th>
                  <th className="px-3 py-2 text-right">Credit (₹)</th>
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
                      <td className="px-3 py-2 text-right font-mono font-semibold text-slate-900">
                        {entry.debit > 0 ? formatINR(entry.debit) : "-"}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-600">
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

      {/* Receive Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Receive Customer Payment"
        subtitle={`Party: ${currentCustomer?.name} (Due: ${formatINR(currentCustomer?.currentBalance)})`}
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
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-bold font-mono focus:border-orange-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Mode
            </label>
            <select
              value={paymentData.paymentMode}
              onChange={(e) => setPaymentData({ ...paymentData, paymentMode: e.target.value })}
              className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-semibold focus:border-orange-500 focus:outline-hidden"
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI / QR Code</option>
              <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reference / UTR / Cheque Number
            </label>
            <input
              type="text"
              value={paymentData.referenceNo}
              onChange={(e) => setPaymentData({ ...paymentData, referenceNo: e.target.value })}
              placeholder="e.g. UTR-982144 or Cheque No"
              className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-orange-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes
            </label>
            <input
              type="text"
              value={paymentData.notes}
              onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
              placeholder="Optional remarks"
              className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-orange-500 focus:outline-hidden"
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
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-sm"
            >
              Save Receipt & Update Balance
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
