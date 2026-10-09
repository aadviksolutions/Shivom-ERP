"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Search,
  Edit,
  KeyRound,
  CheckCircle2,
  XCircle,
  History,
  Lock,
  Mail,
  Phone,
  UserCheck,
  RefreshCw,
  X,
  AlertTriangle,
  RotateCcw,
  Save,
  Check,
} from "lucide-react";
import {
  PERMISSION_MODULES,
  PERMISSION_ACTIONS,
  DEFAULT_ROLE_PERMISSIONS,
  ModuleKey,
  ActionKey,
  PermissionMatrix,
} from "@/lib/permissions";
import { Role } from "@/lib/auth";

interface UserItem {
  id: string;
  name: string;
  username: string | null;
  email: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
  permissions: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

interface AuditLogItem {
  id: string;
  userName: string | null;
  action: string;
  module: string;
  recordTitle: string | null;
  details: string | null;
  createdAt: string;
}

export default function UsersPermissionsPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modals state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [permissionUser, setPermissionUser] = useState<UserItem | null>(null);
  const [permissionMatrix, setPermissionMatrix] = useState<PermissionMatrix>(DEFAULT_ROLE_PERMISSIONS.BILLING);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState<UserItem | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditModuleFilter, setAuditModuleFilter] = useState("ALL");

  // User form state
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    role: "BILLING" as Role,
    isActive: true,
    password: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [savingUser, setSavingUser] = useState(false);

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setUsers(json.data);
      } else if (json.error) {
        setFeedback({ type: "error", message: json.error });
      }
    } catch {
      setFeedback({ type: "error", message: "Failed to connect to users service." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      username: "",
      email: "",
      phone: "",
      role: "BILLING",
      isActive: true,
      password: "",
    });
    setFormErrors({});
    setIsUserModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (user: UserItem) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      username: user.username || "",
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      isActive: user.isActive,
      password: "", // Blank unless updating password
    });
    setFormErrors({});
    setIsUserModalOpen(true);
  };

  // Open Permissions Matrix Modal
  const handleOpenPermissions = (user: UserItem) => {
    setPermissionUser(user);
    let matrix: PermissionMatrix;
    if (user.permissions) {
      try {
        matrix = JSON.parse(user.permissions);
      } catch {
        matrix = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS[user.role]));
      }
    } else {
      matrix = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS[user.role]));
    }
    setPermissionMatrix(matrix);
    setIsPermissionModalOpen(true);
  };

  // Open Password Reset Modal
  const handleOpenResetPassword = (user: UserItem) => {
    setPasswordUser(user);
    setNewPassword("");
    setIsPasswordModalOpen(true);
  };

  // Fetch Audit Logs
  const handleOpenAuditLogs = async () => {
    setIsAuditModalOpen(true);
    setAuditLoading(true);
    try {
      const url = auditModuleFilter === "ALL" ? "/api/audit-logs?limit=50" : `/api/audit-logs?module=${auditModuleFilter}&limit=50`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setAuditLogs(json.data);
      }
    } catch {
      showFeedback("error", "Failed to load audit logs");
    } finally {
      setAuditLoading(false);
    }
  };

  // Toggle user active status
  const handleToggleStatus = async (user: UserItem) => {
    const newStatus = !user.isActive;
    const confirmText = newStatus
      ? `Activate user ${user.name}?`
      : `Deactivate user ${user.name}? They will not be able to log in.`;

    if (!window.confirm(confirmText)) return;

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });

      const json = await res.json();
      if (res.ok) {
        showFeedback("success", `User ${user.name} is now ${newStatus ? "Active" : "Inactive"}.`);
        fetchUsers();
      } else {
        showFeedback("error", json.error || "Failed to update account status.");
      }
    } catch {
      showFeedback("error", "Error updating account status.");
    }
  };

  // Save User (Create or Update)
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = "Full name is required";
    if (!formData.username.trim()) errors.username = "Username is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    if (!editingUser && (!formData.password || formData.password.length < 6)) {
      errors.password = "Password must be at least 6 characters";
    }
    if (formData.phone && !/^[6-9]\d{9}$/.test(formData.phone.replace(/\D/g, ""))) {
      errors.phone = "Enter a valid 10-digit Indian mobile number";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSavingUser(true);
    try {
      if (editingUser) {
        // Update user
        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            username: formData.username,
            email: formData.email,
            phone: formData.phone,
            role: formData.role,
            isActive: formData.isActive,
            password: formData.password || undefined,
          }),
        });

        const json = await res.json();
        if (res.ok) {
          showFeedback("success", `User ${formData.name} updated successfully.`);
          setIsUserModalOpen(false);
          fetchUsers();
        } else {
          showFeedback("error", json.error || "Failed to update user.");
        }
      } else {
        // Create user
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const json = await res.json();
        if (res.ok) {
          showFeedback("success", `User ${formData.name} created successfully.`);
          setIsUserModalOpen(false);
          fetchUsers();
        } else {
          showFeedback("error", json.error || "Failed to create user.");
        }
      }
    } catch {
      showFeedback("error", "Error saving user account.");
    } finally {
      setSavingUser(false);
    }
  };

  // Save Permissions Matrix
  const handleSavePermissions = async () => {
    if (!permissionUser) return;
    try {
      const res = await fetch(`/api/users/${permissionUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: permissionMatrix }),
      });

      const json = await res.json();
      if (res.ok) {
        showFeedback("success", `Permissions updated for ${permissionUser.name}.`);
        setIsPermissionModalOpen(false);
        fetchUsers();
      } else {
        showFeedback("error", json.error || "Failed to save permissions.");
      }
    } catch {
      showFeedback("error", "Error saving permission matrix.");
    }
  };

  // Submit Password Reset
  const handleSavePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordUser || !newPassword || newPassword.length < 6) {
      showFeedback("error", "Password must be at least 6 characters.");
      return;
    }

    try {
      const res = await fetch(`/api/users/${passwordUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });

      const json = await res.json();
      if (res.ok) {
        showFeedback("success", `Password reset successfully for ${passwordUser.name}.`);
        setIsPasswordModalOpen(false);
        setNewPassword("");
      } else {
        showFeedback("error", json.error || "Failed to reset password.");
      }
    } catch {
      showFeedback("error", "Error resetting password.");
    }
  };

  // Matrix manipulation helpers
  const handleTogglePermission = (module: ModuleKey, action: ActionKey) => {
    setPermissionMatrix((prev) => {
      const currentActions = prev[module] || [];
      const hasAction = currentActions.includes(action);
      const updatedActions = hasAction
        ? currentActions.filter((a) => a !== action)
        : [...currentActions, action];

      return {
        ...prev,
        [module]: updatedActions,
      };
    });
  };

  const handleToggleAllForModule = (module: ModuleKey) => {
    setPermissionMatrix((prev) => {
      const currentActions = prev[module] || [];
      const allActionIds = PERMISSION_ACTIONS.map((a) => a.id);
      const isAllSelected = allActionIds.every((a) => currentActions.includes(a));

      return {
        ...prev,
        [module]: isAllSelected ? [] : allActionIds,
      };
    });
  };

  const handleResetToRoleDefaults = () => {
    if (!permissionUser) return;
    const defaults = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS[permissionUser.role]));
    setPermissionMatrix(defaults);
  };

  const handleGrantAll = () => {
    const allActionIds = PERMISSION_ACTIONS.map((a) => a.id);
    const grantAll: any = {};
    for (const mod of PERMISSION_MODULES) {
      grantAll[mod.id] = [...allActionIds];
    }
    setPermissionMatrix(grantAll);
  };

  const handleRevokeAll = () => {
    const revokeAll: any = {};
    for (const mod of PERMISSION_MODULES) {
      revokeAll[mod.id] = [];
    }
    setPermissionMatrix(revokeAll);
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery));

    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && u.isActive) ||
      (statusFilter === "INACTIVE" && !u.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-[#24282c] flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-[#e16718]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span>Owner & Admin User Management</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Create staff accounts, allocate granular module rights, manage roles and review audit logs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAuditLogs}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
            >
              <History className="h-4 w-4 text-slate-500" />
              <span>Activity & Audit Log</span>
            </button>

            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 rounded-xl bg-[#e16718] px-4 py-2 text-xs font-bold text-white shadow-md shadow-orange-600/20 hover:bg-[#c9550e] transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              <span>+ Add User</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`rounded-xl border p-3.5 text-xs font-semibold flex items-center justify-between ${
              feedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
          <div className="sm:col-span-6 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, username, email or mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-xs placeholder:text-slate-400 focus:border-[#e16718] focus:outline-hidden"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-700 focus:border-[#e16718] focus:outline-hidden bg-white"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Owner / Admin</option>
              <option value="BILLING">Sales / Billing</option>
              <option value="STORE">Store / Purchase</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-700 focus:border-[#e16718] focus:outline-hidden bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Users</option>
              <option value="INACTIVE">Inactive / Deactivated</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="py-3 px-4">User Details</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Login</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-[#e16718]" />
                      <span>Loading user accounts...</span>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      <Users className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-700">No users match the criteria</p>
                      <p className="text-[11px] text-slate-400">Try modifying your search or filters.</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isOwnerAdmin = u.role === "ADMIN";
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold text-xs ${
                                u.role === "ADMIN"
                                  ? "bg-orange-100 text-[#e16718]"
                                  : u.role === "BILLING"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {u.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {isOwnerAdmin && (
                                  <span className="rounded bg-orange-100 px-1.5 py-0.2 text-[9px] font-bold text-[#e16718] uppercase">
                                    Owner
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                @{u.username || u.email.split("@")[0]}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                              <Mail className="h-3 w-3 text-slate-400" />
                              <span>{u.email}</span>
                            </div>
                            {u.phone && (
                              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                                <Phone className="h-3 w-3 text-slate-400" />
                                <span>{u.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              u.role === "ADMIN"
                                ? "bg-orange-100 text-[#e16718]"
                                : u.role === "BILLING"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            <Shield className="h-3 w-3" />
                            <span>
                              {u.role === "ADMIN" ? "Owner / Admin" : u.role === "BILLING" ? "Sales / Billing" : "Store / Purchase"}
                            </span>
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              u.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {u.isActive ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            <span>{u.isActive ? "Active" : "Inactive"}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-600">
                          {u.lastLoginAt ? (
                            <div>
                              <div className="font-medium">
                                {new Date(u.lastLoginAt).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {new Date(u.lastLoginAt).toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Never</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenPermissions(u)}
                              title="Configure Granular Permissions"
                              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:border-orange-300 hover:bg-orange-50 hover:text-[#e16718] transition-colors"
                            >
                              <ShieldAlert className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => handleOpenResetPassword(u)}
                              title="Reset Password"
                              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => handleOpenEdit(u)}
                              title="Edit User Profile"
                              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:border-slate-300 hover:bg-slate-100 transition-colors"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => handleToggleStatus(u)}
                              title={u.isActive ? "Deactivate User" : "Activate User"}
                              className={`rounded-lg border p-1.5 transition-colors ${
                                u.isActive
                                  ? "border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
                                  : "border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50"
                              }`}
                            >
                              {u.isActive ? <XCircle className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL 1: Create / Edit User */}
        {isUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-[#e16718]">
                    <UserPlus className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {editingUser ? `Edit User: ${editingUser.name}` : "Create New User Account"}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Assign role, contact details, and authentication credentials.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsUserModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="p-6 space-y-4" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Ramesh Patel"
                      className={`h-9 w-full rounded-xl border px-3 text-xs focus:outline-hidden ${
                        formErrors.name ? "border-rose-400" : "border-slate-200 focus:border-[#e16718]"
                      }`}
                    />
                    {formErrors.name && <p className="mt-1 text-[10px] text-rose-500">{formErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Username <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="e.g. ramesh.billing"
                      className={`h-9 w-full rounded-xl border px-3 text-xs font-mono focus:outline-hidden ${
                        formErrors.username ? "border-rose-400" : "border-slate-200 focus:border-[#e16718]"
                      }`}
                    />
                    {formErrors.username && <p className="mt-1 text-[10px] text-rose-500">{formErrors.username}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="ramesh@shivomconstruction.com"
                      className={`h-9 w-full rounded-xl border px-3 text-xs focus:outline-hidden ${
                        formErrors.email ? "border-rose-400" : "border-slate-200 focus:border-[#e16718]"
                      }`}
                    />
                    {formErrors.email && <p className="mt-1 text-[10px] text-rose-500">{formErrors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="9820012345"
                      className={`h-9 w-full rounded-xl border px-3 text-xs focus:outline-hidden ${
                        formErrors.phone ? "border-rose-400" : "border-slate-200 focus:border-[#e16718]"
                      }`}
                    />
                    {formErrors.phone && <p className="mt-1 text-[10px] text-rose-500">{formErrors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Role Assignment <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                      className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-700 focus:border-[#e16718] focus:outline-hidden bg-white"
                    >
                      <option value="ADMIN">Owner / Admin (Unrestricted)</option>
                      <option value="BILLING">Sales / Billing Desk</option>
                      <option value="STORE">Store / Inventory / Purchase</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Account Status
                    </label>
                    <select
                      value={formData.isActive ? "ACTIVE" : "INACTIVE"}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.value === "ACTIVE" })}
                      className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-700 focus:border-[#e16718] focus:outline-hidden bg-white"
                    >
                      <option value="ACTIVE">Active (Can Login)</option>
                      <option value="INACTIVE">Inactive (Disabled)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {editingUser ? "Reset Password (Leave blank to keep unchanged)" : "Initial Password"} {!editingUser && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? "Enter new password if changing" : "Minimum 6 characters"}
                    className={`h-9 w-full rounded-xl border px-3 text-xs focus:outline-hidden ${
                      formErrors.password ? "border-rose-400" : "border-slate-200 focus:border-[#e16718]"
                    }`}
                  />
                  {formErrors.password && <p className="mt-1 text-[10px] text-rose-500">{formErrors.password}</p>}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsUserModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingUser}
                    className="flex items-center gap-1.5 rounded-xl bg-[#e16718] px-4 py-2 text-xs font-bold text-white shadow-md shadow-orange-600/20 hover:bg-[#c9550e] disabled:opacity-50"
                  >
                    {savingUser && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                    <span>{editingUser ? "Save Amendments" : "Create User"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: Granular Permissions Matrix */}
        {isPermissionModalOpen && permissionUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-[#e16718]">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>Allocate Permissions: {permissionUser.name}</span>
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-mono text-slate-700">
                        Role: {permissionUser.role}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Configure granular action rights across all 14 ERP modules.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPermissionModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Matrix Control Helpers */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-2.5 border-b border-slate-100 bg-slate-50/30 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGrantAll}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Grant All Rights
                  </button>
                  <button
                    type="button"
                    onClick={handleRevokeAll}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Revoke All
                  </button>
                  <button
                    type="button"
                    onClick={handleResetToRoleDefaults}
                    className="flex items-center gap-1 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-[#e16718] hover:bg-orange-100/70"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset to Role Defaults</span>
                  </button>
                </div>
                <div className="text-[11px] text-slate-400">
                  {permissionUser.role === "ADMIN" && (
                    <span className="text-orange-600 font-semibold">
                      * Note: Owner/Admin role inherently bypasses restrictions.
                    </span>
                  )}
                </div>
              </div>

              {/* Matrix Table */}
              <div className="flex-1 overflow-y-auto p-6">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-700">
                      <th className="py-2.5 px-3">Module</th>
                      {PERMISSION_ACTIONS.map((action) => (
                        <th key={action.id} className="py-2.5 px-2 text-center">
                          {action.label}
                        </th>
                      ))}
                      <th className="py-2.5 px-2 text-center">Select All</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {PERMISSION_MODULES.map((mod) => {
                      const userActions = permissionMatrix[mod.id] || [];
                      const allActionIds = PERMISSION_ACTIONS.map((a) => a.id);
                      const isAllChecked = allActionIds.every((a) => userActions.includes(a));

                      return (
                        <tr key={mod.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{mod.label}</div>
                            <div className="text-[10px] text-slate-400">{mod.description}</div>
                          </td>

                          {PERMISSION_ACTIONS.map((action) => {
                            const isChecked = userActions.includes(action.id);
                            return (
                              <td key={action.id} className="py-2.5 px-2 text-center">
                                <label className="inline-flex items-center justify-center cursor-pointer p-1">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleTogglePermission(mod.id, action.id)}
                                    className="h-4 w-4 rounded-md border-slate-300 text-[#e16718] focus:ring-[#e16718] cursor-pointer"
                                  />
                                </label>
                              </td>
                            );
                          })}

                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleAllForModule(mod.id)}
                              className={`rounded px-2 py-0.5 text-[10px] font-bold transition-colors ${
                                isAllChecked
                                  ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                                  : "bg-orange-100 text-[#e16718] hover:bg-orange-200"
                              }`}
                            >
                              {isAllChecked ? "Clear" : "All"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                <div className="text-[11px] text-slate-500">
                  Changes take effect immediately on next server verification.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPermissionModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePermissions}
                    className="flex items-center gap-1.5 rounded-xl bg-[#e16718] px-4 py-2 text-xs font-bold text-white shadow-md shadow-orange-600/20 hover:bg-[#c9550e]"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Permission Rights</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: Reset Password */}
        {isPasswordModalOpen && passwordUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Reset Password
                  </h3>
                </div>
                <button
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500 mb-4">
                Set a new login password for user <strong className="text-slate-800">{passwordUser.name}</strong> ({passwordUser.email}).
              </p>

              <form onSubmit={handleSavePasswordReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New Password (min. 6 characters)
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
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 shadow-sm"
                  >
                    <Check className="h-4 w-4" />
                    <span>Confirm Reset</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 4: Activity & Audit Log Drawer */}
        {isAuditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-[#e16718]">
                    <History className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      User Activity & Security Audit Log
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Review administrative events, logins, permission updates, and deactivations.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAuditModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Module Filter */}
              <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-100 bg-slate-50/30 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-600 text-[11px]">Filter Module:</span>
                  <select
                    value={auditModuleFilter}
                    onChange={(e) => {
                      setAuditModuleFilter(e.target.value);
                    }}
                    className="h-8 rounded-lg border border-slate-200 px-2 text-xs bg-white text-slate-700"
                  >
                    <option value="ALL">All Modules</option>
                    <option value="USERS">Users & Permissions</option>
                    <option value="SALE">Sales / Billing</option>
                    <option value="PURCHASE">Purchase</option>
                    <option value="INVENTORY">Inventory</option>
                    <option value="SETTINGS">Settings</option>
                  </select>
                  <button
                    onClick={handleOpenAuditLogs}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Refresh
                  </button>
                </div>
                <span className="text-[11px] text-slate-400">
                  Showing {auditLogs.length} events
                </span>
              </div>

              {/* Audit List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {auditLoading ? (
                  <div className="py-8 text-center text-slate-400">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-[#e16718]" />
                    <span>Loading audit records...</span>
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <History className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No audit logs found</p>
                  </div>
                ) : (
                  auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold font-mono ${
                              log.action === "CREATE"
                                ? "bg-emerald-100 text-emerald-800"
                                : log.action === "LOGIN"
                                ? "bg-blue-100 text-blue-800"
                                : log.action === "RESET_PASSWORD" || log.action === "UPDATE_PERMISSIONS"
                                ? "bg-purple-100 text-purple-800"
                                : log.action === "DEACTIVATE"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-slate-200 text-slate-800"
                            }`}
                          >
                            {log.action}
                          </span>
                          <span className="font-bold text-slate-900">
                            {log.module} • {log.recordTitle || "Record"}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {new Date(log.createdAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="text-slate-600 flex items-center gap-2">
                        <span>Initiated by: <strong className="text-slate-800">{log.userName || "System"}</strong></span>
                      </div>

                      {log.details && (
                        <div className="font-mono text-[11px] text-slate-500 bg-white p-2 rounded-lg border border-slate-200/60 overflow-x-auto">
                          {log.details}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end border-t border-slate-100 bg-slate-50/50 px-6 py-3">
                <button
                  onClick={() => setIsAuditModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
