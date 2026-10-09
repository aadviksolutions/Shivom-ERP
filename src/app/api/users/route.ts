import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";
import { Role } from "@/lib/auth";

// GET /api/users - List all users
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Only Owner/Admin can view users." },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        permissions: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    console.error("GET /api/users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST /api/users - Create new user
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Only Owner/Admin can create users." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, username, email, phone, role, password, permissions } = body;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Full name is required" }, { status: 400 });
    }

    if (!username || !username.trim()) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check for existing username or email
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          { username: cleanUsername },
        ],
      },
    });

    if (existing) {
      if (existing.email.toLowerCase() === cleanEmail) {
        return NextResponse.json({ error: "A user with this email address already exists." }, { status: 409 });
      }
      return NextResponse.json({ error: "This username is already taken. Please choose another." }, { status: 409 });
    }

    // Hash password securely
    const passwordHash = await bcrypt.hash(password, 10);

    const validRoles: Role[] = ["ADMIN", "BILLING", "STORE"];
    const userRole: Role = validRoles.includes(role) ? role : "BILLING";

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        username: cleanUsername,
        email: cleanEmail,
        phone: phone ? phone.trim() : null,
        role: userRole,
        passwordHash,
        permissions: permissions ? JSON.stringify(permissions) : null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        permissions: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    // Record audit log
    await recordAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      action: "CREATE",
      module: "USERS",
      recordId: newUser.id,
      recordTitle: newUser.name,
      details: {
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });

    return NextResponse.json({
      success: true,
      data: newUser,
      message: `User ${newUser.name} created successfully.`,
    }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/users error:", error);
    return NextResponse.json(
      { error: "Failed to create user. Please check your inputs." },
      { status: 500 }
    );
  }
}
