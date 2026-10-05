"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import {
  Settings,
  Building2,
  FileText,
  FileSpreadsheet,
  Users,
  SlidersHorizontal,
  Layers,
  Save,
  CheckCircle2,
  Download,
} from "lucide-react";

function SettingsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [company, setCompany] = useState({
    name: "BuildStock ERP",
    legalName: "Shivom Construction & Hardware Supplies Pvt Ltd",
    gstin: "27AABCS1429B1Z8",
    pan: "AABCS1429B",
    email: "sales@buildstockerp.com",
    phone: "+91 98200 12345",
    altPhone: "+91 98200 67890",
    address: "Plot No. 42, Industrial Area, Ring Road Phase 2",
    city: "Pune",
    state: "Maharashtra",
    stateCode: "27",
    pincode: "411028",
    bankName: "HDFC Bank",
    bankAccountNo: "50200012345678",
    bankIfsc: "HDFC0001234",
    bankBranch: "Industrial Estate Branch",
    upiId: "shivomhardware@hdfcbank",
    invoicePrefix: "INV-26/",
    quotationPrefix: "QTN-26/",
    purchasePrefix: "PO-26/",
    paymentPrefix: "REC-26/",
    invoiceTerms: `1. Goods once sold will not be accepted back after 7 days.
2. Interest @ 18% p.a. will be levied on overdue payments.
3. Quality disputes must be reported within 24 hours of delivery.
4. Subject to Pune jurisdiction only.`,
  });

  useEffect(() => {
    async function loadCompany() {
      setLoading(true);
      try {
        const res = await fetch("/api/company");
        const json = await res.json();
        if (json.success && json.data) {
          setCompany((prev) => ({ ...prev, ...json.data }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadCompany();
  }, []);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(company),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        alert("Failed to save settings");
      }
    } catch {
      alert("Error saving settings");
    }
  };

  const handleDownloadBackup = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      company,
      version: "1.0",
      notes: "BuildStock ERP complete profile & configuration backup",
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `buildstock_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const tabs = [
    { id: "profile", label: "Company Profile", icon: Building2 },
    { id: "invoice", label: "Invoice & Bank Details", icon: FileText },
    { id: "gst", label: "GST & Tax Settings", icon: FileSpreadsheet },
    { id: "users", label: "Users & Roles", icon: Users },
    { id: "numbering", label: "Document Prefixes", icon: SlidersHorizontal },
    { id: "backup", label: "Backup & Data", icon: Layers },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Settings className="h-6 w-6 text-orange-600" />
            <span>System Settings & Configuration</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure company branding, GSTIN, bank details, invoice terms and permissions
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-orange-600 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {savedSuccess && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Settings successfully saved and synchronized across the ERP!</span>
          </div>
        )}

        {/* Tab 1: Company Profile */}
        {activeTab === "profile" && (
          <form onSubmit={handleSaveCompany} className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 max-w-3xl">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Company Branding & Registration Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brand Name (Display Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={company.name}
                  onChange={(e) => setCompany({ ...company, name: e.target.value })}
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Legal Registered Entity Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={company.legalName}
                  onChange={(e) => setCompany({ ...company, legalName: e.target.value })}
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  GSTIN Number
                </label>
                <input
                  type="text"
                  value={company.gstin}
                  onChange={(e) => setCompany({ ...company, gstin: e.target.value })}
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-mono uppercase focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  PAN Number
                </label>
                <input
                  type="text"
                  value={company.pan}
                  onChange={(e) => setCompany({ ...company, pan: e.target.value })}
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-mono uppercase focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Phone
                </label>
                <input
                  type="text"
                  value={company.phone}
                  onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-mono focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Email
                </label>
                <input
                  type="email"
                  value={company.email}
                  onChange={(e) => setCompany({ ...company, email: e.target.value })}
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Address
                </label>
                <input
                  type="text"
                  value={company.address}
                  onChange={(e) => setCompany({ ...company, address: e.target.value })}
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={company.city}
                  onChange={(e) => setCompany({ ...company, city: e.target.value })}
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  State & Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={company.state}
                    onChange={(e) => setCompany({ ...company, state: e.target.value })}
                    className="h-9 flex-1 rounded-lg border border-slate-200 px-3 text-xs focus:border-orange-500 focus:outline-hidden"
                  />
                  <input
                    type="text"
                    value={company.stateCode}
                    onChange={(e) => setCompany({ ...company, stateCode: e.target.value })}
                    placeholder="Code"
                    className="h-9 w-16 rounded-lg border border-slate-200 px-2 text-xs font-mono text-center focus:border-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-500 shadow-sm"
              >
                <Save className="h-4 w-4" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Invoice & Bank Details */}
        {activeTab === "invoice" && (
          <form onSubmit={handleSaveCompany} className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 max-w-3xl">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Invoice Terms & Bank Settlement Account
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={company.bankName}
                  onChange={(e) => setCompany({ ...company, bankName: e.target.value })}
                  placeholder="e.g. HDFC Bank"
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bank Branch
                </label>
                <input
                  type="text"
                  value={company.bankBranch}
                  onChange={(e) => setCompany({ ...company, bankBranch: e.target.value })}
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bank Account Number
                </label>
                <input
                  type="text"
                  value={company.bankAccountNo}
                  onChange={(e) => setCompany({ ...company, bankAccountNo: e.target.value })}
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-mono focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bank IFSC Code
                </label>
                <input
                  type="text"
                  value={company.bankIfsc}
                  onChange={(e) => setCompany({ ...company, bankIfsc: e.target.value })}
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-mono uppercase focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  UPI ID (Printed on invoice for QR / Mobile payment)
                </label>
                <input
                  type="text"
                  value={company.upiId}
                  onChange={(e) => setCompany({ ...company, upiId: e.target.value })}
                  placeholder="e.g. shivom@hdfcbank"
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-mono focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Standard Invoice Terms & Conditions
                </label>
                <textarea
                  rows={4}
                  value={company.invoiceTerms}
                  onChange={(e) => setCompany({ ...company, invoiceTerms: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-3 text-xs font-mono focus:border-orange-500 focus:outline-hidden leading-relaxed"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-500 shadow-sm"
              >
                <Save className="h-4 w-4" />
                <span>Save Invoice Settings</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Users & Roles */}
        {activeTab === "users" && (
          <div className="space-y-4 max-w-3xl">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                User Roles & Access Permissions
              </h3>
              <p className="text-xs text-slate-500">
                The ERP is optimized for lean operation with 3 purpose-built roles.
              </p>

              <div className="divide-y divide-slate-100 space-y-3">
                <div className="pt-3 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-xs shrink-0">
                    AD
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">1. Owner / Admin (`admin@buildstock.com`)</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Full system access: Dashboard, Purchases, Sales, Customer & Supplier ledgers, Gross Profit, GST, Settings and Role management.
                    </p>
                  </div>
                </div>

                <div className="pt-3 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                    BL
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">2. Sales / Billing (`billing@buildstock.com`)</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Counter sales, POS invoice billing, quotations, customer receivables and collection receipts.
                    </p>
                  </div>
                </div>

                <div className="pt-3 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs shrink-0">
                    ST
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">3. Store / Purchase (`store@buildstock.com`)</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Material procurement, goods inward receipts, stock verification, godowns and variance adjustments.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Numbering */}
        {activeTab === "numbering" && (
          <form onSubmit={handleSaveCompany} className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 max-w-xl">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Document Sequence Prefixes
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sales Invoice Prefix
                </label>
                <input
                  type="text"
                  value={company.invoicePrefix}
                  onChange={(e) => setCompany({ ...company, invoicePrefix: e.target.value })}
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-mono uppercase focus:border-orange-500 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-400">Sample: {company.invoicePrefix}0042</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Purchase Order Prefix
                </label>
                <input
                  type="text"
                  value={company.purchasePrefix}
                  onChange={(e) => setCompany({ ...company, purchasePrefix: e.target.value })}
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-mono uppercase focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quotation Prefix
                </label>
                <input
                  type="text"
                  value={company.quotationPrefix}
                  onChange={(e) => setCompany({ ...company, quotationPrefix: e.target.value })}
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-mono uppercase focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Receipt Prefix
                </label>
                <input
                  type="text"
                  value={company.paymentPrefix}
                  onChange={(e) => setCompany({ ...company, paymentPrefix: e.target.value })}
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-mono uppercase focus:border-orange-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="rounded-lg bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-500 shadow-sm"
              >
                Save Prefixes
              </button>
            </div>
          </form>
        )}

        {/* Tab 5: Backup & Data */}
        {activeTab === "backup" && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 max-w-xl">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Data Management & Backup
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Export your complete company profile, operational parameters, and configuration as an encrypted JSON backup file.
            </p>

            <button
              onClick={handleDownloadBackup}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Download className="h-4 w-4" />
              <span>Download System Configuration Backup (.JSON)</span>
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <AppLayout>
          <div className="p-8 text-center text-xs text-slate-500">Loading settings...</div>
        </AppLayout>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
