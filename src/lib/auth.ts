import { cookies } from "next/headers";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { hasPermission, ModuleKey, ActionKey } from "./permissions";
import { recordAuditLog } from "./audit";

export type Role = "ADMIN" | "BILLING" | "STORE";

export interface SessionUser {
  id: string;
  name: string;
  username?: string | null;
  email: string;
  role: Role;
  phone?: string | null;
  permissions?: string | null;
}

const SESSION_COOKIE_NAME = "buildstock_session";

function createToken(payload: object): string {
  const data = JSON.stringify(payload);
  const encoded = Buffer.from(data).toString("base64");
  return encoded;
}

function verifyToken(token: string): SessionUser | null {
  try {
    const json = Buffer.from(token, "base64").toString("utf-8");
    const parsed = JSON.parse(json);
    if (parsed && parsed.id && parsed.email && parsed.role) {
      return parsed as SessionUser;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get current logged in user from cookies
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }
    return verifyToken(sessionCookie.value);
  } catch {
    return null;
  }
}

/**
 * Sign in user by email OR username and password
 */
export async function authenticateUser(identifier: string, password: string): Promise<SessionUser | null> {
  const cleanId = identifier.trim();
  const lowerId = cleanId.toLowerCase();

  // Find user by email or username (case-insensitive for email & username)
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: lowerId },
        { username: cleanId },
        { username: lowerId },
      ],
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  // Update lastLogin timestamp in database
  const now = new Date();
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: now },
  });

  // Record audit log for successful login
  await recordAuditLog({
    userId: user.id,
    userName: user.name,
    action: "LOGIN",
    module: "USERS",
    recordId: user.id,
    recordTitle: user.name,
    details: { email: user.email, username: user.username, role: user.role },
  });

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role as Role,
    phone: user.phone,
    permissions: user.permissions,
  };
}

/**
 * Set session cookie
 */
export async function setSession(user: SessionUser) {
  const cookieStore = await cookies();
  const token = createToken(user);
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

/**
 * Clear session cookie
 */
export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Role-based access check
 */
export function canAccess(role: Role, requiredRoles: Role[]): boolean {
  if (role === "ADMIN") return true; // Owner/Admin has access to everything
  return requiredRoles.includes(role);
}

/**
 * Server-side authorization check for module and action.
 * Fetches fresh user permissions from database to ensure revocation takes effect immediately.
 */
export async function checkServerPermission(module: ModuleKey, action: ActionKey): Promise<{ authorized: boolean; user: SessionUser | null }> {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return { authorized: false, user: null };
  }

  // Owner/Admin always authorized
  if (sessionUser.role === "ADMIN") {
    return { authorized: true, user: sessionUser };
  }

  // Query database to ensure user is active and check fresh permissions
  const dbUser = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, name: true, role: true, isActive: true, permissions: true },
  });

  if (!dbUser || !dbUser.isActive) {
    return { authorized: false, user: null };
  }

  const authorized = hasPermission({ role: dbUser.role as Role, permissions: dbUser.permissions }, module, action);
  return { authorized, user: sessionUser };
}
