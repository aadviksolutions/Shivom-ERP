"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import DataTable, { Column } from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import { formatINR, formatDate } from "@/lib/format";
import { Receipt, Plus, RefreshCw } from "lucide-react";

const INITIAL_EXPENSES = [
  {
    id: "exp-1",
    expenseNumber: "EXP-26/001",
    date: "2026-10-09T10:00:00Z",
    category: { name: "Freight & Transportation" },
    amount: 2500,
    paidTo: "Balaji Tempo Transport",
    paymentMode: "CASH",
    description: "Cement delivery tempo freight to Baner site",
  },
  {
    id: "exp-2",
    expenseNumber: "EXP-26/002",
    date: "2026-10-08T14:30:00Z",
    category: { name: "Labour Daily Wages" },
    amount: 1800,
    paidTo: "Yard Labour (3 Workers)",
    paymentMode: "CASH",
    description: "Unloading TMT steel rebar consignment",
  },
  {
    id: "exp-3",
    expenseNumber: "EXP-26/003",
    date: "2026-10-07T16:00:00Z",
    category: { name: "Office & Tea" },
    amount: 450,
    paidTo: "Ramesh Tea Stall",
    paymentMode: "UPI",
    description: "Weekly contractor refreshments",
  },
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>(INITIAL_EXPENSES);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState("Freight & Transportation");
  const [paidTo, setPaidTo] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [description, setDescription] = useState("");

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const newExp = {
      id: `exp-${Date.now()}`,
      expenseNumber: `EXP-26/00${expenses.length + 1}`,
      date: new Date(),
      category: { name: category },
      amount: Number(amount),
      paidTo,
      paymentMode,
      description,
    };
    setExpenses([newExp, ...expenses]);
    setIsAddOpen(false);
    setAmount(0);
    setPaidTo("");
    setDescription("");
  };

  const totalExpenseAmount = expenses.reduce((acc, e) => acc + e.amount, 0);

  const columns: Column<any>[] = [
    {
      header: "Expense #",
      accessorKey: "expenseNumber",
      cell: (row) => (
        <span className="font-mono font-bold text-slate-900 text-xs">
          {row.expenseNumber}
        </span>
      ),
    },
    {
      header: "Date",
      accessorKey: "date",
      cell: (row) => (
        <span className="text-xs text-slate-600">{formatDate(row.date)}</span>
      ),
    },
    {
      header: "Category",
      cell: (row) => (
        <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
          {row.category?.name}
        </span>
      ),
    },
    {
      header: "Paid To",
      accessorKey: "paidTo",
      cell: (row) => (
        <span className="font-semibold text-slate-800 text-xs">{row.paidTo}</span>
      ),
    },
    {
      header: "Mode",
      accessorKey: "paymentMode",
      cell: (row) => (
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 uppercase">
          {row.paymentMode}
        </span>
      ),
    },
    {
      header: "Description",
      accessorKey: "description",
      cell: (row) => (
        <span className="text-xs text-slate-500">{row.description}</span>
      ),
    },
    {
      header: "Amount (₹)",
      accessorKey: "amount",
      className: "text-right",
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-rose-600">
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
              <Receipt className="h-6 w-6 text-orange-600" />
              <span>Operating Expenses</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily delivery freight, truck maintenance, unloading labour and godown utilities
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white border border-slate-200 px-3 py-1.5 shadow-xs text-right">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Expenses</p>
              <p className="text-sm font-black text-rose-600 font-mono">
                {formatINR(totalExpenseAmount)}
              </p>
            </div>
            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-orange-500 shadow-md shadow-orange-600/20"
            >
              <Plus className="h-4 w-4" />
              <span>Record Expense</span>
            </button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={expenses}
          searchKey="paidTo"
          searchPlaceholder="Search expense..."
          pageSize={12}
        />
      </div>

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Record Business Expense" maxWidth="md">
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Expense Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-orange-500 focus:outline-hidden"
            >
              <option value="Freight & Transportation">Freight & Transportation (Tempo/Truck)</option>
              <option value="Labour Daily Wages">Labour Daily Wages (Unloading/Loading)</option>
              <option value="Godown Rent & Utilities">Godown Rent & Electricity</option>
              <option value="Vehicle Fuel & Maintenance">Vehicle Fuel & Diesel</option>
              <option value="Office & Tea">Office & Tea Expenses</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Paid To (Payee Name) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={paidTo}
              onChange={(e) => setPaidTo(e.target.value)}
              placeholder="e.g. Tempo Driver, Daily Labour"
              className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-orange-500 focus:outline-hidden"
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
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="0.00"
              className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-mono font-bold focus:border-orange-500 focus:outline-hidden"
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
              <option value="UPI">UPI / GPay</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Remarks
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 50 bags cement delivery"
              className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-orange-500 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-orange-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-orange-500"
            >
              Save Expense
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
