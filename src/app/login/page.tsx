"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, ShieldCheck, Lock, Mail, ArrowRight, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    setError("");
    setLoading(true);

    const loginEmail = customEmail || email;
    const loginPassword = customPassword || password;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  const handleQuickDemo = (role: "ADMIN" | "BILLING" | "STORE") => {
    if (role === "ADMIN") {
      setEmail("admin@buildstock.com");
      setPassword("admin123");
      handleLogin(undefined, "admin@buildstock.com", "admin123");
    } else if (role === "BILLING") {
      setEmail("billing@buildstock.com");
      setPassword("billing123");
      handleLogin(undefined, "billing@buildstock.com", "billing123");
    } else {
      setEmail("store@buildstock.com");
      setPassword("store123");
      handleLogin(undefined, "store@buildstock.com", "store123");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 py-8">
      {/* Background Subtle Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-xl shadow-orange-600/30 mb-3">
            <Building2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            BuildStock ERP
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-400">
            Construction & Hardware Material Supplier Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
          <h2 className="text-base font-bold text-white mb-1">Sign In to Dashboard</h2>
          <p className="text-xs text-slate-400 mb-5">
            Enter your credentials or use quick demo profiles below.
          </p>

          {error && (
            <div className="mb-4 rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@buildstock.com"
                  className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900/90 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:border-orange-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900/90 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:border-orange-500 focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 text-xs font-bold text-white shadow-md shadow-orange-600/30 hover:bg-orange-500 transition-colors disabled:opacity-50"
            >
              <span>{loading ? "Authenticating..." : "Sign In to ERP"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Demo Accounts */}
          <div className="mt-6 border-t border-slate-800/80 pt-5">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
              Fast Demo Quick-Access
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo("ADMIN")}
                className="flex flex-col items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-center hover:border-orange-500/50 hover:bg-slate-900 transition-all"
              >
                <ShieldCheck className="h-4 w-4 text-orange-400 mb-1" />
                <span className="text-[11px] font-bold text-white">Owner</span>
                <span className="text-[9px] text-slate-400">Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo("BILLING")}
                className="flex flex-col items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-center hover:border-blue-500/50 hover:bg-slate-900 transition-all"
              >
                <CheckCircle2 className="h-4 w-4 text-blue-400 mb-1" />
                <span className="text-[11px] font-bold text-white">Billing</span>
                <span className="text-[9px] text-slate-400">Sales Desk</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo("STORE")}
                className="flex flex-col items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-center hover:border-emerald-500/50 hover:bg-slate-900 transition-all"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400 mb-1" />
                <span className="text-[11px] font-bold text-white">Store</span>
                <span className="text-[9px] text-slate-400">Inventory</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-5 text-center text-xs text-slate-500">
          BuildStock ERP • Powered by Shivom Construction Platform
        </p>
      </div>
    </div>
  );
}
