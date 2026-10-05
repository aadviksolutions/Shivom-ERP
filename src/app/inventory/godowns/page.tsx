"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Modal from "@/components/ui/Modal";
import { Warehouse, Plus, RefreshCw, CheckCircle2 } from "lucide-react";

export default function GodownsPage() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    isDefault: false,
  });

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory/godowns");
      const json = await res.json();
      if (json.success) setWarehouses(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/inventory/godowns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setIsAddModalOpen(false);
        setFormData({ name: "", code: "", address: "", isDefault: false });
        fetchWarehouses();
      } else {
        alert(data.error || "Failed to create godown");
      }
    } catch {
      alert("Error creating godown");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Warehouse className="h-6 w-6 text-orange-600" />
              <span>Godown & Yard Management</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage central inventory warehouses, rebar cutting yards and retail depot sites
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchWarehouses}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-orange-600" : ""}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-orange-500 transition-colors shadow-md shadow-orange-600/20"
            >
              <Plus className="h-4 w-4" />
              <span>Add Godown</span>
            </button>
          </div>
        </div>

        {/* Warehouses Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map((w) => (
            <div
              key={w.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                    {w.code}
                  </span>
                  {w.isDefault && (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      Default Yard
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-3">{w.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{w.address || "No address specified"}</p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>SKUs Stored: <strong>{w.stocks?.length || 0}</strong></span>
                <span className="text-emerald-600 font-semibold">• Active Yard</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Godown Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Godown / Yard"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Godown / Yard Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. South Depot Yard"
              className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-orange-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Yard Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g. SOUTH-03"
              className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-mono uppercase focus:border-orange-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Address & Location
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. Ring Road Depot, Sector 4"
              className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-orange-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 h-4 w-4"
            />
            <label htmlFor="isDefault" className="text-xs text-slate-700 font-medium">
              Set as primary default billing godown
            </label>
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
              Save Godown
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
