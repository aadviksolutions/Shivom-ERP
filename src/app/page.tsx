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
  Settings,
  ArrowRight,
} from "lucide-react";
import FrameSequencePlayer from "@/components/home/FrameSequencePlayer";

export default function IntroPage() {
  const featureList = [
    {
      title: "Inventory",
      subtitle: "Management",
      icon: Package,
    },
    {
      title: "Purchase",
      subtitle: "Management",
      icon: ShoppingCart,
    },
    {
      title: "Sales &",
      subtitle: "Billing",
      icon: FileText,
    },
    {
      title: "Customer &",
      subtitle: "Supplier Management",
      icon: Users,
    },
    {
      title: "Stock &",
      subtitle: "Godown",
      icon: Warehouse,
    },
    {
      title: "Reports &",
      subtitle: "Analytics",
      icon: BarChart3,
    },
    {
      title: "GST",
      subtitle: "Invoicing",
      icon: Receipt,
    },
    {
      title: "Simple &",
      subtitle: "Easy to Use",
      icon: Settings,
    },
  ];

  return (
    <div className="relative min-h-screen bg-white text-[#24282c] selection:bg-orange-100 selection:text-orange-900 flex flex-col justify-between overflow-x-hidden">
      {/* 
        BACKGROUND LAYER: 
        The actual supplied construction yard photograph positioned on desktop to cover the right side,
        softly blending into the crisp white messaging area on the left.
      */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Right-aligned Hero Construction Yard 8-Second Animation Sequence */}
        <div className="absolute top-0 right-0 w-full lg:w-[62%] xl:w-[58%] h-full">
          <FrameSequencePlayer className="w-full h-full" showReplayButton={false} />

          {/* Smooth horizontal gradient blending white content into the animation */}
          <div className="hidden lg:block absolute inset-y-0 left-0 w-44 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none" />
          <div className="hidden lg:block absolute inset-y-0 -left-12 w-28 bg-white pointer-events-none" />

          {/* Top subtle vignette for header contrast */}
          <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-white/90 via-white/40 to-transparent lg:from-transparent pointer-events-none" />

          {/* Bottom subtle blend for footer */}
          <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-white/90 to-transparent lg:hidden pointer-events-none" />
        </div>

        {/* Diagonal Geometric Brand Orange Accents inspired by reference design */}
        <div className="hidden lg:block absolute -bottom-16 -right-16 w-80 h-80 bg-gradient-to-tl from-[#e16718] to-[#f97316] opacity-90 rounded-full blur-2xl transform rotate-12" />
        <div
          className="hidden lg:block absolute bottom-0 right-0 w-72 h-44 pointer-events-none opacity-85"
          style={{
            background: "linear-gradient(135deg, transparent 35%, #e16718 35%)",
          }}
        />
        <div
          className="hidden lg:block absolute top-1/3 -left-12 w-28 h-56 pointer-events-none opacity-15"
          style={{
            background: "linear-gradient(135deg, #e16718 0%, transparent 70%)",
            borderRadius: "0 100px 100px 0",
          }}
        />
      </div>

      {/* TOP HEADER */}
      <header className="relative z-30 w-full px-6 py-4 md:px-12 lg:px-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            {/* Original Exact Logo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/shivom-logo.png"
              alt="Shivom Construction Logo"
              className="h-10 sm:h-12 w-auto object-contain transition-transform hover:scale-102"
            />
          </Link>
        </div>

        {/* Top-Right Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-xl border border-slate-300 bg-white/90 backdrop-blur-xs px-5 py-2 text-xs md:text-sm font-bold text-[#24282c] shadow-xs hover:border-[#24282c] hover:bg-slate-50 transition-all cursor-pointer active:scale-95"
          >
            Login
          </Link>
          <Link
            href="/login"
            className="rounded-xl bg-[#e16718] px-5 py-2 text-xs md:text-sm font-bold text-white shadow-md shadow-orange-600/25 hover:bg-[#c9550e] transition-all cursor-pointer active:scale-95"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* MAIN HERO CONTENT */}
      <main className="relative z-20 flex-1 max-w-7xl mx-auto w-full px-6 md:px-12 lg:px-16 py-6 lg:py-10 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-8 lg:gap-12">
          {/* Left Content Area (Columns 1 to 7) */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6 max-w-2xl bg-white/80 lg:bg-transparent backdrop-blur-xs lg:backdrop-blur-none p-4 sm:p-6 lg:p-0 rounded-3xl">
            {/* Large Prominent Original Logo Reveal */}
            <div className="animate-logo-pop inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/shivom-logo.png"
                alt="Shivom Construction - Building Material Supply"
                className="h-24 sm:h-28 md:h-32 w-auto object-contain drop-shadow-xs"
              />
            </div>

            {/* Headline & Description with Staggered Fade Upward */}
            <div className="animate-fade-in-up animation-delay-100 space-y-2.5">
              <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-black tracking-tight leading-[1.12] text-[#24282c]">
                Shivom Construction <span className="text-[#e16718]">ERP</span>
              </h1>
              <p className="text-base sm:text-lg font-bold text-slate-700 tracking-tight">
                Simplify Your Business. Build a Stronger Tomorrow.
              </p>
              <p className="text-xs sm:text-sm text-slate-500 max-w-xl leading-relaxed">
                Manage your inventory, purchases, sales, billing and business accounts from one simple platform.
              </p>
            </div>

            {/* 8 Compact Feature Grid with Consistent Orange Icons */}
            <div className="animate-fade-in-up animation-delay-200 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-1">
              {featureList.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className="flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-2xl bg-white/95 border border-slate-200/90 shadow-xs hover:border-[#e16718] hover:shadow-sm hover:-translate-y-0.5 transition-all text-center group cursor-default"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100/70 text-[#e16718] mb-2 group-hover:scale-108 group-hover:bg-[#e16718] group-hover:text-white transition-all">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-bold text-[#24282c] leading-tight">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-slate-500 leading-tight">
                      {item.subtitle}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Main Primary Call To Action (One Button, No Watch Demo) */}
            <div className="animate-fade-in-up animation-delay-300 pt-3">
              <Link
                href="/login"
                className="group inline-flex items-center gap-4 rounded-2xl bg-[#e16718] px-6 py-3.5 text-white shadow-xl shadow-orange-600/30 hover:bg-[#c9550e] hover:shadow-orange-600/40 transition-all duration-200 cursor-pointer active:scale-98"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="h-5 w-5" />
                </div>
                <div className="text-left pr-2">
                  <div className="text-base font-extrabold leading-tight flex items-center gap-1.5">
                    <span>Get Started</span>
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </div>
                  <div className="text-[11px] text-orange-100 font-medium leading-tight">
                    Start using Shivom ERP
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Right Column (Columns 8 to 12) on Mobile/Tablet: 8-Second Animation Sequence */}
          <div className="lg:hidden col-span-1 flex flex-col items-center">
            <div className="relative w-full aspect-16/10 rounded-2xl overflow-hidden border border-slate-200 shadow-lg">
              <FrameSequencePlayer className="w-full h-full" showReplayButton={true} />
              <div className="absolute bottom-3 left-3 bg-[#e16718]/90 backdrop-blur-xs text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider pointer-events-none">
                Building Material Supply
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* CLEAN MINIMAL FOOTER */}
      <footer className="relative z-20 w-full border-t border-slate-200/80 bg-white/90 backdrop-blur-xs py-3.5 px-6 md:px-12 text-center text-xs text-slate-500">
        <p>
          Shivom Construction ERP • Fast, intuitive system for construction and hardware material suppliers.
        </p>
      </footer>
    </div>
  );
}
