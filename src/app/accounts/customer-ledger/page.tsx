"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import SearchableSelect, { Option } from "@/components/ui/SearchableSelect";
import { formatINR, formatDate } from "@/lib/format";
import { BookOpen, Printer, Download } from "lucide-react";

export default function CustomerLedgerPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadCustomers() {
      const res = await fetch("/api/customers");
      const json = await res.json();
      if (json.success) {
        setCustomers(json.data);
        if (json.data.length > 0) setSelectedCustomerId(json.data[0].id);
      }
    }
    loadCustomers();
  }, []);

  useEffect(() => {
    if (!selectedCustomerId) return;
    async function loadLedger() {
      setLoading(true);
      try {
        const res = await fetch(`/api/accounts/ledger?type=CUSTOMER&id=${selectedCustomerId}`);
        const json = await res.json();
        if (json.success) setEntries(json.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadLedger();
  }, [selectedCustomerId]);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const customerOptions: Option[] = customers.map((c) => ({
    value: c.id,
    label: c.name,
    sublabel: `Mob: ${c.mobile} | Balance: ${formatINR(c.currentBalance)}`,
  }));

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between no-print">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-orange-600" />
              <span>Customer Statement of Account (Ledger)</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Itemized debits, credits and real-time running balances
            </p>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-orange-500 shadow-md shadow-orange-600/20"
          >
            <Printer className="h-4 w-4" />
            <span>Print Statement</span>
          </button>
        </div>

        {/* Customer Selector Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs no-print">
          <div className="max-w-md">
            <SearchableSelect
              label="Select Customer Account"
              options={customerOptions}
              value={selectedCustomerId}
              onChange={(val) => setSelectedCustomerId(val)}
            />
          </div>
        </div>

        {/* Printable Statement Area */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs printable-area">
          {selectedCustomer && (
            <div className="border-b border-slate-200 pb-4 mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900">{selectedCustomer.name}</h2>
                <p className="text-xs text-slate-500">
                  {selectedCustomer.address || "Address not provided"} • Mob: {selectedCustomer.mobile}
                </p>
                {selectedCustomer.gstin && (
                  <p className="text-xs text-slate-500 font-mono">GSTIN: {selectedCustomer.gstin}</p>
                )}
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs text-slate-500 uppercase font-bold">Current Balance Due</p>
                <p className="text-xl font-black text-rose-600 font-mono">
                  {formatINR(selectedCustomer.currentBalance)}
                </p>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Transaction Type</th>
                  <th className="px-3 py-2.5">Reference #</th>
                  <th className="px-3 py-2.5">Particulars / Notes</th>
                  <th className="px-3 py-2.5 text-right">Debit (Billed ₹)</th>
                  <th className="px-3 py-2.5 text-right">Credit (Paid ₹)</th>
                  <th className="px-3 py-2.5 text-right">Running Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Loading ledger entries...
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No transactions recorded for this customer.
                    </td>
                  </tr>
                ) : (
                  entries.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-medium">{formatDate(e.date)}</td>
                      <td className="px-3 py-2.5">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                          {e.transactionType}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono">{e.referenceNo || "-"}</td>
                      <td className="px-3 py-2.5 text-slate-600">{e.notes || "-"}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold text-slate-900">
                        {e.debit > 0 ? formatINR(e.debit) : "-"}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold text-emerald-600">
                        {e.credit > 0 ? formatINR(e.credit) : "-"}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">
                        {formatINR(e.runningBalance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
