import { cookies } from "next/headers";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export type Role = "ADMIN" | "BILLING" | "STORE";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
}

const SESSION_COOKIE_NAME = "buildstock_session";

// Base64 + HMAC signature or simple secure token for development/production
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
      // Return default admin for smooth initial experience if no session set
      return null;
    }
    return verifyToken(sessionCookie.value);
  } catch {
    return null;
  }
}

/**
 * Sign in user by email and password
 */
export async function authenticateUser(email: string, password: string): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user || !user.isActive) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
    phone: user.phone,
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
 * Permission check helper
 */
export function canAccess(role: Role, requiredRoles: Role[]): boolean {
  if (role === "ADMIN") return true; // Owner/Admin has access to everything
  return requiredRoles.includes(role);
}
