"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Users,
  Menu,
  Plus,
} from "lucide-react";

interface MobileNavProps {
  onOpenSidebar: () => void;
}

export default function MobileNav({ onOpenSidebar }: MobileNavProps) {
  const pathname = usePathname();

  const links = [
    { title: "Home", href: "/dashboard", icon: LayoutDashboard },
    { title: "Products", href: "/products", icon: Package },
    { title: "New Sale", href: "/sales/new", icon: Plus, isPrimary: true },
    { title: "Customers", href: "/customers", icon: Users },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-2 py-1.5 backdrop-blur-md lg:hidden shadow-lg no-print">
      <div className="flex items-center justify-around">
        {links.map((link) => {
          const isActive = pathname === link.href;

          if (link.isPrimary) {
            return (
              <Link
                key={link.title}
                href={link.href}
                className="flex -mt-5 flex-col items-center justify-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e16718] text-white shadow-lg shadow-orange-600/30 hover:bg-[#c9550e] transition-transform active:scale-95">
                  <Plus className="h-6 w-6 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-bold text-[#e16718] mt-0.5">
                  Billing
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={link.title}
              href={link.href}
              className={`flex flex-col items-center justify-center py-1 px-2 text-[10px] font-medium transition-colors ${
                isActive ? "text-[#e16718] font-bold" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <link.icon className={`h-5 w-5 ${isActive ? "text-[#e16718]" : "text-slate-500"}`} />
              <span className="mt-0.5">{link.title}</span>
            </Link>
          );
        })}

        {/* Menu button to open drawer */}
        <button
          onClick={onOpenSidebar}
          className="flex flex-col items-center justify-center py-1 px-2 text-[10px] font-medium text-slate-500 hover:text-slate-900"
        >
          <Menu className="h-5 w-5" />
          <span className="mt-0.5">More</span>
        </button>
      </div>
    </div>
  );
}
