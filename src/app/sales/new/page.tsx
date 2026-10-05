"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import SearchableSelect, { Option } from "@/components/ui/SearchableSelect";
import PrintableInvoice from "@/components/invoice/PrintableInvoice";
import { formatINR, calculateGSTBreakdown } from "@/lib/format";
import {
  ShoppingCart,
  Plus,
  Trash2,
  Printer,
  ArrowLeft,
  Building,
  CreditCard,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface CartItem {
  productId: string;
  name: string;
  sku: string;
  unit: string;
  currentStock: number;
  quantity: number;
  rate: number;
  discountPercent: number;
  gstRate: number;
  hsnCode?: string | null;
}

export default function NewSalePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [isInterState, setIsInterState] = useState(false);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);

  // Created Invoice for instant preview & print
  const [createdInvoice, setCreatedInvoice] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [custRes, prodRes, compRes] = await Promise.all([
          fetch("/api/customers"),
          fetch("/api/products"),
          fetch("/api/company"),
        ]);

        const custJson = await custRes.json();
        const prodJson = await prodRes.json();
        const compJson = await compRes.json();

        if (custJson.success) {
          setCustomers(custJson.data);
          // Default to first customer (or walk-in)
          if (custJson.data.length > 0) {
            setSelectedCustomerId(custJson.data[0].id);
          }
        }
        if (prodJson.success) setProducts(prodJson.data);
        if (compJson.success) setCompany(compJson.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAddProductToCart = (productId: string) => {
    if (!productId) return;
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    // Check if product already in cart
    const existingIndex = cart.findIndex((item) => item.productId === productId);
    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([
        ...cart,
        {
          productId: prod.id,
          name: prod.name,
          sku: prod.sku,
          unit: prod.unit?.code || "PCS",
          currentStock: prod.currentStock,
          quantity: 1,
          rate: prod.salePrice,
          discountPercent: 0,
          gstRate: prod.gstRate,
          hsnCode: prod.hsnCode,
        },
      ]);
    }
  };

  const updateCartItem = (index: number, field: keyof CartItem, val: any) => {
    const newCart = [...cart];
    newCart[index] = {
      ...newCart[index],
      [field]: val,
    };
    setCart(newCart);
  };

  const removeCartItem = (index: number) => {
    setCart(cart.filter((_, idx) => idx !== index));
  };

  // Calculations
  let subtotal = 0;
  let totalDiscount = 0;
  let taxableAmount = 0;
  let totalTax = 0;
  let grandTotal = 0;

  cart.forEach((item) => {
    const breakdown = calculateGSTBreakdown({
      rate: item.rate,
      quantity: item.quantity,
      discountPercent: item.discountPercent,
      gstRate: item.gstRate,
      isInterState,
    });
    subtotal += breakdown.lineSubtotal;
    totalDiscount += breakdown.discountAmount;
    taxableAmount += breakdown.taxableAmount;
    totalTax += breakdown.taxAmount;
    grandTotal += breakdown.totalAmount;
  });

  // Keep paidAmount synced with grandTotal by default if mode is CASH/UPI
  const handlePaymentModeChange = (mode: string) => {
    setPaymentMode(mode);
    if (mode === "CREDIT") {
      setPaidAmount(0);
    } else {
      setPaidAmount(grandTotal);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      alert("Please select a customer");
      return;
    }
    if (cart.length === 0) {
      alert("Please add at least one product to billing cart");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            rate: item.rate,
            discountPercent: item.discountPercent,
            gstRate: item.gstRate,
          })),
          paymentMode,
          paidAmount,
          isInterState,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to generate invoice");
        setSubmitting(false);
        return;
      }

      // Show immediate printable invoice modal
      setCreatedInvoice(data.data);
    } catch {
      alert("Network error creating invoice");
      setSubmitting(false);
    }
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Searchable select options
  const customerOptions: Option[] = customers.map((c) => ({
    value: c.id,
    label: c.name,
    sublabel: `Mob: ${c.mobile} | Bal: ${formatINR(c.currentBalance)}`,
  }));

  const productOptions: Option[] = products.map((p) => ({
    value: p.id,
    label: p.name,
    sublabel: `SKU: ${p.sku} | Price: ${formatINR(p.salePrice)} | Stock: ${p.currentStock} ${p.unit?.code}`,
    badge: `${p.currentStock} ${p.unit?.code}`,
  }));

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/sales"
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                <ShoppingCart className="h-6 w-6 text-orange-600" />
                <span>Fast Sales Billing Counter</span>
              </h1>
              <p className="text-xs text-slate-500">
                Express point-of-sale invoicing & real-time inventory deduction
              </p>
            </div>
          </div>
        </div>

        {/* Sales Grid Form */}
        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Customer & Cart (2 columns on large screen) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Customer Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Building className="h-4 w-4 text-orange-600" />
                  <span>1. Select Customer / Party</span>
                </h3>
                {selectedCustomer && (
                  <span className="text-xs">
                    Current Outstanding:{" "}
                    <strong
                      className={
                        selectedCustomer.currentBalance > 0
                          ? "text-rose-600"
                          : "text-emerald-600"
                      }
                    >
                      {formatINR(selectedCustomer.currentBalance)}
                    </strong>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <SearchableSelect
                    label="Customer Name"
                    placeholder="Search customer by name or phone..."
                    options={customerOptions}
                    value={selectedCustomerId}
                    onChange={(val) => setSelectedCustomerId(val)}
                    required
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={isInterState}
                      onChange={(e) => setIsInterState(e.target.checked)}
                      className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 h-4 w-4"
                    />
                    <span>Inter-State Supply (IGST instead of CGST+SGST)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Product Picker & Cart Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Plus className="h-4 w-4 text-orange-600" />
                  <span>2. Add Materials & Products</span>
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {cart.length} item(s) in billing cart
                </span>
              </div>

              {/* Fast Product Selector */}
              <div>
                <SearchableSelect
                  placeholder="Scan barcode or type product name / SKU (e.g. UltraTech, Tata Tiscon)..."
                  options={productOptions}
                  value=""
                  onChange={(val) => handleAddProductToCart(val)}
                />
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-600">
                    <tr>
                      <th className="px-3 py-2 w-8">#</th>
                      <th className="px-3 py-2 min-w-[160px]">Product / Material</th>
                      <th className="px-2 py-2 text-right w-20">Stock</th>
                      <th className="px-2 py-2 text-right w-24">Qty</th>
                      <th className="px-2 py-2 text-right w-24">Rate (₹)</th>
                      <th className="px-2 py-2 text-right w-16">Disc %</th>
                      <th className="px-2 py-2 text-center w-16">GST %</th>
                      <th className="px-3 py-2 text-right w-24">Total (₹)</th>
                      <th className="px-2 py-2 text-center w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {cart.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400">
                          Select products from dropdown above to add items to invoice.
                        </td>
                      </tr>
                    ) : (
                      cart.map((item, idx) => {
                        const breakdown = calculateGSTBreakdown({
                          rate: item.rate,
                          quantity: item.quantity,
                          discountPercent: item.discountPercent,
                          gstRate: item.gstRate,
                          isInterState,
                        });

                        const isLowStock = item.currentStock < item.quantity;

                        return (
                          <tr key={item.productId} className="hover:bg-slate-50/50">
                            <td className="px-3 py-2 text-center text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="px-3 py-2">
                              <span className="font-bold text-slate-900 block">
                                {item.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                SKU: {item.sku} • {item.unit}
                              </span>
                            </td>
                            <td className="px-2 py-2 text-right">
                              <span
                                className={`text-[11px] font-bold font-mono ${
                                  isLowStock ? "text-rose-600" : "text-slate-600"
                                }`}
                              >
                                {item.currentStock}
                              </span>
                            </td>
                            <td className="px-2 py-2 text-right">
                              <input
                                type="number"
                                min="0.1"
                                step="any"
                                required
                                value={item.quantity}
                                onChange={(e) =>
                                  updateCartItem(idx, "quantity", Number(e.target.value))
                                }
                                className="h-7 w-20 rounded border border-slate-200 px-1.5 text-right font-bold focus:border-orange-500 focus:outline-hidden"
                              />
                            </td>
                            <td className="px-2 py-2 text-right">
                              <input
                                type="number"
                                step="0.01"
                                required
                                value={item.rate}
                                onChange={(e) =>
                                  updateCartItem(idx, "rate", Number(e.target.value))
                                }
                                className="h-7 w-20 rounded border border-slate-200 px-1.5 text-right font-mono focus:border-orange-500 focus:outline-hidden"
                              />
                            </td>
                            <td className="px-2 py-2 text-right">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={item.discountPercent}
                                onChange={(e) =>
                                  updateCartItem(
                                    idx,
                                    "discountPercent",
                                    Number(e.target.value)
                                  )
                                }
                                className="h-7 w-14 rounded border border-slate-200 px-1.5 text-right font-mono focus:border-orange-500 focus:outline-hidden"
                              />
                            </td>
                            <td className="px-2 py-2 text-center">
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                                {item.gstRate}%
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                              {formatINR(breakdown.totalAmount)}
                            </td>
                            <td className="px-2 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeCartItem(idx)}
                                className="rounded p-1 text-slate-400 hover:text-rose-600 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Billing Summary & Payment (1 column) */}
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-orange-600" />
                <span>3. Tax & Payment Summary</span>
              </h3>

              {/* Numerical Breakdown */}
              <div className="space-y-2 text-xs divide-y divide-slate-100">
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Subtotal:</span>
                  <span className="font-mono font-medium">{formatINR(subtotal)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between py-1 text-emerald-600">
                    <span>Discount:</span>
                    <span className="font-mono font-medium">-{formatINR(totalDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Taxable Value:</span>
                  <span className="font-mono font-medium">{formatINR(taxableAmount)}</span>
                </div>
                <div className="flex justify-between py-1 text-orange-600">
                  <span>Total GST Tax:</span>
                  <span className="font-mono font-semibold">+{formatINR(totalTax)}</span>
                </div>
                <div className="flex justify-between py-2 text-base font-black text-slate-900 border-t-2 border-slate-900">
                  <span>Grand Total:</span>
                  <span className="text-orange-600 font-mono">{formatINR(grandTotal)}</span>
                </div>
              </div>

              {/* Payment Mode Selection */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700">
                  Payment Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["CASH", "UPI", "BANK_TRANSFER", "CREDIT"].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => handlePaymentModeChange(mode)}
                      className={`rounded-lg border p-2 text-xs font-semibold transition-all ${
                        paymentMode === mode
                          ? "border-orange-500 bg-orange-50 text-orange-800"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {mode === "BANK_TRANSFER" ? "Bank Transfer" : mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Paid Amount Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount Collected Now (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-bold font-mono text-emerald-600 focus:border-orange-500 focus:outline-hidden"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>
                    Balance on Credit:{" "}
                    <strong className="text-rose-600 font-mono">
                      {formatINR(Math.max(0, grandTotal - paidAmount))}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setPaidAmount(grandTotal)}
                    className="text-orange-600 hover:underline"
                  >
                    Full Payment
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Invoice Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Delivered to Site Baner, Vehicle MH-12-AB-1234"
                  className="h-8 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              {/* Generate Invoice Button */}
              <button
                type="submit"
                disabled={submitting || cart.length === 0}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-black text-white shadow-lg shadow-orange-600/30 hover:bg-orange-500 transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="h-5 w-5" />
                <span>
                  {submitting ? "Processing..." : `Generate Invoice (${formatINR(grandTotal)})`}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Instant Print Invoice Modal */}
      {createdInvoice && (
        <PrintableInvoice
          sale={createdInvoice}
          company={company}
          onClose={() => {
            setCreatedInvoice(null);
            router.push("/sales");
          }}
        />
      )}
    </AppLayout>
  );
}
