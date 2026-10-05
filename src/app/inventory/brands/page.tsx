"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Modal from "@/components/ui/Modal";
import { Award, Plus, RefreshCw } from "lucide-react";

export default function BrandsPage() {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory/brands");
      const json = await res.json();
      if (json.success) setBrands(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/inventory/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsAddOpen(false);
        setName("");
        setDescription("");
        fetchBrands();
      } else {
        alert(data.error || "Failed to create brand");
      }
    } catch {
      alert("Error creating brand");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Award className="h-6 w-6 text-orange-600" />
              <span>Manufacturer Brands</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Authorized brand partnerships (Tata Tiscon, UltraTech, Astral, Asian Paints, etc.)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchBrands}
              disabled={loading}
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-orange-600" : ""}`} />
            </button>
            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-orange-500 shadow-md shadow-orange-600/20"
            >
              <Plus className="h-4 w-4" />
              <span>Add Brand</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {brands.map((b) => (
            <div key={b.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <h3 className="font-bold text-slate-900 text-sm">{b.name}</h3>
              <p className="text-xs text-slate-500 mt-1 min-h-[32px]">{b.description || "Authorized manufacturer"}</p>
              <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-600 font-medium">
                <span>Products: <strong>{b._count?.products || 0}</strong></span>
                <span className="text-emerald-600">Active</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Brand" maxWidth="sm">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Brand Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kajaria Ceramics"
              className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-orange-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-orange-500 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-orange-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-orange-500"
            >
              Save Brand
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
