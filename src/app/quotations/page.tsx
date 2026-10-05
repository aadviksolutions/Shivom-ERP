"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import DataTable, { Column } from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import SearchableSelect, { Option } from "@/components/ui/SearchableSelect";
import { formatINR, formatDate, calculateGSTBreakdown } from "@/lib/format";
import { Plus, FileSpreadsheet, RefreshCw, ArrowRight, Trash2 } from "lucide-react";

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [qRes, cRes, pRes] = await Promise.all([
        fetch("/api/quotations"),
        fetch("/api/customers"),
        fetch("/api/products"),
      ]);

      const qJson = await qRes.json();
      const cJson = await cRes.json();
      const pJson = await pRes.json();

      if (qJson.success) setQuotations(qJson.data);
      if (cJson.success) {
        setCustomers(cJson.data);
        if (cJson.data.length > 0 && !selectedCustomerId) {
          setSelectedCustomerId(cJson.data[0].id);
        }
      }
      if (pJson.success) setProducts(pJson.data);
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
        quantity: 1,
        rate: prod.salePrice,
        discountPercent: 0,
        gstRate: prod.gstRate,
      },
    ]);
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || cart.length === 0) {
      alert("Please select customer and at least one item");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          items: cart,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsAddModalOpen(false);
        setCart([]);
        fetchData();
      } else {
        alert(data.error || "Failed to create quotation");
      }
    } catch {
      alert("Error creating quotation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConvertToSale = async (quotation: any) => {
    if (!confirm(`Convert Quotation ${quotation.quotationNumber} directly into a confirmed Tax Invoice?`)) {
      return;
    }

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: quotation.customerId,
          items: quotation.items.map((i: any) => ({
            productId: i.productId,
            quantity: i.quantity,
            rate: i.rate,
            discountPercent: i.discount,
            gstRate: i.gstRate,
          })),
          paymentMode: "CREDIT",
          paidAmount: 0,
          notes: `Converted from Quotation ${quotation.quotationNumber}`,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Successfully generated Invoice ${data.data.invoiceNumber}!`);
        fetchData();
      } else {
        alert(data.error || "Failed to convert quotation");
      }
    } catch {
      alert("Error converting to sale");
    }
  };

  const customerOptions: Option[] = customers.map((c) => ({
    value: c.id,
    label: c.name,
    sublabel: `Mob: ${c.mobile}`,
  }));

  const productOptions: Option[] = products.map((p) => ({
    value: p.id,
    label: p.name,
    sublabel: `Rate: ${formatINR(p.salePrice)} | Stock: ${p.currentStock}`,
  }));

  const columns: Column<any>[] = [
    {
      header: "Quotation #",
      accessorKey: "quotationNumber",
      sortable: true,
      cell: (row) => (
        <span className="font-mono font-bold text-slate-900 text-xs">
          {row.quotationNumber}
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
      header: "Customer",
      cell: (row) => (
        <span className="font-bold text-slate-800 text-xs block">
          {row.customer.name}
        </span>
      ),
    },
    {
      header: "Valid Until",
      accessorKey: "validUntil",
      cell: (row) => (
        <span className="text-xs text-slate-500">{formatDate(row.validUntil)}</span>
      ),
    },
    {
      header: "Grand Total",
      accessorKey: "grandTotal",
      sortable: true,
      className: "text-right",
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-slate-900">
          {formatINR(row.grandTotal)}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      header: "Convert",
      className: "text-center",
      cell: (row) => (
        <button
          onClick={() => handleConvertToSale(row)}
          className="flex items-center gap-1 rounded bg-orange-50 hover:bg-orange-600 hover:text-white text-orange-700 px-2 py-1 text-[11px] font-bold transition-colors mx-auto"
        >
          <span>Convert to Sale</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6 text-purple-600" />
              <span>Quotations & Estimates</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Prepare price estimates for contractors and convert directly to sales invoices
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
              className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-purple-500 transition-colors shadow-md shadow-purple-600/20"
            >
              <Plus className="h-4 w-4" />
              <span>New Quotation</span>
            </button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={quotations}
          searchKey="quotationNumber"
          searchPlaceholder="Search quotation number..."
          pageSize={12}
        />
      </div>

      {/* New Quotation Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Quotation"
        maxWidth="4xl"
      >
        <form onSubmit={handleCreateQuotation} className="space-y-4">
          <div>
            <SearchableSelect
              label="Customer"
              options={customerOptions}
              value={selectedCustomerId}
              onChange={(val) => setSelectedCustomerId(val)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Add Products to Estimate
            </label>
            <SearchableSelect
              placeholder="Select product..."
              options={productOptions}
              value=""
              onChange={(val) => handleAddToCart(val)}
            />
          </div>

          {/* Cart Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-56">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Item</th>
                  <th className="px-2 py-2 text-right w-20">Qty</th>
                  <th className="px-2 py-2 text-right w-24">Rate (₹)</th>
                  <th className="px-2 py-2 text-center w-16">GST %</th>
                  <th className="px-3 py-2 text-right w-24">Total (₹)</th>
                  <th className="px-2 py-2 text-center w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No items added yet.
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
                        <td className="px-2 py-2 text-right font-bold">
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            value={item.quantity}
                            onChange={(e) => {
                              const newCart = [...cart];
                              newCart[idx].quantity = Number(e.target.value);
                              setCart(newCart);
                            }}
                            className="h-7 w-16 rounded border border-slate-200 px-1.5 text-right font-bold focus:border-purple-500 focus:outline-hidden"
                          />
                        </td>
                        <td className="px-2 py-2 text-right">
                          <input
                            type="number"
                            step="0.01"
                            value={item.rate}
                            onChange={(e) => {
                              const newCart = [...cart];
                              newCart[idx].rate = Number(e.target.value);
                              setCart(newCart);
                            }}
                            className="h-7 w-20 rounded border border-slate-200 px-1.5 text-right font-mono focus:border-purple-500 focus:outline-hidden"
                          />
                        </td>
                        <td className="px-2 py-2 text-center">{item.gstRate}%</td>
                        <td className="px-3 py-2 text-right font-bold font-mono">
                          {formatINR(b.totalAmount)}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => setCart(cart.filter((_, i) => i !== idx))}
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

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
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
              className="rounded-lg bg-purple-600 px-5 py-2 text-xs font-bold text-white hover:bg-purple-500 shadow-sm disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Save Quotation"}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
