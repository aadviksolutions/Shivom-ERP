"use client";

import React, { useState } from "react";
import { X, UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";

interface NewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerCreated: (customer: any) => void;
  existingCustomers?: any[];
}

export default function NewCustomerModal({
  isOpen,
  onClose,
  onCustomerCreated,
  existingCustomers = [],
}: NewCustomerModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    altMobile: "",
    address: "",
    city: "Pune",
    state: "Maharashtra",
    pincode: "",
    customerType: "Individual", // Individual or Business
    gstin: "",
    openingBalance: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // 1. Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Customer name is mandatory.";
    }

    // 2. Mobile validation
    const cleanMobile = formData.mobile.replace(/\D/g, "");
    if (!cleanMobile) {
      newErrors.mobile = "Mobile number is mandatory.";
    } else if (cleanMobile.length !== 10 || !/^[6-9]/.test(cleanMobile)) {
      newErrors.mobile = "Enter a valid 10-digit Indian mobile number (e.g. 98200 12345).";
    }

    // 3. Alternate Mobile validation (optional)
    if (formData.altMobile.trim()) {
      const cleanAlt = formData.altMobile.replace(/\D/g, "");
      if (cleanAlt.length !== 10 || !/^[6-9]/.test(cleanAlt)) {
        newErrors.altMobile = "Enter a valid 10-digit alternate mobile number.";
      }
    }

    // 4. PIN Code validation (optional)
    if (formData.pincode.trim()) {
      const cleanPin = formData.pincode.replace(/\D/g, "");
      if (cleanPin.length !== 6) {
        newErrors.pincode = "PIN Code must be a 6-digit number.";
      }
    }

    // 5. GSTIN validation (optional)
    if (formData.gstin.trim()) {
      const gstinUpper = formData.gstin.trim().toUpperCase();
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(gstinUpper)) {
        newErrors.gstin = "Invalid GSTIN format (e.g. 27AABCS1429B1Z8).";
      }
    }

    // 6. Duplicate check against existing customers in memory
    if (cleanMobile) {
      const dup = existingCustomers.find(
        (c) => c.mobile.replace(/\D/g, "") === cleanMobile
      );
      if (dup) {
        newErrors.mobile = `Customer with this mobile already exists: "${dup.name}".`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    if (!validate()) return;

    setSubmitting(true);
    try {
      const cleanMobile = formData.mobile.replace(/\D/g, "");
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          mobile: cleanMobile,
          altMobile: formData.altMobile.replace(/\D/g, "") || undefined,
          address: formData.address.trim() || undefined,
          city: formData.city.trim() || "Pune",
          state: formData.state.trim() || "Maharashtra",
          pincode: formData.pincode.trim() || undefined,
          customerType: formData.customerType,
          gstin: formData.gstin.trim().toUpperCase() || undefined,
          openingBalance: Number(formData.openingBalance) || 0,
          notes: formData.notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error || "Failed to create customer.");
        setSubmitting(false);
        return;
      }

      // Success: pass new customer object back to billing page
      onCustomerCreated(data.data);
      onClose();
    } catch {
      setServerError("Network error creating customer. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e16718] text-white">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#24282c]">Add New Customer</h3>
              <p className="text-[11px] text-slate-500">
                Register customer to continue billing without refreshing
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="mx-5 mt-4 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-600 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto" noValidate>
          {/* Customer Type Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Customer Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, customerType: "Individual" })}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  formData.customerType === "Individual"
                    ? "bg-[#e16718] text-white border-[#e16718]"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Individual / Contractor
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, customerType: "Business" })}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  formData.customerType === "Business"
                    ? "bg-[#e16718] text-white border-[#e16718]"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Business / Firm (GST)
              </button>
            </div>
          </div>

          {/* Name & Mobile Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Patil or Royal Builders"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: "" });
                }}
                className={`h-9 w-full rounded-lg border bg-slate-50/50 px-3 text-xs text-slate-900 focus:bg-white focus:outline-hidden ${
                  errors.name ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#e16718]"
                }`}
              />
              {errors.name && <p className="mt-1 text-[11px] text-rose-500">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="10-digit mobile (e.g. 9820012345)"
                value={formData.mobile}
                onChange={(e) => {
                  setFormData({ ...formData, mobile: e.target.value });
                  if (errors.mobile) setErrors({ ...errors, mobile: "" });
                }}
                className={`h-9 w-full rounded-lg border bg-slate-50/50 px-3 text-xs text-slate-900 font-mono focus:bg-white focus:outline-hidden ${
                  errors.mobile ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#e16718]"
                }`}
              />
              {errors.mobile && <p className="mt-1 text-[11px] text-rose-500">{errors.mobile}</p>}
            </div>
          </div>

          {/* Alternate Mobile & GSTIN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alternate Mobile <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                maxLength={10}
                placeholder="Secondary contact"
                value={formData.altMobile}
                onChange={(e) => {
                  setFormData({ ...formData, altMobile: e.target.value });
                  if (errors.altMobile) setErrors({ ...errors, altMobile: "" });
                }}
                className={`h-9 w-full rounded-lg border bg-slate-50/50 px-3 text-xs text-slate-900 font-mono focus:bg-white focus:outline-hidden ${
                  errors.altMobile ? "border-rose-400" : "border-slate-200 focus:border-[#e16718]"
                }`}
              />
              {errors.altMobile && <p className="mt-1 text-[11px] text-rose-500">{errors.altMobile}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GSTIN <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                maxLength={15}
                placeholder="15-digit GSTIN (e.g. 27AABCS1429B1Z8)"
                value={formData.gstin}
                onChange={(e) => {
                  setFormData({ ...formData, gstin: e.target.value.toUpperCase() });
                  if (errors.gstin) setErrors({ ...errors, gstin: "" });
                }}
                className={`h-9 w-full rounded-lg border bg-slate-50/50 px-3 text-xs text-slate-900 font-mono uppercase focus:bg-white focus:outline-hidden ${
                  errors.gstin ? "border-rose-400" : "border-slate-200 focus:border-[#e16718]"
                }`}
              />
              {errors.gstin && <p className="mt-1 text-[11px] text-rose-500">{errors.gstin}</p>}
            </div>
          </div>

          {/* Billing Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Billing Address
            </label>
            <textarea
              rows={2}
              placeholder="Site / Office address..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:bg-white focus:border-[#e16718] focus:outline-hidden"
            />
          </div>

          {/* City, State & PIN Code */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 text-xs focus:bg-white focus:border-[#e16718] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 text-xs focus:bg-white focus:border-[#e16718] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">PIN Code</label>
              <input
                type="text"
                maxLength={6}
                placeholder="411028"
                value={formData.pincode}
                onChange={(e) => {
                  setFormData({ ...formData, pincode: e.target.value });
                  if (errors.pincode) setErrors({ ...errors, pincode: "" });
                }}
                className={`h-9 w-full rounded-lg border bg-slate-50/50 px-2.5 text-xs font-mono focus:bg-white focus:outline-hidden ${
                  errors.pincode ? "border-rose-400" : "border-slate-200 focus:border-[#e16718]"
                }`}
              />
              {errors.pincode && <p className="mt-1 text-[10px] text-rose-500">{errors.pincode}</p>}
            </div>
          </div>

          {/* Opening Balance & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Opening Balance (₹) <span className="text-slate-400 font-normal">(if any due)</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.openingBalance}
                onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-mono focus:bg-white focus:border-[#e16718] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notes / Reference
              </label>
              <input
                type="text"
                placeholder="e.g. Contractor for Phase 3"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs focus:bg-white focus:border-[#e16718] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 rounded-lg bg-[#e16718] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#c9550e] transition-colors disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{submitting ? "Saving Customer..." : "Save Customer"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
