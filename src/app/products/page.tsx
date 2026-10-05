"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import DataTable, { Column } from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatINR, getStockStatus } from "@/lib/format";
import { Plus, Package, Edit, SlidersHorizontal, RefreshCw, AlertTriangle } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string | null;
  description?: string | null;
  hsnCode?: string | null;
  purchasePrice: number;
  salePrice: number;
  minSalePrice?: number | null;
  gstRate: number;
  minStockLevel: number;
  openingStock: number;
  currentStock: number;
  isActive: boolean;
  categoryId?: string | null;
  brandId?: string | null;
  unitId: string;
  category?: { name: string } | null;
  brand?: { name: string } | null;
  unit?: { name: string; code: string };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    barcode: "",
    hsnCode: "",
    description: "",
    purchasePrice: 0,
    salePrice: 0,
    minSalePrice: 0,
    gstRate: 18,
    minStockLevel: 10,
    openingStock: 0,
    categoryId: "",
    brandId: "",
    unitId: "",
  });

  // Adjustment Form State
  const [adjustData, setAdjustData] = useState({
    type: "ADJUSTMENT_INCREASE",
    quantity: 1,
    reason: "Physical Verification",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, brandRes, unitRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/inventory/categories"),
        fetch("/api/inventory/brands"),
        fetch("/api/inventory/units"),
      ]);

      const prodJson = await prodRes.json();
      const catJson = await catRes.json();
      const brandJson = await brandRes.json();
      const unitJson = await unitRes.json();

      if (prodJson.success) setProducts(prodJson.data);
      if (catJson.success) setCategories(catJson.data);
      if (brandJson.success) setBrands(brandJson.data);
      if (unitJson.success) {
        setUnits(unitJson.data);
        if (unitJson.data.length > 0 && !formData.unitId) {
          setFormData((prev) => ({ ...prev, unitId: unitJson.data[0].id }));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      name: "",
      sku: "SKU-" + Math.floor(1000 + Math.random() * 9000),
      barcode: "",
      hsnCode: "",
      description: "",
      purchasePrice: 0,
      salePrice: 0,
      minSalePrice: 0,
      gstRate: 18,
      minStockLevel: 10,
      openingStock: 0,
      categoryId: categories[0]?.id || "",
      brandId: brands[0]?.id || "",
      unitId: units[0]?.id || "",
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setCurrentProduct(prod);
    setFormData({
      name: prod.name,
      sku: prod.sku,
      barcode: prod.barcode || "",
      hsnCode: prod.hsnCode || "",
      description: prod.description || "",
      purchasePrice: prod.purchasePrice,
      salePrice: prod.salePrice,
      minSalePrice: prod.minSalePrice || 0,
      gstRate: prod.gstRate,
      minStockLevel: prod.minStockLevel,
      openingStock: prod.openingStock,
      categoryId: prod.categoryId || "",
      brandId: prod.brandId || "",
      unitId: prod.unitId,
    });
    setIsEditModalOpen(true);
  };

  const handleOpenAdjust = (prod: Product) => {
    setCurrentProduct(prod);
    setAdjustData({
      type: "ADJUSTMENT_INCREASE",
      quantity: 1,
      reason: "Physical Verification",
    });
    setIsAdjustModalOpen(true);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setIsAddModalOpen(false);
        fetchData();
      } else {
        alert(data.error || "Failed to create product");
      }
    } catch {
      alert("Error creating product");
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct) return;
    try {
      const res = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentProduct.id, ...formData }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsEditModalOpen(false);
        fetchData();
      } else {
        alert(data.error || "Failed to update product");
      }
    } catch {
      alert("Error updating product");
    }
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct) return;
    try {
      const res = await fetch("/api/inventory/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: currentProduct.id,
          ...adjustData,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsAdjustModalOpen(false);
        fetchData();
      } else {
        alert(data.error || "Failed to adjust stock");
      }
    } catch {
      alert("Error adjusting stock");
    }
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    if (selectedCategory && p.categoryId !== selectedCategory) return false;
    if (selectedBrand && p.brandId !== selectedBrand) return false;
    if (onlyLowStock && p.currentStock > p.minStockLevel) return false;
    return true;
  });

  const columns: Column<Product>[] = [
    {
      header: "Product & SKU",
      accessorKey: "name",
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-bold text-slate-900 block">{row.name}</span>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
            <span>SKU: {row.sku}</span>
            {row.hsnCode && <span>• HSN: {row.hsnCode}</span>}
          </div>
        </div>
      ),
    },
    {
      header: "Category",
      accessorKey: "categoryId",
      cell: (row) => (
        <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
          {row.category?.name || "Uncategorized"}
        </span>
      ),
    },
    {
      header: "Brand",
      accessorKey: "brandId",
      cell: (row) => (
        <span className="text-xs text-slate-600 font-medium">
          {row.brand?.name || "-"}
        </span>
      ),
    },
    {
      header: "Unit",
      accessorKey: "unitId",
      cell: (row) => (
        <span className="font-bold text-slate-700 uppercase text-[11px]">
          {row.unit?.code || "PCS"}
        </span>
      ),
    },
    {
      header: "Purchase Rate",
      accessorKey: "purchasePrice",
      sortable: true,
      className: "text-right",
      cell: (row) => (
        <span className="text-xs text-slate-500 font-mono">
          {formatINR(row.purchasePrice)}
        </span>
      ),
    },
    {
      header: "Selling Price",
      accessorKey: "salePrice",
      sortable: true,
      className: "text-right",
      cell: (row) => (
        <span className="text-xs font-bold text-slate-900 font-mono">
          {formatINR(row.salePrice)}
        </span>
      ),
    },
    {
      header: "GST %",
      accessorKey: "gstRate",
      className: "text-center",
      cell: (row) => (
        <span className="rounded bg-orange-50 px-1.5 py-0.5 text-[11px] font-semibold text-orange-700">
          {row.gstRate}%
        </span>
      ),
    },
    {
      header: "Current Stock",
      accessorKey: "currentStock",
      sortable: true,
      className: "text-right",
      cell: (row) => {
        const isLow = row.currentStock <= row.minStockLevel;
        return (
          <div className="text-right">
            <span
              className={`font-black text-xs ${
                row.currentStock <= 0
                  ? "text-rose-600"
                  : isLow
                  ? "text-amber-600"
                  : "text-slate-900"
              }`}
            >
              {row.currentStock} {row.unit?.code}
            </span>
            <div className="text-[10px] text-slate-400">
              Min: {row.minStockLevel}
            </div>
          </div>
        );
      },
    },
    {
      header: "Status",
      accessorKey: "isActive",
      cell: (row) => {
        const status = getStockStatus(row.currentStock, row.minStockLevel);
        return <StatusBadge status={status.label} variant={status.variant} size="sm" />;
      },
    },
    {
      header: "Actions",
      className: "text-center",
      cell: (row) => (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => handleOpenAdjust(row)}
            className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-orange-600"
            title="Adjust Stock"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(row)}
            className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
            title="Edit Product"
          >
            <Edit className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Title & Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Package className="h-6 w-6 text-orange-600" />
              <span>Product Master</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage construction & hardware catalog, HSN, pricing, and stock thresholds
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
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-orange-500 transition-colors shadow-md shadow-orange-600/20"
            >
              <Plus className="h-4 w-4" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Data Table with Filter Controls */}
        <DataTable
          columns={columns}
          data={filteredProducts}
          searchKey="name"
          searchPlaceholder="Search product by name or SKU..."
          pageSize={12}
          filterComponent={
            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-orange-500 focus:outline-hidden"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Brand Filter */}
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-orange-500 focus:outline-hidden"
              >
                <option value="">All Brands</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>

              {/* Low Stock Toggle */}
              <button
                type="button"
                onClick={() => setOnlyLowStock(!onlyLowStock)}
                className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors ${
                  onlyLowStock
                    ? "border-amber-300 bg-amber-50 text-amber-800"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <span>Low Stock Only</span>
              </button>
            </div>
          }
        />
      </div>

      {/* Add Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Product"
        subtitle="Fill in construction material details, HSN, pricing and stock"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. UltraTech Super Cement 50kg"
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                SKU Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-mono uppercase focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                HSN / SAC Code
              </label>
              <input
                type="text"
                value={formData.hsnCode}
                onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                placeholder="e.g. 2523, 7214"
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-mono focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-orange-500 focus:outline-hidden"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Brand
              </label>
              <select
                value={formData.brandId}
                onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-orange-500 focus:outline-hidden"
              >
                <option value="">Select Brand</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit of Measurement <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.unitId}
                onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-semibold focus:border-orange-500 focus:outline-hidden uppercase"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GST Rate (%)
              </label>
              <select
                value={formData.gstRate}
                onChange={(e) => setFormData({ ...formData, gstRate: Number(e.target.value) })}
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-semibold focus:border-orange-500 focus:outline-hidden"
              >
                <option value={0}>0% (Exempt)</option>
                <option value={5}>5%</option>
                <option value={12}>12%</option>
                <option value={18}>18% (Standard)</option>
                <option value={28}>28% (Cement/Paints)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Purchase Price (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-mono focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Selling Price (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.salePrice}
                onChange={(e) => setFormData({ ...formData, salePrice: Number(e.target.value) })}
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-mono font-bold focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Minimum Stock Level (Alert)
              </label>
              <input
                type="number"
                value={formData.minStockLevel}
                onChange={(e) => setFormData({ ...formData, minStockLevel: Number(e.target.value) })}
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Opening Stock
              </label>
              <input
                type="number"
                value={formData.openingStock}
                onChange={(e) => setFormData({ ...formData, openingStock: Number(e.target.value) })}
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-orange-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-500 shadow-sm"
            >
              Save Product
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Product"
        maxWidth="2xl"
      >
        <form onSubmit={handleUpdateProduct} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Purchase Price (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-mono focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Selling Price (₹)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.salePrice}
                onChange={(e) => setFormData({ ...formData, salePrice: Number(e.target.value) })}
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-mono font-bold focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GST Rate (%)
              </label>
              <select
                value={formData.gstRate}
                onChange={(e) => setFormData({ ...formData, gstRate: Number(e.target.value) })}
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-semibold focus:border-orange-500 focus:outline-hidden"
              >
                <option value={0}>0%</option>
                <option value={5}>5%</option>
                <option value={12}>12%</option>
                <option value={18}>18%</option>
                <option value={28}>28%</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Min Stock Alert Level
              </label>
              <input
                type="number"
                value={formData.minStockLevel}
                onChange={(e) => setFormData({ ...formData, minStockLevel: Number(e.target.value) })}
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-orange-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-500 shadow-sm"
            >
              Update Product
            </button>
          </div>
        </form>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Stock Adjustment"
        subtitle={`Adjust physical inventory for ${currentProduct?.name}`}
        maxWidth="md"
      >
        <form onSubmit={handleStockAdjustment} className="space-y-4">
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Current Stock:</span>
              <span className="font-bold text-slate-900">
                {currentProduct?.currentStock} {currentProduct?.unit?.code}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Adjustment Type
            </label>
            <select
              value={adjustData.type}
              onChange={(e) => setAdjustData({ ...adjustData, type: e.target.value })}
              className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-semibold focus:border-orange-500 focus:outline-hidden"
            >
              <option value="ADJUSTMENT_INCREASE">+ Increase Stock (Found / Inward Correction)</option>
              <option value="ADJUSTMENT_DECREASE">- Decrease Stock (Damage / Breakage / Shortage)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quantity to Adjust
            </label>
            <input
              type="number"
              min="0.1"
              step="any"
              required
              value={adjustData.quantity}
              onChange={(e) => setAdjustData({ ...adjustData, quantity: Number(e.target.value) })}
              className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-bold focus:border-orange-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Adjustment <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={adjustData.reason}
              onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
              placeholder="e.g. Broken in transit, Year-end physical verification"
              className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-orange-500 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-500 shadow-sm"
            >
              Apply Adjustment
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
