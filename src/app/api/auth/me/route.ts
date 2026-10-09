import { NextResponse } from "next/server";
import { getCurrentUser, clearSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json(
        { authenticated: false, error: "No active session found" },
        { status: 401 }
      );
    }

    // Look up fresh user details from database
    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        permissions: true,
      },
    });

    if (!dbUser || !dbUser.isActive) {
      // Invalidate stale session cookie
      await clearSession();
      return NextResponse.json(
        { authenticated: false, error: "Account inactive or user not found" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: dbUser.id,
          name: dbUser.name,
          username: dbUser.username,
          email: dbUser.email,
          role: dbUser.role,
          phone: dbUser.phone,
          permissions: dbUser.permissions,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error: any) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
