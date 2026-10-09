import { Role } from "./auth";

export const PERMISSION_MODULES = [
  { id: "dashboard", label: "Dashboard", description: "Overview KPI cards and quick actions" },
  { id: "sales", label: "Billing / Sales", description: "Invoices, counter sales, and credit billing" },
  { id: "quotations", label: "Quotations", description: "Price estimates and customer quotations" },
  { id: "customers", label: "Customers", description: "Customer ledger and directory management" },
  { id: "purchase", label: "Purchase", description: "Purchase orders and supplier invoices" },
  { id: "suppliers", label: "Suppliers", description: "Supplier directory and payment ledgers" },
  { id: "inventory", label: "Inventory", description: "Product catalog, prices, and stock levels" },
  { id: "stock_adjustment", label: "Stock Adjustment", description: "Stock variance corrections and transfers" },
  { id: "payments", label: "Payments", description: "Customer receipts and supplier payments" },
  { id: "expenses", label: "Expenses", description: "Operational and site expense tracking" },
  { id: "reports", label: "Reports", description: "Sales, profit, outstanding, and inventory analytics" },
  { id: "gst", label: "GST", description: "GSTR-1, HSN summaries, and tax registers" },
  { id: "settings", label: "Settings", description: "Company profile, tax rates, and prefixes" },
  { id: "users", label: "Users & Permissions", description: "User management and access rights matrix" },
] as const;

export type ModuleKey = typeof PERMISSION_MODULES[number]["id"];

export const PERMISSION_ACTIONS = [
  { id: "view", label: "View" },
  { id: "create", label: "Create" },
  { id: "edit", label: "Edit" },
  { id: "approve", label: "Approve" },
  { id: "cancel", label: "Cancel / Void" },
  { id: "delete", label: "Delete" },
  { id: "export", label: "Export" },
] as const;

export type ActionKey = typeof PERMISSION_ACTIONS[number]["id"];

export type PermissionMatrix = Record<ModuleKey, ActionKey[]>;

/**
 * Sensible default permissions for each ERP role
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<Role, PermissionMatrix> = {
  ADMIN: {
    dashboard: ["view", "create", "edit", "approve", "cancel", "delete", "export"],
    sales: ["view", "create", "edit", "approve", "cancel", "delete", "export"],
    quotations: ["view", "create", "edit", "approve", "cancel", "delete", "export"],
    customers: ["view", "create", "edit", "approve", "cancel", "delete", "export"],
    purchase: ["view", "create", "edit", "approve", "cancel", "delete", "export"],
    suppliers: ["view", "create", "edit", "approve", "cancel", "delete", "export"],
    inventory: ["view", "create", "edit", "approve", "cancel", "delete", "export"],
    stock_adjustment: ["view", "create", "edit", "approve", "cancel", "delete", "export"],
    payments: ["view", "create", "edit", "approve", "cancel", "delete", "export"],
    expenses: ["view", "create", "edit", "approve", "cancel", "delete", "export"],
    reports: ["view", "create", "edit", "approve", "cancel", "delete", "export"],
    gst: ["view", "create", "edit", "approve", "cancel", "delete", "export"],
    settings: ["view", "create", "edit", "approve", "cancel", "delete", "export"],
    users: ["view", "create", "edit", "approve", "cancel", "delete", "export"],
  },
  BILLING: {
    dashboard: ["view"],
    sales: ["view", "create", "edit", "export"],
    quotations: ["view", "create", "edit", "export"],
    customers: ["view", "create", "edit", "export"],
    purchase: [],
    suppliers: ["view"],
    inventory: ["view"],
    stock_adjustment: [],
    payments: ["view", "create", "export"],
    expenses: ["view", "create"],
    reports: ["view", "export"],
    gst: ["view", "export"],
    settings: [],
    users: [],
  },
  STORE: {
    dashboard: ["view"],
    sales: ["view"],
    quotations: [],
    customers: ["view"],
    purchase: ["view", "create", "edit", "approve", "export"],
    suppliers: ["view", "create", "edit"],
    inventory: ["view", "create", "edit", "export"],
    stock_adjustment: ["view", "create", "edit", "approve"],
    payments: ["view"],
    expenses: ["view", "create"],
    reports: ["view"],
    gst: [],
    settings: [],
    users: [],
  },
};

/**
 * Parse permissions from DB string or object
 */
export function parsePermissions(raw: string | null | undefined, role: Role): PermissionMatrix {
  if (!raw) {
    return JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS.BILLING));
  }

  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    const defaults = DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS.BILLING;
    const merged: Partial<PermissionMatrix> = {};

    for (const mod of PERMISSION_MODULES) {
      if (Array.isArray(parsed[mod.id])) {
        merged[mod.id] = parsed[mod.id];
      } else {
        merged[mod.id] = defaults[mod.id] || [];
      }
    }

    return merged as PermissionMatrix;
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS.BILLING));
  }
}

/**
 * Check if a user possesses permission for a given module and action
 */
export function hasPermission(
  user: { role: Role; permissions?: string | null } | null | undefined,
  module: ModuleKey,
  action: ActionKey
): boolean {
  if (!user) return false;

  // Owner/Admin always has unrestricted access
  if (user.role === "ADMIN") return true;

  const matrix = parsePermissions(user.permissions, user.role);
  const moduleActions = matrix[module] || [];
  return moduleActions.includes(action);
}
