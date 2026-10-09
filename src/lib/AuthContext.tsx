"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Role } from "./auth";
import { ModuleKey, ActionKey, hasPermission as checkPermission } from "./permissions";

export interface AuthUser {
  id: string;
  name: string;
  username?: string | null;
  email: string;
  role: Role;
  phone?: string | null;
  permissions?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasAccess: (module: ModuleKey, action: ActionKey) => boolean;
  canAccessRole: (requiredRoles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  refreshUser: async () => {},
  hasAccess: () => false,
  canAccessRole: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      router.push("/login");
      router.refresh();
    }
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const hasAccess = useCallback(
    (module: ModuleKey, action: ActionKey): boolean => {
      if (!user) return false;
      return checkPermission(user, module, action);
    },
    [user]
  );

  const canAccessRole = useCallback(
    (requiredRoles: Role[]): boolean => {
      if (!user) return false;
      if (user.role === "ADMIN") return true;
      return requiredRoles.includes(user.role);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        logout,
        refreshUser,
        hasAccess,
        canAccessRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
