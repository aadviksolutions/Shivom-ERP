"use client";

import React from "react";
import Link from "next/link";
import {
  Package,
  ShoppingCart,
  FileText,
  Users,
  Warehouse,
  BarChart3,
  Receipt,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import FrameSequencePlayer from "@/components/home/FrameSequencePlayer";

export default function IntroPage() {
  const featureList = [
    {
      title: "Inventory",
      subtitle: "Stock Tracking",
      icon: Package,
    },
    {
      title: "Purchase",
      subtitle: "Goods Inward",
      icon: ShoppingCart,
    },
    {
      title: "Sales & Billing",
      subtitle: "GST Invoices",
      icon: FileText,
    },
    {
      title: "Customers",
      subtitle: "Ledger & Dues",
      icon: Users,
    },
    {
      title: "Quotations",
      subtitle: "Fast Estimates",
      icon: Receipt,
    },
    {
      title: "Godown / Yard",
      subtitle: "Multi-Location",
      icon: Warehouse,
    },
    {
      title: "Reports & GST",
      subtitle: "Live Analytics",
      icon: BarChart3,
    },
    {
      title: "Easy to Use",
      subtitle: "Instant POS",
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="relative min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden bg-[#121417] text-white selection:bg-orange-500/30 selection:text-orange-200 flex flex-col justify-between overflow-x-hidden">
      {/* 
        1. FULL-SCREEN 16:9 HERO ANIMATION BACKGROUND LAYER
        Covers the complete viewport behind the content with 8-second sequence,
        holding final frame upon completion.
      */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Hardware-accelerated 16:9 canvas sequence */}
        <FrameSequencePlayer className="w-full h-full object-cover object-center" showReplayButton={false} />

        {/* 
          Architectural Contrast Gradient:
          Ensures high text contrast across left & center while preserving 
          the golden construction yard, warehouse, rods and helmet on the right.
        */}
        <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-[#121417]/95 via-[#121417]/85 to-[#121417]/35 pointer-events-none" />
        <div className="lg:hidden absolute inset-0 bg-gradient-to-b from-[#121417]/95 via-[#121417]/80 to-[#121417]/95 pointer-events-none" />

        {/* Subtle orange ambient glow in the corner */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#e16718]/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. TOP HEADER (COMPACT HEIGHT FOR 100VH TARGETS) */}
      <header className="relative z-20 w-full px-5 py-3 md:px-10 lg:px-14 flex items-center justify-between shrink-0 border-b border-white/10 backdrop-blur-xs">
        {/* Top-Left: Original Shivom Construction Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="rounded-xl bg-white p-1.5 shadow-md border border-slate-700/60 flex items-center justify-center transition-transform group-hover:scale-102">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/shivom-logo.png"
              alt="Shivom Construction Official Logo"
              className="h-8 sm:h-9 w-auto object-contain"
            />
          </div>
          <div>
            <span className="block text-xs sm:text-sm font-black tracking-tight text-white leading-tight">
              Shivom Construction
            </span>
            <span className="block text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#e16718]">
              Building Material Supply
            </span>
          </div>
        </Link>

        {/* Top-Right: Quick Navigation & CTAs */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-md px-3.5 sm:px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-white/20 hover:border-white/40 transition-all cursor-pointer active:scale-96"
          >
            Login
          </Link>
          <Link
            href="/login"
            className="rounded-xl bg-[#e16718] px-4 sm:px-5 py-1.5 text-xs font-bold text-white shadow-md shadow-orange-600/30 hover:bg-[#c9550e] transition-all cursor-pointer active:scale-96 flex items-center gap-1.5"
          >
            <span>Get Started</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* 3. CENTER HERO BODY (FITS ON ONE SCREEN AT 1366x768 AND 1920x1080) */}
      <main className="relative z-20 flex-1 max-w-6xl mx-auto w-full px-5 md:px-10 lg:px-14 py-3 md:py-4 lg:py-6 flex flex-col justify-center">
        <div className="max-w-3xl space-y-3 sm:space-y-4">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e16718] animate-pulse" />
            <Sparkles className="h-3 w-3 text-[#e16718]" />
            <span>Cloud ERP for Building Material Supply</span>
          </div>

          {/* Main Headline on One or Two Lines */}
          <div className="space-y-1 sm:space-y-1.5">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.12] text-white">
              Shivom Construction <span className="text-[#e16718]">ERP</span>
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-slate-300 font-medium max-w-2xl leading-normal">
              Manage inventory, purchases, sales and billing in one simple platform.
            </p>
          </div>

          {/* 4. COMPACT 8-FEATURE HIGHLIGHTS (4 COLUMNS x 2 ROWS ON DESKTOP) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 pt-1 max-w-3xl">
            {featureList.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl bg-slate-900/70 border border-slate-700/60 shadow-xs hover:border-[#e16718]/70 hover:bg-slate-900/90 transition-all backdrop-blur-md group cursor-default"
                >
                  <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-orange-500/20 text-[#e16718] shrink-0 group-hover:scale-105 group-hover:bg-[#e16718] group-hover:text-white transition-all">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 overflow-hidden text-left">
                    <span className="block text-[11px] sm:text-xs font-bold text-white truncate leading-tight">
                      {item.title}
                    </span>
                    <span className="block text-[9px] sm:text-[10px] text-slate-400 truncate leading-tight">
                      {item.subtitle}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 5. PROMINENT GET STARTED CTA */}
          <div className="pt-2 sm:pt-3 flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-3 rounded-xl bg-[#e16718] px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-xl shadow-orange-600/30 hover:bg-[#c9550e] hover:shadow-orange-600/40 transition-all duration-200 cursor-pointer active:scale-98"
            >
              <span>Get Started Now</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-all backdrop-blur-md cursor-pointer"
            >
              <span>Sign In to ERP</span>
            </Link>

            <span className="text-[11px] text-slate-400 hidden md:inline ml-1 font-medium">
              Instant login • Role-based access
            </span>
          </div>
        </div>
      </main>

      {/* 6. CLEAN ONE-LINE FOOTER (COMPACT HEIGHT) */}
      <footer className="relative z-20 w-full border-t border-white/10 bg-[#121417]/80 backdrop-blur-md py-2 px-5 md:px-10 lg:px-14 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 shrink-0 gap-1 sm:gap-0">
        <p className="font-medium">
          Shivom Construction ERP • Building Material Supply
        </p>
        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-[#e16718]" />
            <span>256-bit Secure</span>
          </span>
          <span>•</span>
          <span>Role-Based Access</span>
          <span>•</span>
          <span>PWA Ready</span>
        </div>
      </footer>
    </div>
  );
}
