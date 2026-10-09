"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { formatINR } from "@/lib/format";
import { FileText, Printer, Download, RefreshCw } from "lucide-react";
import { exportToCSV } from "@/lib/export";

export default function GSTReportPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchGST = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports/gst");
      const json = await res.json();
      if (json.success) setReport(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGST();
  }, []);

  const s = report?.salesGST || { taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
  const p = report?.purchaseGST || { taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 };

  const handleExportCSV = () => {
    const headers = ["Section", "HSN Code / Head", "Description", "Taxable Value (₹)", "CGST (₹)", "SGST (₹)", "IGST (₹)", "Total Tax (₹)"];
    const rows: (string | number)[][] = [
      ["Sales (Output Tax)", "Outward Supplies", "Total Sales GST", s.taxable, s.cgst, s.sgst, s.igst, s.totalTax],
      ["Purchases (Input Tax)", "Inward Supplies", "Total Purchase ITC", p.taxable, p.cgst, p.sgst, p.igst, p.totalTax],
    ];
    if (report?.hsnSummary) {
      report.hsnSummary.forEach((h: any) => {
        rows.push(["HSN Breakdown", h.hsn, h.description || "", h.taxable, "", "", "", h.tax]);
      });
    }
    exportToCSV(`GST_Filing_Report_${new Date().toISOString().split("T")[0]}`, headers, rows);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between no-print">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <FileText className="h-6 w-6 text-orange-600" />
              <span>GST & Tax Filing Report (GSTR-1 & 3B Ready)</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Sales GST, Input Tax Credit (ITC) on purchases, CGST, SGST, IGST and HSN summary
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Download className="h-4 w-4 text-slate-600" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Report</span>
            </button>
            <button
              onClick={fetchGST}
              disabled={loading}
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-orange-600" : ""}`} />
            </button>
          </div>
        </div>

        {/* GST KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <span className="text-xs font-bold uppercase text-slate-400">Total Output Tax (Sales GST)</span>
            <h3 className="text-2xl font-black text-orange-600 mt-2 font-mono">
              {formatINR(s.totalTax)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              On Taxable Sales: <strong>{formatINR(s.taxable)}</strong>
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <span className="text-xs font-bold uppercase text-slate-400">Input Tax Credit (Purchase ITC)</span>
            <h3 className="text-2xl font-black text-blue-600 mt-2 font-mono">
              {formatINR(p.totalTax)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              On Taxable Purchases: <strong>{formatINR(p.taxable)}</strong>
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <span className="text-xs font-bold uppercase text-slate-400">Net Tax Liability / Payable</span>
            <h3 className="text-2xl font-black text-slate-900 mt-2 font-mono">
              {formatINR(report?.netTaxPayable || 0)}
            </h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">
              After adjusting ITC credit
            </p>
          </div>
        </div>

        {/* Detailed Tax Breakdown Table */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3">GST Tax Head Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5 text-right">Taxable Value</th>
                  <th className="px-4 py-2.5 text-right">CGST</th>
                  <th className="px-4 py-2.5 text-right">SGST</th>
                  <th className="px-4 py-2.5 text-right">IGST</th>
                  <th className="px-4 py-2.5 text-right">Total GST</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                <tr>
                  <td className="px-4 py-3 font-sans font-semibold text-slate-900">
                    Outward Supplies (Sales)
                  </td>
                  <td className="px-4 py-3 text-right">{formatINR(s.taxable)}</td>
                  <td className="px-4 py-3 text-right text-orange-600">{formatINR(s.cgst)}</td>
                  <td className="px-4 py-3 text-right text-orange-600">{formatINR(s.sgst)}</td>
                  <td className="px-4 py-3 text-right text-orange-600">{formatINR(s.igst)}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">{formatINR(s.totalTax)}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-sans font-semibold text-slate-900">
                    Inward Supplies (Purchases ITC)
                  </td>
                  <td className="px-4 py-3 text-right">{formatINR(p.taxable)}</td>
                  <td className="px-4 py-3 text-right text-blue-600">{formatINR(p.cgst)}</td>
                  <td className="px-4 py-3 text-right text-blue-600">{formatINR(p.sgst)}</td>
                  <td className="px-4 py-3 text-right text-blue-600">{formatINR(p.igst)}</td>
                  <td className="px-4 py-3 text-right font-bold text-blue-700">{formatINR(p.totalTax)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* HSN Summary Table */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3">HSN Code Summary Table</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">HSN Code</th>
                  <th className="px-4 py-2.5">Description</th>
                  <th className="px-4 py-2.5 text-right">Quantity Sold</th>
                  <th className="px-4 py-2.5 text-right">Taxable Value (₹)</th>
                  <th className="px-4 py-2.5 text-right">Total Tax (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report?.hsnSummary?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No HSN records found for this period.
                    </td>
                  </tr>
                ) : (
                  report?.hsnSummary?.map((h: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-mono font-bold text-slate-900">{h.hsn}</td>
                      <td className="px-4 py-2.5 text-slate-700">{h.description}</td>
                      <td className="px-4 py-2.5 text-right font-semibold font-mono">{h.qty}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{formatINR(h.taxable)}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-orange-600">
                        {formatINR(h.tax)}
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
