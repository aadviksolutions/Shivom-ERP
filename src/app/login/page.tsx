"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const errs: { identifier?: string; password?: string } = {};
    if (!identifier.trim()) {
      errs.identifier = "Please enter your username or registered email.";
    }
    if (!password) {
      errs.password = "Please enter your password.";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async (e?: React.FormEvent, customId?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setError("");

    const loginId = customId || identifier;
    const loginPass = customPass || password;

    if (!customId && !validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: loginId, password: loginPass }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid credentials. Please verify your username/email and password.");
        setLoading(false);
        return;
      }

      // Determine authorized destination and perform clean navigation
      let destination = callbackUrl;
      if (!callbackUrl || callbackUrl === "/login" || callbackUrl === "/") {
        destination = "/dashboard";
      }

      // Complete memory and cache flush
      window.location.href = destination;
    } catch {
      setError("Network connection issue. Please check your network and try again.");
      setLoading(false);
    }
  };

  const handleQuickDemo = (role: "ADMIN" | "BILLING" | "STORE") => {
    setFieldErrors({});
    if (role === "ADMIN") {
      setIdentifier("admin@shivomconstruction.com");
      setPassword("admin123");
      handleLogin(undefined, "admin@shivomconstruction.com", "admin123");
    } else if (role === "BILLING") {
      setIdentifier("billing@shivomconstruction.com");
      setPassword("billing123");
      handleLogin(undefined, "billing@shivomconstruction.com", "billing123");
    } else {
      setIdentifier("store@shivomconstruction.com");
      setPassword("store123");
      handleLogin(undefined, "store@shivomconstruction.com", "store123");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-0 lg:p-6 selection:bg-orange-100 selection:text-orange-900">
      <div className="w-full h-full lg:max-w-5xl lg:min-h-[640px] grid grid-cols-1 lg:grid-cols-12 bg-white lg:rounded-3xl lg:border lg:border-slate-200 lg:shadow-2xl overflow-hidden">
        {/* Left Column: Branding & Construction Material Visual (Desktop) */}
        <div className="hidden lg:flex lg:col-span-5 relative flex-col justify-between p-10 bg-[#16181b] text-white overflow-hidden">
          {/* Construction Warehouse Backdrop with Subtle Zoom */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/intro-banner.jpg"
            alt="Shivom Construction Materials Warehouse"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-35 filter brightness-90 animate-slow-zoom"
          />

          {/* Architectural Dark Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#16181b] via-[#16181b]/70 to-[#16181b]/40 pointer-events-none" />

          {/* Top Brand Logo */}
          <div className="relative z-10">
            <div className="inline-block rounded-2xl bg-white p-3 shadow-md border border-slate-700/60 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/shivom-logo.png"
                alt="Shivom Construction Official Logo"
                className="h-14 w-auto object-contain"
              />
            </div>
            <h2 className="text-xl font-black tracking-tight text-white leading-tight">
              Shivom Construction
            </h2>
            <p className="text-xs font-bold uppercase tracking-widest text-[#e16718] mt-0.5">
              Building Material Supply
            </p>
          </div>

          {/* Middle Value Proposition */}
          <div className="relative z-10 space-y-4 my-auto py-8">
            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-orange-400 font-bold">
                Enterprise Cloud ERP
              </span>
              <h3 className="text-2xl font-black text-white leading-tight">
                Built for Heavy Hardware & Material Supply
              </h3>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-300 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#e16718] shrink-0" />
                <span>Instant GST Invoicing & Counter POS</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#e16718] shrink-0" />
                <span>Multi-Godown Stock & Inventory Tracking</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#e16718] shrink-0" />
                <span>Granular Owner/Admin Role & Permissions</span>
              </li>
            </ul>
          </div>

          {/* Bottom Security Assurance */}
          <div className="relative z-10 pt-4 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-[#e16718]" />
            <span>Secure 256-bit Session Authentication</span>
          </div>
        </div>

        {/* Right Column: Sign In Card */}
        <div className="col-span-1 lg:col-span-7 flex flex-col justify-center px-6 py-8 sm:px-12 md:px-16 bg-white">
          <div className="w-full max-w-md mx-auto space-y-6">
            {/* Mobile Header Branding */}
            <div className="lg:hidden flex items-center gap-3 border-b border-slate-100 pb-4 mb-2">
              <div className="rounded-xl bg-white p-2 border border-slate-200 shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/shivom-logo.png"
                  alt="Shivom Construction Logo"
                  className="h-10 w-auto object-contain"
                />
              </div>
              <div>
                <h1 className="text-sm font-black text-[#24282c] leading-tight">
                  Shivom Construction
                </h1>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#e16718]">
                  Building Material Supply
                </p>
              </div>
            </div>

            {/* Welcome Back Heading */}
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight text-[#24282c]">
                Welcome back!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Sign in to Shivom Construction ERP.
              </p>
            </div>

            {/* Error Message Alert */}
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 font-semibold flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Sign In Form */}
            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Username or Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (fieldErrors.identifier) setFieldErrors({ ...fieldErrors, identifier: undefined });
                    }}
                    placeholder="e.g. admin@shivomconstruction.com"
                    className={`h-10 w-full rounded-xl border bg-slate-50/50 pl-10 pr-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden transition-all ${
                      fieldErrors.identifier
                        ? "border-rose-400 focus:border-rose-500"
                        : "border-slate-200 focus:border-[#e16718]"
                    }`}
                  />
                </div>
                {fieldErrors.identifier && (
                  <p className="mt-1 text-[11px] font-medium text-rose-500">{fieldErrors.identifier}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
                    }}
                    placeholder="••••••••"
                    className={`h-10 w-full rounded-xl border bg-slate-50/50 pl-10 pr-10 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden transition-all ${
                      fieldErrors.password
                        ? "border-rose-400 focus:border-rose-500"
                        : "border-slate-200 focus:border-[#e16718]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-hidden cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-[11px] font-medium text-rose-500">{fieldErrors.password}</p>
                )}
              </div>

              {/* Remember Me Option */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded-md border-slate-300 text-[#e16718] focus:ring-[#e16718]"
                  />
                  <span className="font-semibold text-slate-600">Remember this device</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#e16718] px-4 text-xs font-bold text-white shadow-lg shadow-orange-600/25 hover:bg-[#c9550e] transition-all disabled:opacity-50 cursor-pointer active:scale-98"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to ERP</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Access Bar */}
            <div className="border-t border-slate-100 pt-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-2.5">
                Quick Demo Access (Select Role)
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemo("ADMIN")}
                  className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50/70 p-2 text-center hover:border-[#e16718] hover:bg-orange-50/40 transition-all cursor-pointer"
                >
                  <ShieldCheck className="h-4 w-4 text-[#e16718] mb-0.5" />
                  <span className="text-[11px] font-bold text-[#24282c]">Owner</span>
                  <span className="text-[9px] text-slate-500 font-medium">Admin</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo("BILLING")}
                  className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50/70 p-2 text-center hover:border-blue-400 hover:bg-blue-50/40 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4 text-blue-600 mb-0.5" />
                  <span className="text-[11px] font-bold text-[#24282c]">Billing</span>
                  <span className="text-[9px] text-slate-500 font-medium">Sales Desk</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo("STORE")}
                  className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50/70 p-2 text-center hover:border-emerald-400 hover:bg-emerald-50/40 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 mb-0.5" />
                  <span className="text-[11px] font-bold text-[#24282c]">Store</span>
                  <span className="text-[9px] text-slate-500 font-medium">Inventory</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#16181b] text-white">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold">Loading Shivom Construction ERP...</span>
          </div>
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
