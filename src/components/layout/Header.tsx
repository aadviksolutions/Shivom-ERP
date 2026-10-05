"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  Bell,
  Search,
  Plus,
  ShoppingCart,
  Truck,
  UserPlus,
  PackagePlus,
  LogOut,
  ShieldCheck,
  ChevronDown,
  Building,
} from "lucide-react";

interface HeaderProps {
  onToggleSidebar?: () => void;
  currentUser?: {
    name: string;
    email: string;
    role: string;
  };
  lowStockCount?: number;
}

export default function Header({
  onToggleSidebar,
  currentUser = { name: "Owner Admin", email: "admin@buildstock.com", role: "ADMIN" },
  lowStockCount = 0,
}: HeaderProps) {
  const router = useRouter();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  const handleRoleSwitch = async (role: string) => {
    setShowRoleMenu(false);
    try {
      await fetch("/api/auth/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      router.refresh();
      window.location.reload();
    } catch {
      // ignore
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 shadow-xs">
      {/* Left: Mobile hamburger & search */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Brand indicator for mobile */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="h-8 w-8 rounded-md bg-orange-600 flex items-center justify-center text-white font-bold text-sm">
            BS
          </div>
          <span className="font-bold text-slate-800 text-sm">BuildStock</span>
        </div>

        {/* Global Quick Search */}
        <div className="hidden sm:flex items-center relative w-64 md:w-80">
          <Search className="absolute left-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice, customer, product..."
            className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:outline-hidden"
          />
        </div>
      </div>

      {/* Right: Actions, Alerts, Role Badge & User Profile */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Quick Actions Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowQuickMenu(!showQuickMenu)}
            className="flex items-center gap-1.5 rounded-md bg-orange-50 border border-orange-200 px-2.5 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100 transition-colors"
          >
            <Plus className="h-4 w-4 text-orange-600" />
            <span className="hidden sm:inline">Quick Action</span>
            <ChevronDown className="h-3 w-3" />
          </button>

          {showQuickMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black/5 z-50">
              <Link
                href="/sales/new"
                onClick={() => setShowQuickMenu(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <ShoppingCart className="h-4 w-4 text-orange-600" />
                <span>New Sale Invoice</span>
              </Link>
              <Link
                href="/purchase"
                onClick={() => setShowQuickMenu(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Truck className="h-4 w-4 text-blue-600" />
                <span>New Purchase Entry</span>
              </Link>
              <Link
                href="/customers"
                onClick={() => setShowQuickMenu(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <UserPlus className="h-4 w-4 text-emerald-600" />
                <span>Add Customer</span>
              </Link>
              <Link
                href="/products"
                onClick={() => setShowQuickMenu(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <PackagePlus className="h-4 w-4 text-purple-600" />
                <span>Add Product</span>
              </Link>
            </div>
          )}
        </div>

        {/* Low Stock Alert Button */}
        <Link
          href="/inventory/low-stock"
          className="relative rounded-md p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          title="Stock Alerts"
        >
          <Bell className="h-4 w-4" />
          {lowStockCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
          )}
        </Link>

        {/* Role Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
            title="Switch User Role for demo"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-orange-600" />
            <span className="font-semibold text-slate-900">{currentUser.role}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg z-50">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-[11px] font-medium text-slate-400 uppercase">Switch Active Role</p>
              </div>
              <button
                onClick={() => handleRoleSwitch("ADMIN")}
                className={`flex w-full items-center justify-between px-3 py-2 text-xs text-left ${
                  currentUser.role === "ADMIN" ? "bg-orange-50 text-orange-700 font-semibold" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div>
                  <div className="font-medium">Owner / Admin</div>
                  <div className="text-[10px] text-slate-400">Full system access & settings</div>
                </div>
              </button>
              <button
                onClick={() => handleRoleSwitch("BILLING")}
                className={`flex w-full items-center justify-between px-3 py-2 text-xs text-left ${
                  currentUser.role === "BILLING" ? "bg-orange-50 text-orange-700 font-semibold" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div>
                  <div className="font-medium">Sales / Billing</div>
                  <div className="text-[10px] text-slate-400">Sales, invoices, customers, collections</div>
                </div>
              </button>
              <button
                onClick={() => handleRoleSwitch("STORE")}
                className={`flex w-full items-center justify-between px-3 py-2 text-xs text-left ${
                  currentUser.role === "STORE" ? "bg-orange-50 text-orange-700 font-semibold" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div>
                  <div className="font-medium">Store / Purchase</div>
                  <div className="text-[10px] text-slate-400">Inventory, godown, stock adjustments</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* User Profile & Logout */}
        <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-semibold text-slate-800 leading-tight">{currentUser.name}</p>
            <p className="text-[10px] text-slate-500 leading-tight">{currentUser.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-md p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            title="Log Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
