"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Truck,
  FileSpreadsheet,
  ShoppingCart,
  RotateCcw,
  CreditCard,
  Package,
  Layers,
  Award,
  Ruler,
  Boxes,
  SlidersHorizontal,
  AlertTriangle,
  Warehouse,
  BookOpen,
  DollarSign,
  Receipt,
  Landmark,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  FileText,
  BarChart3,
  Settings,
  ChevronDown,
  Building2,
  Menu,
  X,
  Plus,
} from "lucide-react";

interface SidebarProps {
  userRole?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  roles?: string[];
}

interface NavGroup {
  group: string;
  icon: React.ElementType;
  items: NavItem[];
  roles?: string[];
}

export default function Sidebar({ userRole = "ADMIN", isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const navGroups: NavGroup[] = [
    {
      group: "Business",
      icon: ShoppingCart,
      roles: ["ADMIN", "BILLING"],
      items: [
        { title: "Customers", href: "/customers", icon: Users },
        { title: "Suppliers", href: "/suppliers", icon: Truck },
        { title: "Quotations", href: "/quotations", icon: FileSpreadsheet },
        { title: "Sales Invoices", href: "/sales", icon: ShoppingCart },
        { title: "Sales Returns", href: "/sales/returns", icon: RotateCcw },
        { title: "Payments Received", href: "/payments?type=CUSTOMER", icon: ArrowDownLeft },
      ],
    },
    {
      group: "Purchase",
      icon: Truck,
      roles: ["ADMIN", "STORE"],
      items: [
        { title: "Purchase Orders", href: "/purchase", icon: ShoppingCart },
        { title: "Purchase Invoices", href: "/purchase/invoices", icon: FileText },
        { title: "Purchase Returns", href: "/purchase/returns", icon: RotateCcw },
        { title: "Supplier Payments", href: "/payments?type=SUPPLIER", icon: ArrowUpRight },
      ],
    },
    {
      group: "Inventory",
      icon: Package,
      roles: ["ADMIN", "STORE", "BILLING"],
      items: [
        { title: "Products", href: "/products", icon: Package },
        { title: "Categories", href: "/inventory/categories", icon: Layers },
        { title: "Brands", href: "/inventory/brands", icon: Award },
        { title: "Units", href: "/inventory/units", icon: Ruler },
        { title: "Current Stock", href: "/inventory/stock", icon: Boxes },
        { title: "Stock Adjustment", href: "/inventory/adjustments", icon: SlidersHorizontal },
        { title: "Low Stock Alert", href: "/inventory/low-stock", icon: AlertTriangle, badge: "Alert" },
        { title: "Godown / Yard", href: "/inventory/godowns", icon: Warehouse },
      ],
    },
    {
      group: "Accounts",
      icon: Landmark,
      roles: ["ADMIN"],
      items: [
        { title: "Customer Ledger", href: "/accounts/customer-ledger", icon: BookOpen },
        { title: "Supplier Ledger", href: "/accounts/supplier-ledger", icon: BookOpen },
        { title: "Expenses", href: "/accounts/expenses", icon: Receipt },
        { title: "Cash & Bank", href: "/accounts/cash-bank", icon: Landmark },
        { title: "Receivables", href: "/accounts/receivables", icon: ArrowDownLeft },
        { title: "Payables", href: "/accounts/payables", icon: ArrowUpRight },
      ],
    },
    {
      group: "Reports",
      icon: BarChart3,
      roles: ["ADMIN", "BILLING"],
      items: [
        { title: "Sales Report", href: "/reports/sales", icon: TrendingUp },
        { title: "Purchase Report", href: "/reports/purchases", icon: BarChart3 },
        { title: "Stock Report", href: "/reports/stock", icon: Boxes },
        { title: "Outstanding Report", href: "/reports/outstanding", icon: DollarSign },
        { title: "Gross Profit Report", href: "/reports/profit", icon: TrendingUp },
        { title: "GST Report", href: "/reports/gst", icon: FileText },
      ],
    },
    {
      group: "Settings",
      icon: Settings,
      roles: ["ADMIN"],
      items: [
        { title: "Company Profile", href: "/settings?tab=profile", icon: Building2 },
        { title: "Invoice Settings", href: "/settings?tab=invoice", icon: FileText },
        { title: "GST Settings", href: "/settings?tab=gst", icon: FileSpreadsheet },
        { title: "Users & Roles", href: "/settings?tab=users", icon: Users },
        { title: "Numbering", href: "/settings?tab=numbering", icon: SlidersHorizontal },
        { title: "Backup / Data", href: "/settings?tab=backup", icon: Layers },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-slate-950 text-slate-300 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-600 font-bold text-white shadow-md shadow-orange-600/30">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white">BuildStock</span>
              <span className="block text-[10px] font-medium uppercase tracking-wider text-orange-400">
                ERP • Construction
              </span>
            </div>
          </Link>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Quick Action Button */}
        <div className="p-3 border-b border-slate-800/80">
          <Link
            href="/sales/new"
            className="flex items-center justify-center gap-2 w-full rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>New Sale (POS)</span>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {/* Main Dashboard Link */}
          <div>
            <Link
              href="/dashboard"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname === "/dashboard"
                  ? "bg-orange-600/20 text-orange-400 font-semibold"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </div>

          {/* Grouped Links */}
          {navGroups.map((group) => {
            // Check role permission
            if (userRole !== "ADMIN" && group.roles && !group.roles.includes(userRole)) {
              return null;
            }

            const isCollapsed = collapsedGroups[group.group] || false;
            const hasActiveChild = group.items.some((item) =>
              pathname.startsWith(item.href.split("?")[0])
            );

            return (
              <div key={group.group} className="space-y-1">
                <button
                  onClick={() => toggleGroup(group.group)}
                  className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200"
                >
                  <span className="flex items-center gap-2">
                    <group.icon className="h-3.5 w-3.5 text-slate-400" />
                    {group.group}
                  </span>
                  <ChevronDown
                    className={`h-3 w-3 text-slate-400 transition-transform ${
                      isCollapsed ? "-rotate-90" : ""
                    }`}
                  />
                </button>

                {!isCollapsed && (
                  <div className="space-y-0.5 pl-2 border-l border-slate-800/60 ml-2">
                    {group.items.map((item) => {
                      const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href.split("?")[0]) && item.href.length > 2);
                      return (
                        <Link
                          key={item.title}
                          href={item.href}
                          className={`flex items-center justify-between rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                            isActive
                              ? "bg-orange-600/20 text-orange-400 font-semibold"
                              : "text-slate-300 hover:bg-slate-900 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <item.icon className={`h-4 w-4 ${isActive ? "text-orange-400" : "text-slate-400"}`} />
                            <span>{item.title}</span>
                          </div>
                          {item.badge && (
                            <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-rose-400">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* User Role Footer */}
        <div className="border-t border-slate-800 p-3 bg-slate-950/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="text-xs">
                <p className="font-medium text-slate-200">Shivom Hardware</p>
                <p className="text-[10px] text-slate-400 uppercase">Role: {userRole}</p>
              </div>
            </div>
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300 font-mono">
              v1.0
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
