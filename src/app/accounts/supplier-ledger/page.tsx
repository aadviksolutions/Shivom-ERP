"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import SearchableSelect, { Option } from "@/components/ui/SearchableSelect";
import { formatINR, formatDate } from "@/lib/format";
import { BookOpen, Printer } from "lucide-react";

export default function SupplierLedgerPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadSuppliers() {
      const res = await fetch("/api/suppliers");
      const json = await res.json();
      if (json.success) {
        setSuppliers(json.data);
        if (json.data.length > 0) setSelectedSupplierId(json.data[0].id);
      }
    }
    loadSuppliers();
  }, []);

  useEffect(() => {
    if (!selectedSupplierId) return;
    async function loadLedger() {
      setLoading(true);
      try {
        const res = await fetch(`/api/accounts/ledger?type=SUPPLIER&id=${selectedSupplierId}`);
        const json = await res.json();
        if (json.success) setEntries(json.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadLedger();
  }, [selectedSupplierId]);

  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId);

  const supplierOptions: Option[] = suppliers.map((s) => ({
    value: s.id,
    label: s.name,
    sublabel: `Mob: ${s.mobile} | Payable: ${formatINR(s.currentBalance)}`,
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
              <BookOpen className="h-6 w-6 text-blue-600" />
              <span>Supplier Statement of Account (Ledger)</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Itemized purchase bills, payments made and outstanding payable balances
            </p>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-500 shadow-md shadow-blue-600/20"
          >
            <Printer className="h-4 w-4" />
            <span>Print Statement</span>
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs no-print">
          <div className="max-w-md">
            <SearchableSelect
              label="Select Supplier Account"
              options={supplierOptions}
              value={selectedSupplierId}
              onChange={(val) => setSelectedSupplierId(val)}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs printable-area">
          {selectedSupplier && (
            <div className="border-b border-slate-200 pb-4 mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900">{selectedSupplier.name}</h2>
                <p className="text-xs text-slate-500">
                  {selectedSupplier.address || "Address not provided"} • Mob: {selectedSupplier.mobile}
                </p>
                {selectedSupplier.gstin && (
                  <p className="text-xs text-slate-500 font-mono">GSTIN: {selectedSupplier.gstin}</p>
                )}
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs text-slate-500 uppercase font-bold">Current Amount Payable</p>
                <p className="text-xl font-black text-rose-600 font-mono">
                  {formatINR(selectedSupplier.currentBalance)}
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
                  <th className="px-3 py-2.5 text-right">Debit (Paid ₹)</th>
                  <th className="px-3 py-2.5 text-right">Credit (Purchased ₹)</th>
                  <th className="px-3 py-2.5 text-right">Running Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Loading statement of account...
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No transactions recorded for this supplier.
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
                      <td className="px-3 py-2.5 text-right font-mono font-semibold text-blue-600">
                        {e.debit > 0 ? formatINR(e.debit) : "-"}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold text-slate-900">
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
