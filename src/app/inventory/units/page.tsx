"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Modal from "@/components/ui/Modal";
import { Ruler, Plus, RefreshCw, CheckCircle2 } from "lucide-react";

export default function UnitsPage() {
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory/units");
      const json = await res.json();
      if (json.success) setUnits(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/inventory/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code: code.toUpperCase(), description }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsAddOpen(false);
        setName("");
        setCode("");
        setDescription("");
        fetchUnits();
      } else {
        alert(data.error || "Failed to create unit");
      }
    } catch {
      alert("Error creating unit");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Ruler className="h-6 w-6 text-orange-600" />
              <span>Unit of Measurement (UOM)</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configurable unit system (BAG, TON, KG, METER, FEET, LITRE, PCS, BOX, SET, DOZEN)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchUnits}
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
              <span>Add Custom Unit</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {units.map((u) => (
            <div
              key={u.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between"
            >
              <div>
                <span className="font-mono text-xs font-black uppercase text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                  {u.code}
                </span>
                <h3 className="font-bold text-slate-900 text-sm mt-2">{u.name}</h3>
                {u.description && <p className="text-[11px] text-slate-400 mt-0.5">{u.description}</p>}
              </div>

              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>SKUs: <strong>{u._count?.products || 0}</strong></span>
                {u.isDefault && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Unit" maxWidth="sm">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Unit Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bundles"
              className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs focus:border-orange-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Unit Code (Abbreviation) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. BDL"
              className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-mono uppercase focus:border-orange-500 focus:outline-hidden"
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
              placeholder="Optional remarks"
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
              Save Unit
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
