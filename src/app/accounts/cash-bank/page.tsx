"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Landmark, ArrowDownLeft, DollarSign } from "lucide-react";

export default function CashBankPage() {
  const [company, setCompany] = useState<any>(null);

  useEffect(() => {
    async function loadCompany() {
      const res = await fetch("/api/company");
      const json = await res.json();
      if (json.success) setCompany(json.data);
    }
    loadCompany();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Landmark className="h-6 w-6 text-emerald-600" />
            <span>Cash & Bank Balances</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Liquid cash-in-hand, company bank accounts and UPI settlement status
          </p>
        </div>

        {/* Bank & Cash Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-400">Cash in Counter</span>
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mt-2 font-mono">₹45,850.00</h3>
            <p className="text-[11px] text-slate-500 mt-1">Daily physical counter cash</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-400">Primary Bank A/C</span>
              <Landmark className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mt-2 font-mono">₹3,42,100.00</h3>
            <p className="text-[11px] text-slate-500 mt-1">
              {company?.bankName || "HDFC Bank"} • A/C ...{company?.bankAccountNo?.slice(-4) || "5678"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-400">Merchant UPI Pending</span>
              <ArrowDownLeft className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mt-2 font-mono">₹18,500.00</h3>
            <p className="text-[11px] text-slate-500 mt-1">Auto-settling to bank by midnight</p>
          </div>
        </div>

        {/* Bank Account Details Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs max-w-xl">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Registered Bank Account (For Invoices)</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Bank Name:</span>
              <span className="font-semibold text-slate-800">{company?.bankName || "HDFC Bank"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Branch:</span>
              <span className="font-semibold text-slate-800">{company?.bankBranch || "Industrial Estate Branch"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Account Number:</span>
              <span className="font-mono font-bold text-slate-900">{company?.bankAccountNo || "50200012345678"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">IFSC Code:</span>
              <span className="font-mono font-bold text-slate-900">{company?.bankIfsc || "HDFC0001234"}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">UPI ID:</span>
              <span className="font-mono font-bold text-orange-600">{company?.upiId || "shivomhardware@hdfcbank"}</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
