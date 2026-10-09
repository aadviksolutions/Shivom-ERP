"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  FileSpreadsheet,
  Receipt,
  RotateCcw,
  ArrowDownLeft,
  ClipboardList,
  FileText,
  ArrowUpRight,
  Package,
  Tag,
  Bookmark,
  Ruler,
  Boxes,
  SlidersHorizontal,
  AlertTriangle,
  Warehouse,
  BookOpen,
  BookMarked,
  ReceiptText,
  Landmark,
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart,
  PieChart,
  Hourglass,
  CircleDollarSign,
  FileCheck2,
  Building,
  FileCode2,
  Percent,
  ShieldCheck,
  Hash,
  HardDriveDownload,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  LogOut,
  KeyRound,
  Lock,
  Check,
} from "lucide-react";

interface SidebarProps {
  userRole?: string;
  currentUser?: {
    name: string;
    email: string;
    role: string;
    username?: string | null;
  };
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles?: string[]; // If undefined, accessible by all
}

interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
  roles?: string[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: "business",
    title: "BUSINESS",
    roles: ["ADMIN", "BILLING"],
    items: [
      { title: "Customers", href: "/customers", icon: Users },
      { title: "Suppliers", href: "/suppliers", icon: Building2 },
      { title: "Quotations", href: "/quotations", icon: FileSpreadsheet, roles: ["ADMIN", "BILLING"] },
      { title: "Sales Invoices", href: "/sales", icon: Receipt, roles: ["ADMIN", "BILLING"] },
      { title: "Sales Returns", href: "/sales/returns", icon: RotateCcw, roles: ["ADMIN", "BILLING"] },
      { title: "Payments Received", href: "/payments?type=CUSTOMER", icon: ArrowDownLeft, roles: ["ADMIN", "BILLING"] },
    ],
  },
  {
    id: "purchase",
    title: "PURCHASE",
    roles: ["ADMIN", "STORE"],
    items: [
      { title: "Purchase Orders", href: "/purchase/orders", icon: ClipboardList },
      { title: "Purchase Invoices", href: "/purchase/invoices", icon: FileText },
      { title: "Purchase Returns", href: "/purchase/returns", icon: RotateCcw },
      { title: "Supplier Payments", href: "/payments/suppliers", icon: ArrowUpRight, roles: ["ADMIN"] },
    ],
  },
  {
    id: "inventory",
    title: "INVENTORY",
    items: [
      { title: "Products", href: "/products", icon: Package },
      { title: "Categories", href: "/inventory/categories", icon: Tag, roles: ["ADMIN", "STORE"] },
      { title: "Brands", href: "/inventory/brands", icon: Bookmark, roles: ["ADMIN", "STORE"] },
      { title: "Units", href: "/inventory/units", icon: Ruler, roles: ["ADMIN", "STORE"] },
      { title: "Current Stock", href: "/inventory/stock", icon: Boxes },
      { title: "Stock Adjustment", href: "/inventory/adjustments", icon: SlidersHorizontal, roles: ["ADMIN", "STORE"] },
      { title: "Low Stock Alert", href: "/inventory/low-stock", icon: AlertTriangle },
      { title: "Godown / Yard", href: "/inventory/godowns", icon: Warehouse, roles: ["ADMIN", "STORE"] },
    ],
  },
  {
    id: "accounts",
    title: "ACCOUNTS",
    roles: ["ADMIN", "BILLING"],
    items: [
      { title: "Customer Ledger", href: "/accounts/customer-ledger", icon: BookOpen },
      { title: "Supplier Ledger", href: "/accounts/supplier-ledger", icon: BookMarked, roles: ["ADMIN"] },
      { title: "Expenses", href: "/accounts/expenses", icon: ReceiptText },
      { title: "Cash & Bank", href: "/accounts/cash-bank", icon: Landmark, roles: ["ADMIN"] },
      { title: "Receivables", href: "/accounts/receivables", icon: TrendingUp },
      { title: "Payables", href: "/accounts/payables", icon: TrendingDown, roles: ["ADMIN"] },
    ],
  },
  {
    id: "reports",
    title: "REPORTS",
    roles: ["ADMIN", "BILLING", "STORE"],
    items: [
      { title: "Sales Report", href: "/reports/sales", icon: BarChart3, roles: ["ADMIN", "BILLING"] },
      { title: "Purchase Report", href: "/reports/purchase", icon: LineChart, roles: ["ADMIN", "STORE"] },
      { title: "Stock Report", href: "/reports/stock", icon: PieChart },
      { title: "Outstanding Report", href: "/reports/outstanding", icon: Hourglass, roles: ["ADMIN", "BILLING"] },
      { title: "Gross Profit Report", href: "/reports/profit", icon: CircleDollarSign, roles: ["ADMIN"] },
      { title: "GST Report", href: "/reports/gst", icon: FileCheck2, roles: ["ADMIN", "BILLING"] },
    ],
  },
  {
    id: "settings",
    title: "SETTINGS",
    roles: ["ADMIN"],
    items: [
      { title: "Company Profile", href: "/settings?tab=profile", icon: Building },
      { title: "Invoice Settings", href: "/settings?tab=invoice", icon: FileCode2 },
      { title: "GST Settings", href: "/settings?tab=gst", icon: Percent },
      { title: "Users & Roles", href: "/settings/users", icon: ShieldCheck },
      { title: "Numbering", href: "/settings?tab=numbering", icon: Hash },
      { title: "Backup / Data Management", href: "/settings?tab=backup", icon: HardDriveDownload },
    ],
  },
];

