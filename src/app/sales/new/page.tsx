"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import SearchableSelect, { Option } from "@/components/ui/SearchableSelect";
import PrintableInvoice from "@/components/invoice/PrintableInvoice";
import NewCustomerModal from "@/components/customers/NewCustomerModal";
import { formatINR, calculateGSTBreakdown } from "@/lib/format";
import {
  ShoppingCart,
  Plus,
  Trash2,
  ArrowLeft,
  Building,
  CreditCard,
  UserPlus,
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
  const [errorMessage, setErrorMessage] = useState("");

  // Customer Modal State
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);

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
          if (custJson.data.length > 0 && !selectedCustomerId) {
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

  const balanceDue = Math.max(0, Math.round((grandTotal - paidAmount) * 100) / 100);

  // Keep paidAmount synced with grandTotal by default if mode is CASH/UPI
  const handlePaymentModeChange = (mode: string) => {
    setPaymentMode(mode);
    if (mode === "CREDIT") {
      setPaidAmount(0);
    } else {
      setPaidAmount(grandTotal);
    }
  };

  // Callback when a new customer is saved via modal
  const handleCustomerCreated = (newCustomer: any) => {
    setCustomers((prev) => [newCustomer, ...prev]);
    setSelectedCustomerId(newCustomer.id);
    // Notice: cart remains completely intact!
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!selectedCustomerId) {
      setErrorMessage("Please select an existing customer or add a new customer.");
      return;
    }
    if (cart.length === 0) {
      setErrorMessage("Please add at least one material/product to the billing cart.");
      return;
    }

    for (const item of cart) {
      if (!item.quantity || item.quantity <= 0) {
        setErrorMessage(`Invalid quantity for "${item.name}". Quantity must be greater than 0.`);
        return;
      }
      if (item.rate < 0) {
        setErrorMessage(`Invalid rate for "${item.name}". Rate cannot be negative.`);
        return;
      }
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
            quantity: Number(item.quantity),
            rate: Number(item.rate),
            discountPercent: Number(item.discountPercent) || 0,
            gstRate: Number(item.gstRate),
          })),
          paymentMode,
          paidAmount: Number(paidAmount) || 0,
          isInterState,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to generate invoice.");
        setSubmitting(false);
        return;
      }

      // Success: Show printable tax invoice modal
      setCreatedInvoice(data.data);
      // Reset form draft
      setCart([]);
      setNotes("");
    } catch {
      setErrorMessage("Network error creating invoice. Please try again.");
    } finally {
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
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-[#24282c] flex items-center gap-2">
                <ShoppingCart className="h-6 w-6 text-[#e16718]" />
                <span>New Sales Billing (POS)</span>
              </h1>
              <p className="text-xs text-slate-500">
                Express counter billing with instant customer creation & live stock deduction
              </p>
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* Sales Grid Form */}
        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Customer & Cart (2 columns on large screen) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Customer Selection Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Building className="h-4 w-4 text-[#e16718]" />
                  <span>1. Customer Selection</span>
                </h3>
                {selectedCustomer && (
                  <span className="text-xs">
                    Current Balance Due:{" "}
                    <strong
                      className={
                        selectedCustomer.currentBalance > 0
                          ? "text-rose-600 font-mono"
                          : "text-emerald-600 font-mono"
                      }
                    >
                      {formatINR(selectedCustomer.currentBalance)}
                    </strong>
                  </span>
                )}
              </div>

              {/* Customer Selector with Prominent "+ New Customer" button */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-end gap-2.5">
                  <div className="flex-1">
                    <SearchableSelect
                      label="Select Existing Customer"
                      placeholder="Search customer by name or mobile number..."
                      options={customerOptions}
                      value={selectedCustomerId}
                      onChange={(val) => setSelectedCustomerId(val)}
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewCustomerModal(true)}
                    className="flex items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-[#e16718] bg-orange-50/70 hover:bg-orange-100/70 px-4 py-2 text-xs font-bold text-[#e16718] transition-all cursor-pointer h-10 shrink-0 active:scale-95"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>+ New Customer</span>
                  </button>
                </div>

                {/* Selected Customer Details Chip */}
                {selectedCustomer && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                    <div>
                      <strong className="text-slate-800">{selectedCustomer.name}</strong>
                    </div>
                    <div>
                      <span>Mobile: </span>
                      <strong className="font-mono text-slate-800">{selectedCustomer.mobile}</strong>
                    </div>
                    {selectedCustomer.gstin && (
                      <div>
                        <span>GSTIN: </span>
                        <strong className="font-mono text-slate-800">{selectedCustomer.gstin}</strong>
                      </div>
                    )}
                    {selectedCustomer.city && (
                      <div>
                        <span>Location: </span>
                        <span>{selectedCustomer.city}, {selectedCustomer.state}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={isInterState}
                      onChange={(e) => setIsInterState(e.target.checked)}
                      className="rounded border-slate-300 text-[#e16718] focus:ring-[#e16718] h-4 w-4"
                    />
                    <span>Inter-State Supply (Apply IGST instead of CGST + SGST)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Product Picker & Cart Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Plus className="h-4 w-4 text-[#e16718]" />
                  <span>2. Add Materials & Hardware Products</span>
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {cart.length} item(s) in billing cart
                </span>
              </div>

              {/* Fast Product Selector */}
              <div>
                <SearchableSelect
                  placeholder="Search and add product by name or SKU (e.g. UltraTech Cement, Tata Tiscon TMT)..."
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
                      <th className="px-2 py-2 text-center w-24">Qty</th>
                      <th className="px-2 py-2 text-right w-28">Rate (₹)</th>
                      <th className="px-2 py-2 text-center w-20">Disc (%)</th>
                      <th className="px-2 py-2 text-center w-16">GST</th>
                      <th className="px-3 py-2 text-right w-28">Total (₹)</th>
                      <th className="px-2 py-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cart.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400">
                          <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-40 text-slate-400" />
                          No items added yet. Search products above to add to bill.
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

                        return (
                          <tr key={item.productId} className="hover:bg-slate-50/50">
                            <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                            <td className="px-3 py-2">
                              <span className="font-bold text-slate-800 block">{item.name}</span>
                              <span className="text-[10px] font-mono text-slate-400">
                                SKU: {item.sku}
                              </span>
                            </td>
                            <td className="px-2 py-2 text-right font-mono">
                              <span
                                className={`font-semibold ${
                                  item.currentStock <= 5 ? "text-rose-600" : "text-slate-600"
                                }`}
                              >
                                {item.currentStock} {item.unit}
                              </span>
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                min="0.01"
                                step="any"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateCartItem(idx, "quantity", Number(e.target.value))
                                }
                                className="h-8 w-full rounded border border-slate-200 px-2 text-center font-mono font-semibold focus:border-[#e16718] focus:outline-hidden"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.rate}
                                onChange={(e) =>
                                  updateCartItem(idx, "rate", Number(e.target.value))
                                }
                                className="h-8 w-full rounded border border-slate-200 px-2 text-right font-mono focus:border-[#e16718] focus:outline-hidden"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={item.discountPercent}
                                onChange={(e) =>
                                  updateCartItem(idx, "discountPercent", Number(e.target.value))
                                }
                                className="h-8 w-full rounded border border-slate-200 px-2 text-center font-mono focus:border-[#e16718] focus:outline-hidden"
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
                                className="rounded p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
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
                <CreditCard className="h-4 w-4 text-[#e16718]" />
                <span>3. Billing Summary & Payment</span>
              </h3>

              {/* Numerical Breakdown */}
              <div className="space-y-2 text-xs divide-y divide-slate-100">
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Items Subtotal:</span>
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
                <div className="flex justify-between py-1 text-[#e16718]">
                  <span>GST Tax Breakdown:</span>
                  <span className="font-mono font-semibold">+{formatINR(totalTax)}</span>
                </div>
              </div>

              {/* Clearly Distinguished Total, Amount Paid & Balance Due */}
              <div className="space-y-2 pt-2 border-t-2 border-slate-900">
                <div className="flex items-center justify-between p-3 rounded-xl bg-orange-50/70 border border-orange-200">
                  <span className="text-xs font-bold text-slate-800">Total Amount:</span>
                  <span className="text-lg font-black text-[#e16718] font-mono">
                    {formatINR(grandTotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
                  <span className="text-xs font-semibold text-emerald-900">Amount Paid:</span>
                  <span className="text-sm font-bold text-emerald-700 font-mono">
                    {formatINR(paidAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-rose-50/70 border border-rose-200">
                  <span className="text-xs font-semibold text-rose-900">Balance Due:</span>
                  <span className="text-sm font-bold text-rose-700 font-mono">
                    {formatINR(balanceDue)}
                  </span>
                </div>
              </div>

              {/* Payment Mode Selection */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "CASH", label: "Cash" },
                    { id: "UPI", label: "UPI / QR" },
                    { id: "BANK_TRANSFER", label: "Bank Transfer" },
                    { id: "CREDIT", label: "Credit (Udhar)" },
                    { id: "CHEQUE", label: "Cheque" },
                    { id: "NEFT_RTGS", label: "NEFT / RTGS" },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => handlePaymentModeChange(mode.id)}
                      className={`rounded-lg border p-2 text-xs font-bold transition-all cursor-pointer ${
                        paymentMode === mode.id
                          ? "border-[#e16718] bg-orange-50 text-[#e16718]"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Paid Amount Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Amount Received Now (₹)
                  </label>
                  <button
                    type="button"
                    onClick={() => setPaidAmount(grandTotal)}
                    className="text-[11px] font-bold text-[#e16718] hover:underline cursor-pointer"
                  >
                    Full Payment
                  </button>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-base font-bold font-mono text-emerald-700 focus:border-[#e16718] focus:outline-hidden"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Billing Notes / Vehicle No.
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Delivered to Site Baner, Vehicle MH-12-AB-1234"
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-[#e16718] focus:outline-hidden"
                />
              </div>

              {/* Generate Invoice Submit Button */}
              <button
                type="submit"
                disabled={submitting || cart.length === 0}
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#e16718] p-3 text-sm font-bold text-white shadow-lg shadow-orange-600/20 hover:bg-[#c9550e] transition-all disabled:opacity-50 cursor-pointer active:scale-98"
              >
                <CheckCircle2 className="h-5 w-5" />
                <span>
                  {submitting
                    ? "Generating Invoice..."
                    : `Confirm Sale & Print (${formatINR(grandTotal)})`}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* New Customer Modal */}
      <NewCustomerModal
        isOpen={showNewCustomerModal}
        onClose={() => setShowNewCustomerModal(false)}
        onCustomerCreated={handleCustomerCreated}
        existingCustomers={customers}
      />

      {/* Printable Invoice Modal */}
      {createdInvoice && (
        <PrintableInvoice
          sale={createdInvoice}
          company={company}
          onClose={() => setCreatedInvoice(null)}
        />
      )}
    </AppLayout>
  );
}
