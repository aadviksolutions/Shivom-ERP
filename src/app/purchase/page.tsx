"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import DataTable, { Column } from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import SearchableSelect, { Option } from "@/components/ui/SearchableSelect";
import { formatINR, formatDate, calculateGSTBreakdown } from "@/lib/format";
import { Plus, Truck, RefreshCw, Trash2, CheckCircle2 } from "lucide-react";

interface PurchaseItem {
  productId: string;
  name: string;
  unit: string;
  quantity: number;
  rate: number;
  gstRate: number;
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState("");
  const [paymentMode, setPaymentMode] = useState("BANK_TRANSFER");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [cart, setCart] = useState<PurchaseItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [purRes, supRes, prodRes] = await Promise.all([
        fetch("/api/purchases"),
        fetch("/api/suppliers"),
        fetch("/api/products"),
      ]);

      const purJson = await purRes.json();
      const supJson = await supRes.json();
      const prodJson = await prodRes.json();

      if (purJson.success) setPurchases(purJson.data);
      if (supJson.success) {
        setSuppliers(supJson.data);
        if (supJson.data.length > 0 && !selectedSupplierId) {
          setSelectedSupplierId(supJson.data[0].id);
        }
      }
      if (prodJson.success) setProducts(prodJson.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddToCart = (productId: string) => {
    if (!productId) return;
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    setCart([
      ...cart,
      {
        productId: prod.id,
        name: prod.name,
        unit: prod.unit?.code || "PCS",
        quantity: 10,
        rate: prod.purchasePrice,
        gstRate: prod.gstRate,
      },
    ]);
  };

  const updateCartItem = (idx: number, field: keyof PurchaseItem, val: any) => {
    const newCart = [...cart];
    newCart[idx] = { ...newCart[idx], [field]: val };
    setCart(newCart);
  };

  const removeCartItem = (idx: number) => {
    setCart(cart.filter((_, i) => i !== idx));
  };

  let totalAmount = 0;
  cart.forEach((item) => {
    const b = calculateGSTBreakdown({
      rate: item.rate,
      quantity: item.quantity,
      gstRate: item.gstRate,
    });
    totalAmount += b.totalAmount;
  });

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || cart.length === 0) {
      alert("Please select supplier and at least one item");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: selectedSupplierId,
          supplierInvoiceNo,
          paymentMode,
          paidAmount,
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            rate: item.rate,
            gstRate: item.gstRate,
          })),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsAddModalOpen(false);
        setCart([]);
        fetchData();
      } else {
        alert(data.error || "Failed to create purchase entry");
      }
    } catch {
      alert("Error recording purchase");
    } finally {
      setSubmitting(false);
    }
  };

  const supplierOptions: Option[] = suppliers.map((s) => ({
    value: s.id,
    label: s.name,
    sublabel: `Mob: ${s.mobile} | Payable: ${formatINR(s.currentBalance)}`,
  }));

  const productOptions: Option[] = products.map((p) => ({
    value: p.id,
    label: p.name,
    sublabel: `Purchase Price: ${formatINR(p.purchasePrice)} | Current Stock: ${p.currentStock} ${p.unit?.code}`,
  }));

  const columns: Column<any>[] = [
    {
      header: "PO Number",
      accessorKey: "purchaseNumber",
      sortable: true,
      cell: (row) => (
        <span className="font-mono font-bold text-slate-900 text-xs">
          {row.purchaseNumber}
        </span>
      ),
    },
    {
      header: "Date",
      accessorKey: "date",
      sortable: true,
      cell: (row) => (
        <span className="text-xs text-slate-600">{formatDate(row.date)}</span>
      ),
    },
    {
      header: "Supplier",
      cell: (row) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">
            {row.supplier.name}
          </span>
          {row.supplierInvoiceNo && (
            <span className="text-[10px] text-slate-400 font-mono">
              Inv: {row.supplierInvoiceNo}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Grand Total",
      accessorKey: "grandTotal",
      sortable: true,
      className: "text-right",
      cell: (row) => (
        <span className="font-mono text-xs font-black text-slate-900">
          {formatINR(row.grandTotal)}
        </span>
      ),
    },
    {
      header: "Amount Paid",
      accessorKey: "paidAmount",
      sortable: true,
      className: "text-right",
      cell: (row) => (
        <span className="font-mono text-xs text-blue-600 font-semibold">
          {formatINR(row.paidAmount)}
        </span>
      ),
    },
    {
      header: "Balance Due",
      accessorKey: "balanceAmount",
      sortable: true,
      className: "text-right",
      cell: (row) => (
        <span
          className={`font-mono text-xs font-bold ${
            row.balanceAmount > 0 ? "text-rose-600" : "text-slate-400"
          }`}
        >
          {formatINR(row.balanceAmount)}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row) => <StatusBadge status={row.status} size="sm" />,
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Truck className="h-6 w-6 text-blue-600" />
              <span>Purchase Inward & Material Procurement</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Goods receipts, supplier invoices and automatic inventory replenishment
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-orange-600" : ""}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-500 transition-colors shadow-md shadow-blue-600/20"
            >
              <Plus className="h-4 w-4" />
              <span>New Purchase Inward</span>
            </button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={purchases}
          searchKey="purchaseNumber"
          searchPlaceholder="Search purchase order number..."
          pageSize={12}
        />
      </div>

      {/* New Purchase Inward Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record Purchase Inward"
        subtitle="Inward material will automatically increment warehouse inventory"
        maxWidth="4xl"
      >
        <form onSubmit={handleCreatePurchase} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="sm:col-span-2">
              <SearchableSelect
                label="Supplier / Distributor"
                options={supplierOptions}
                value={selectedSupplierId}
                onChange={(val) => setSelectedSupplierId(val)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supplier Bill / Invoice #
              </label>
              <input
                type="text"
                value={supplierInvoiceNo}
                onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                placeholder="e.g. BILL-9923"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Product to Add
            </label>
            <SearchableSelect
              placeholder="Search product to receive into godown..."
              options={productOptions}
              value=""
              onChange={(val) => handleAddToCart(val)}
            />
          </div>

          {/* Cart Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-56">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500 sticky top-0">
                <tr>
                  <th className="px-3 py-2">Item</th>
                  <th className="px-2 py-2 text-right w-24">Inward Qty</th>
                  <th className="px-2 py-2 text-right w-28">Purchase Rate (₹)</th>
                  <th className="px-2 py-2 text-center w-16">GST %</th>
                  <th className="px-3 py-2 text-right w-24">Total (₹)</th>
                  <th className="px-2 py-2 text-center w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No items added yet. Select products above.
                    </td>
                  </tr>
                ) : (
                  cart.map((item, idx) => {
                    const b = calculateGSTBreakdown({
                      rate: item.rate,
                      quantity: item.quantity,
                      gstRate: item.gstRate,
                    });
                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium">
                          {item.name} ({item.unit})
                        </td>
                        <td className="px-2 py-2 text-right">
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            required
                            value={item.quantity}
                            onChange={(e) => updateCartItem(idx, "quantity", Number(e.target.value))}
                            className="h-7 w-20 rounded border border-slate-200 px-1.5 text-right font-bold focus:border-blue-500 focus:outline-hidden"
                          />
                        </td>
                        <td className="px-2 py-2 text-right">
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={item.rate}
                            onChange={(e) => updateCartItem(idx, "rate", Number(e.target.value))}
                            className="h-7 w-24 rounded border border-slate-200 px-1.5 text-right font-mono focus:border-blue-500 focus:outline-hidden"
                          />
                        </td>
                        <td className="px-2 py-2 text-center">{item.gstRate}%</td>
                        <td className="px-3 py-2 text-right font-bold font-mono">
                          {formatINR(b.totalAmount)}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeCartItem(idx)}
                            className="text-slate-400 hover:text-rose-600"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-blue-500 focus:outline-hidden"
              >
                <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                <option value="CHEQUE">Cheque</option>
                <option value="UPI">UPI</option>
                <option value="CREDIT">Credit / Due Later</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount Paid to Supplier Now (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value))}
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-mono font-bold focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="text-sm font-bold text-slate-900">
              Total Inward Value: <span className="text-blue-600 font-mono">{formatINR(totalAmount)}</span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || cart.length === 0}
                className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-500 shadow-sm disabled:opacity-50"
              >
                {submitting ? "Processing..." : "Confirm & Inward Stock"}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
