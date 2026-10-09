import { NextResponse } from "next/server";
import { authenticateUser, setSession } from "@/lib/auth";

// In-memory rate limiting map: identifier -> { count: number, resetAt: number }
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record || now > record.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_ATTEMPTS) {
    return false; // Rate limited
  }

  record.count += 1;
  return true;
}

function clearRateLimit(key: string) {
  loginAttempts.delete(key);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = body.identifier || body.email || body.username;
    const password = body.password;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Username or email and password are required" },
        { status: 400 }
      );
    }

    const cleanIdentifier = String(identifier).trim().toLowerCase();

    // Check rate limit
    if (!checkRateLimit(cleanIdentifier)) {
      return NextResponse.json(
        {
          error:
            "Too many failed login attempts. For security reasons, please wait 5 minutes before trying again.",
        },
        { status: 429 }
      );
    }

    const user = await authenticateUser(cleanIdentifier, password);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid username/email or password. Please check your credentials." },
        { status: 401 }
      );
    }

    // Clear rate limit on successful authentication
    clearRateLimit(cleanIdentifier);

    await setSession(user);

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
