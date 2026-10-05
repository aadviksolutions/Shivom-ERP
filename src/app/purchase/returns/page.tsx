"use client";

import React from "react";
import AppLayout from "@/components/layout/AppLayout";
import { RotateCcw } from "lucide-react";

export default function PurchaseReturnsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <RotateCcw className="h-6 w-6 text-blue-600" />
            <span>Purchase Returns & Debit Notes</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Return damaged or off-spec supplies back to distributor with stock reduction
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-xs">
          <RotateCcw className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No Purchase Returns Recorded</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Debit notes and returns can be raised against any inward shipment from the Purchase register.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
