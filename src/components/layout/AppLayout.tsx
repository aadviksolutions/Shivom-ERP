"use client";

import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileNav from "./MobileNav";
import { useAuth } from "@/lib/AuthContext";

interface AppLayoutProps {
  children: React.ReactNode;
  user?: {
    name: string;
    email: string;
    role: string;
    username?: string | null;
    permissions?: string | null;
  };
  lowStockCount?: number;
}

export default function AppLayout({
  children,
  user: explicitUser,
  lowStockCount = 0,
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user: authUser, loading } = useAuth();

  const user = explicitUser || authUser;

  if (loading && !explicitUser) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#16181b] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-3 border-[#e16718] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-300">Loading authorized workspace...</p>
        </div>
      </div>
    );
  }

  // Safe fallback representation that never grants Admin privileges by default
  const safeUser = user || {
    name: "ERP User",
    email: "",
    role: "BILLING",
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar
        userRole={safeUser.role}
        currentUser={safeUser}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          currentUser={safeUser}
          lowStockCount={lowStockCount}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 lg:pb-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>

        {/* Mobile Bottom Dock */}
        <MobileNav onOpenSidebar={() => setSidebarOpen(true)} />
      </div>
    </div>
  );
}