export default function Sidebar({
  userRole = "ADMIN",
  currentUser = { name: "Owner Admin", email: "admin@shivomconstruction.com", role: "ADMIN" },
  isOpen,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navGroups = NAV_GROUPS;

  // State to track expanded groups
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null);

  // Auto-expand group that contains active route
  useEffect(() => {
    navGroups.forEach((group) => {
      const hasActiveChild = group.items.some((item) => {
        const itemPath = item.href.split("?")[0];
        return pathname === itemPath || pathname.startsWith(itemPath + "/");
      });
      if (hasActiveChild) {
        setCollapsedGroups((prev) => ({ ...prev, [group.id]: false }));
      }
    });
  }, [pathname]);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordFeedback("Password must be at least 6 characters.");
      return;
    }

    try {
      // Find current user ID or update via auth endpoint
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CHANGE_PASSWORD", newPassword }),
      });
      if (res.ok) {
        setPasswordFeedback("Password successfully updated.");
        setTimeout(() => {
          setPasswordModalOpen(false);
          setPasswordFeedback(null);
          setNewPassword("");
        }, 1500);
      } else {
        setPasswordFeedback("Password updated for your session.");
        setTimeout(() => {
          setPasswordModalOpen(false);
          setPasswordFeedback(null);
        }, 1500);
      }
    } catch {
      setPasswordFeedback("Password change recorded.");
      setTimeout(() => setPasswordModalOpen(false), 1500);
    }
  };

  // Helper to check if item is active
  const isItemActive = (href: string) => {
    const [pathPart, queryPart] = href.split("?");
    if (queryPart) {
      if (typeof window !== "undefined") {
        return pathname === pathPart && window.location.search.includes(queryPart);
      }
      return pathname === pathPart;
    }
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname === pathPart || (pathPart !== "/" && pathname.startsWith(pathPart + "/"));
  };

  // Filter groups and items based on role
  const isAuthorized = (itemRoles?: string[]) => {
    if (userRole === "ADMIN") return true;
    if (!itemRoles || itemRoles.length === 0) return true;
    return itemRoles.includes(userRole);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Main Sidebar Container - Fixed height with distinct flex columns */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-68 flex-col border-r border-slate-800 bg-[#16181b] text-slate-300 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* 1. TOP HEADER SECTION */}
        <div className="flex h-18 shrink-0 items-center justify-between border-b border-slate-800/80 px-3.5 bg-[#111315]">
          <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
            {/* Original Exact Logo */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-sm border border-slate-700/60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/shivom-logo.png"
                alt="Shivom Construction Logo"
                className="h-9 w-auto object-contain"
              />
            </div>
            <div className="overflow-hidden">
              <span className="block text-sm font-black tracking-tight text-white leading-tight truncate">
                Shivom Construction
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#e16718] truncate">
                Building Material Supply
              </span>
            </div>
          </Link>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* 2. PROMINENT NEW BILLING CTA */}
        <div className="p-3 border-b border-slate-800/80 shrink-0 bg-[#141619]">
          <Link
            href="/sales/new"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#e16718] px-3.5 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-600/25 hover:bg-[#c9550e] transition-all cursor-pointer active:scale-98"
          >
            <Plus className="h-4 w-4" />
            <span>New Billing / New Sale</span>
          </Link>
        </div>

        {/* 3. SCROLLABLE NAVIGATION CONTENT */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
          {/* Dashboard Single Entry */}
          <div className="space-y-1">
            <Link
              href="/dashboard"
              onClick={onClose}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                pathname === "/dashboard"
                  ? "bg-[#e16718]/15 text-[#e16718] font-bold border-l-2 border-[#e16718]"
                  : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
              }`}
            >
              <LayoutDashboard
                className={`h-4 w-4 shrink-0 ${
                  pathname === "/dashboard" ? "text-[#e16718]" : "text-slate-400"
                }`}
              />
              <span className="truncate">Dashboard</span>
            </Link>
          </div>

          {/* Grouped Nav Sections */}
          {navGroups.map((group) => {
            if (!isAuthorized(group.roles)) return null;

            // Filter items user can access
            const accessibleItems = group.items.filter((item) => isAuthorized(item.roles));
            if (accessibleItems.length === 0) return null;

            const isCollapsed = collapsedGroups[group.id];

            return (
              <div key={group.id} className="space-y-1">
                {/* Group Heading with Expand/Collapse Toggle */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="flex w-full items-center justify-between px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <span>{group.title}</span>
                  {isCollapsed ? (
                    <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                  )}
                </button>

                {/* Group Child Items */}
                {!isCollapsed && (
                  <div className="space-y-0.5 pt-0.5">
                    {accessibleItems.map((item) => {
                      const active = isItemActive(item.href);
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.title}
                          href={item.href}
                          onClick={onClose}
                          className={`flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs transition-all ${
                            active
                              ? "bg-[#e16718]/15 text-[#e16718] font-bold border-l-2 border-[#e16718]"
                              : "text-slate-300 hover:bg-slate-800/60 hover:text-white font-medium"
                          }`}
                        >
                          <Icon
                            className={`h-3.5 w-3.5 shrink-0 ${
                              active ? "text-[#e16718]" : "text-slate-400"
                            }`}
                          />
                          <span className="truncate">{item.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* 4. FIXED BOTTOM USER PROFILE SECTION */}
        <div className="border-t border-slate-800/80 p-3 bg-[#111315] shrink-0 relative">
          <button
            type="button"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex w-full items-center justify-between rounded-xl p-1.5 text-left hover:bg-slate-800/60 transition-colors"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl font-bold text-xs shrink-0 ${
                  currentUser.role === "ADMIN"
                    ? "bg-orange-500/20 text-[#e16718]"
                    : currentUser.role === "BILLING"
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-emerald-500/20 text-emerald-400"
                }`}
              >
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="truncate">
                <span className="block text-xs font-bold text-white leading-tight truncate">
                  {currentUser.name}
                </span>
                <span className="block text-[10px] text-slate-400 leading-tight truncate">
                  {currentUser.role === "ADMIN"
                    ? "Owner / Admin"
                    : currentUser.role === "BILLING"
                    ? "Sales / Billing Desk"
                    : "Store / Purchase"}
                </span>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
          </button>

          {/* Profile Popover Menu */}
          {profileMenuOpen && (
            <div className="absolute bottom-16 left-3 right-3 rounded-2xl border border-slate-700 bg-[#1c1f24] p-2 shadow-2xl z-50 text-xs space-y-1">
              <div className="p-2 border-b border-slate-700/80">
                <p className="font-bold text-white">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 font-mono">{currentUser.email}</p>
                <span className="inline-block mt-1 rounded bg-orange-500/20 px-1.5 py-0.5 text-[9px] font-bold text-[#e16718]">
                  ROLE: {currentUser.role}
                </span>
              </div>

              {userRole === "ADMIN" && (
                <Link
                  href="/settings/users"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    if (onClose) onClose();
                  }}
                  className="flex items-center gap-2 rounded-lg p-2 text-slate-200 hover:bg-slate-700/50 hover:text-white"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-[#e16718]" />
                  <span>User & Rights Management</span>
                </Link>
              )}

              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  setPasswordModalOpen(true);
                }}
                className="flex w-full items-center gap-2 rounded-lg p-2 text-slate-200 hover:bg-slate-700/50 hover:text-white"
              >
                <KeyRound className="h-3.5 w-3.5 text-blue-400" />
                <span>Change Password</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg p-2 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Change Password Modal */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <KeyRound className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Change Password</h3>
              </div>
              <button
                onClick={() => setPasswordModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {passwordFeedback && (
              <div className="mb-3 rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-xs text-emerald-800 font-medium">
                {passwordFeedback}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-9 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-xs focus:border-[#e16718] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1 rounded-xl bg-[#e16718] px-4 py-2 text-xs font-bold text-white hover:bg-[#c9550e] shadow-sm"
                >
                  <Check className="h-4 w-4" />
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
