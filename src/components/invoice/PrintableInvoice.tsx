"use client";

import React, { useRef } from "react";
import { formatINR, formatDate, numberToWordsINR } from "@/lib/format";
import { Printer, Share2, X } from "lucide-react";

interface InvoiceItem {
  id?: string;
  description?: string;
  hsnCode?: string | null;
  unit?: string | null;
  quantity: number;
  rate: number;
  discount?: number;
  taxableAmount: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount?: number;
  totalAmount: number;
  product?: {
    name: string;
    sku: string;
    unit?: { code: string };
  };
}

interface PrintableInvoiceProps {
  documentTitle?: string;
  documentType?: "INVOICE" | "QUOTATION";
  sale: {
    id: string;
    invoiceNumber: string;
    date: string | Date;
    dueDate?: string | Date | null;
    paymentMode?: string;
    status: string;
    subtotal: number;
    discount: number;
    taxableAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    taxAmount: number;
    grandTotal: number;
    paidAmount?: number;
    balanceAmount?: number;
    notes?: string | null;
    terms?: string | null;
    customer: {
      name: string;
      contactPerson?: string | null;
      mobile: string;
      address?: string | null;
      city?: string | null;
      state?: string | null;
      stateCode?: string | null;
      gstin?: string | null;
    };
    items: InvoiceItem[];
  };
  company?: {
    name?: string;
    legalName?: string | null;
    gstin?: string | null;
    pan?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    stateCode?: string | null;
    pincode?: string | null;
    bankName?: string | null;
    bankAccountNo?: string | null;
    bankIfsc?: string | null;
    bankBranch?: string | null;
    upiId?: string | null;
    invoiceTerms?: string | null;
  };
  onClose?: () => void;
}

