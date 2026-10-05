"use client";

import React from "react";
import AppLayout from "@/components/layout/AppLayout";
import { RotateCcw } from "lucide-react";

export default function SalesReturnsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <RotateCcw className="h-6 w-6 text-orange-600" />
            <span>Sales Returns & Credit Notes</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Process customer returned materials (bags/pipes/fittings) with automatic stock replenishment
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-xs">
          <RotateCcw className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No Sales Returns Recorded</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Sales returns can be generated directly by clicking &quot;Return Item&quot; on any issued sales invoice in the Sales register.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