export default function PrintableInvoice({
  sale,
  documentTitle = "TAX INVOICE",
  documentType = "INVOICE",
  company = {
    name: "Shivom Construction",
    legalName: "Shivom Construction",
    gstin: "27AABCS1429B1Z8",
    pan: "AABCS1429B",
    email: "contact@shivomconstruction.com",
    phone: "+91 98200 12345",
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
  },
  onClose,
}: PrintableInvoiceProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const isQuotation = documentType === "QUOTATION";
    const text = `*${isQuotation ? "Quotation Estimate" : "Tax Invoice"}: ${sale.invoiceNumber}*\nCompany: ${company.legalName || company.name}\nCustomer: ${sale.customer.name}\nDate: ${formatDate(sale.date)}\nTotal Amount: ${formatINR(sale.grandTotal)}${!isQuotation && sale.paidAmount !== undefined ? `\nAmount Paid: ${formatINR(sale.paidAmount)}\nBalance Due: ${formatINR(sale.balanceAmount)}` : ""}\n\nThank you for choosing Shivom Construction!`;
    const cleanPhone = sale.customer.mobile.replace(/\D/g, "");
    const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col">
        {/* Floating Action Controls (Hidden when printed) */}
        <div className="no-print flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-sm">
              {documentType === "QUOTATION" ? "Quotation Preview" : "Tax Invoice Preview"} ({sale.invoiceNumber})
            </span>
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
              {documentType === "QUOTATION" ? "Estimate" : "GST Ready"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-500 transition-colors shadow-sm"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / PDF</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Printable Paper Area */}
        <div
          ref={printRef}
          className="printable-area flex-1 overflow-y-auto p-6 md:p-8 bg-white text-slate-800 text-xs"
        >
          {/* Header Title Banner */}
          <div className="border-b-2 border-slate-900 pb-4 mb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/shivom-logo.png"
                  alt="Shivom Construction Logo"
                  className="h-16 w-auto object-contain shrink-0"
                />
                <div>
                  <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    {company.legalName || company.name}
                  </h1>
                  <p className="text-[11px] font-bold text-[#e16718] uppercase tracking-wider">
                    Building Material Supply
                  </p>
                  <p className="text-slate-600 mt-1 max-w-md">
                    {company.address}, {company.city}, {company.state} - {company.pincode}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-slate-600">
                    <p><strong className="text-slate-900">GSTIN:</strong> {company.gstin}</p>
                    <p><strong className="text-slate-900">State:</strong> {company.state} ({company.stateCode})</p>
                    <p><strong className="text-slate-900">Phone:</strong> {company.phone}</p>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block rounded border border-slate-900 px-3 py-1 font-bold uppercase tracking-wider text-slate-900 text-sm">
                  {documentTitle}
                </span>
                <p className="text-[10px] text-slate-500 mt-1 uppercase">
                  {documentType === "QUOTATION" ? "Commercial Estimate" : "Original for Recipient"}
                </p>
                <div className="mt-2 text-right">
                  <p className="text-sm font-bold text-slate-900">
                    {documentType === "QUOTATION" ? "Estimate No: " : "Invoice No: "}
                    <span className="font-mono text-orange-600">{sale.invoiceNumber}</span>
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Date: <strong>{formatDate(sale.date)}</strong>
                  </p>
                  {sale.paymentMode && (
                    <p className="text-xs text-slate-600">
                      Payment Mode: <strong className="uppercase">{sale.paymentMode}</strong>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Customer / Billed To Section */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 mb-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Billed To (Customer Details)
            </p>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  {sale.customer.name}
                </h3>
                {sale.customer.contactPerson && (
                  <p className="text-slate-600">Attn: {sale.customer.contactPerson}</p>
                )}
                {sale.customer.address && (
                  <p className="text-slate-600">{sale.customer.address}, {sale.customer.city}</p>
                )}
                <p className="text-slate-600">Mobile: {sale.customer.mobile}</p>
              </div>
              <div className="sm:text-right">
                <p><strong className="text-slate-800">GSTIN:</strong> {sale.customer.gstin || "Unregistered"}</p>
                <p><strong className="text-slate-800">State:</strong> {sale.customer.state || "Maharashtra"} ({sale.customer.stateCode || "27"})</p>
                <p><strong className="text-slate-800">Place of Supply:</strong> {sale.customer.state || "Maharashtra"}</p>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <table className="w-full border-collapse border border-slate-300 text-left mb-4">
            <thead>
              <tr className="bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                <th className="border border-slate-300 px-2 py-1.5 w-8 text-center">#</th>
                <th className="border border-slate-300 px-2 py-1.5">Item Description</th>
                <th className="border border-slate-300 px-2 py-1.5 text-center">HSN</th>
                <th className="border border-slate-300 px-2 py-1.5 text-center">Unit</th>
                <th className="border border-slate-300 px-2 py-1.5 text-right">Qty</th>
                <th className="border border-slate-300 px-2 py-1.5 text-right">Rate</th>
                <th className="border border-slate-300 px-2 py-1.5 text-right">Taxable</th>
                <th className="border border-slate-300 px-2 py-1.5 text-center">GST %</th>
                <th className="border border-slate-300 px-2 py-1.5 text-right">Tax</th>
                <th className="border border-slate-300 px-2 py-1.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {sale.items.map((item, index) => {
                const tax = (item.cgstAmount || 0) + (item.sgstAmount || 0) + (item.igstAmount || 0);
                return (
                  <tr key={index} className="hover:bg-slate-50/50">
                    <td className="border border-slate-300 px-2 py-1.5 text-center">{index + 1}</td>
                    <td className="border border-slate-300 px-2 py-1.5">
                      <div className="font-semibold text-slate-900">
                        {item.description || item.product?.name}
                      </div>
                      {item.product?.sku && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          SKU: {item.product.sku}
                        </div>
                      )}
                    </td>
                    <td className="border border-slate-300 px-2 py-1.5 text-center font-mono">
                      {item.hsnCode || "-"}
                    </td>
                    <td className="border border-slate-300 px-2 py-1.5 text-center uppercase">
                      {item.unit || item.product?.unit?.code || "PCS"}
                    </td>
                    <td className="border border-slate-300 px-2 py-1.5 text-right font-semibold">
                      {item.quantity}
                    </td>
                    <td className="border border-slate-300 px-2 py-1.5 text-right">
                      {formatINR(item.rate)}
                    </td>
                    <td className="border border-slate-300 px-2 py-1.5 text-right font-medium">
                      {formatINR(item.taxableAmount)}
                    </td>
                    <td className="border border-slate-300 px-2 py-1.5 text-center">
                      {item.gstRate}%
                    </td>
                    <td className="border border-slate-300 px-2 py-1.5 text-right">
                      {formatINR(tax)}
                    </td>
                    <td className="border border-slate-300 px-2 py-1.5 text-right font-bold text-slate-900">
                      {formatINR(item.totalAmount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Amount in Words & Totals Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Left: Words, Bank Details */}
            <div className="space-y-3">
              <div className="rounded border border-slate-200 p-2.5 bg-slate-50/40">
                <p className="text-[10px] font-bold text-slate-500 uppercase">
                  Invoice Amount in Words:
                </p>
                <p className="font-semibold text-slate-900 mt-0.5 italic">
                  {numberToWordsINR(sale.grandTotal)}
                </p>
              </div>

              {company.bankName && (
                <div className="rounded border border-slate-200 p-2.5 text-[11px] space-y-0.5">
                  <p className="font-bold text-slate-900 uppercase">Bank Payment Details:</p>
                  <p><span className="text-slate-500">Bank Name:</span> <strong>{company.bankName}</strong> ({company.bankBranch})</p>
                  <p><span className="text-slate-500">A/C No:</span> <strong className="font-mono">{company.bankAccountNo}</strong></p>
                  <p><span className="text-slate-500">IFSC Code:</span> <strong className="font-mono">{company.bankIfsc}</strong></p>
                  {company.upiId && (
                    <p><span className="text-slate-500">UPI ID:</span> <strong className="font-mono text-orange-600">{company.upiId}</strong></p>
                  )}
                </div>
              )}
            </div>

            {/* Right: Tax Breakdown & Grand Total */}
            <div className="rounded border border-slate-300 divide-y divide-slate-200">
              <div className="flex justify-between px-3 py-1.5">
                <span className="text-slate-600">Taxable Value:</span>
                <span className="font-medium">{formatINR(sale.taxableAmount)}</span>
              </div>
              {sale.cgstAmount > 0 && (
                <div className="flex justify-between px-3 py-1.5">
                  <span className="text-slate-600">Central Tax (CGST):</span>
                  <span>{formatINR(sale.cgstAmount)}</span>
                </div>
              )}
              {sale.sgstAmount > 0 && (
                <div className="flex justify-between px-3 py-1.5">
                  <span className="text-slate-600">State Tax (SGST):</span>
                  <span>{formatINR(sale.sgstAmount)}</span>
                </div>
              )}
              {sale.igstAmount > 0 && (
                <div className="flex justify-between px-3 py-1.5">
                  <span className="text-slate-600">Integrated Tax (IGST):</span>
                  <span>{formatINR(sale.igstAmount)}</span>
                </div>
              )}
              <div className="flex justify-between px-3 py-2 bg-slate-100 font-bold text-sm text-slate-900">
                <span>Grand Total:</span>
                <span className="text-orange-600">{formatINR(sale.grandTotal)}</span>
              </div>
              <div className="flex justify-between px-3 py-1.5 text-emerald-700 bg-emerald-50/50">
                <span>Amount Paid:</span>
                <span className="font-semibold">{formatINR(sale.paidAmount)}</span>
              </div>
              <div className="flex justify-between px-3 py-1.5 text-rose-700 bg-rose-50/50 font-bold">
                <span>Balance Due:</span>
                <span>{formatINR(sale.balanceAmount)}</span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions & Signatures */}
          <div className="border-t border-slate-300 pt-4 mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Terms & Conditions:
              </p>
              <pre className="text-[10px] font-sans text-slate-600 whitespace-pre-wrap leading-relaxed">
                {sale.terms || company.invoiceTerms}
              </pre>
            </div>

            <div className="text-right flex flex-col justify-between items-end h-24">
              <p className="text-[11px] font-bold text-slate-900">
                For {company.legalName || company.name}
              </p>
              <p className="text-[10px] text-slate-500 border-t border-slate-400 pt-1 px-4">
                Authorized Signatory
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
