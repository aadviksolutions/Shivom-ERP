import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";
import { Role } from "@/lib/auth";

// GET /api/users/[id]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Only Owner/Admin can view user details." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
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

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    console.error("GET /api/users/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

// PUT /api/users/[id] - Update user, assign role, update permissions, toggle status, or reset password
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Only Owner/Admin can update user accounts." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, username, email, phone, role, isActive, password, permissions } = body;

    // Security check: Protect last active Owner/Admin from accidental deactivation or privilege removal
    const willBeInactive = isActive === false;
    const willDemoteRole = role && role !== "ADMIN" && existingUser.role === "ADMIN";

    if (existingUser.role === "ADMIN" && existingUser.isActive && (willBeInactive || willDemoteRole)) {
      const activeAdminCount = await prisma.user.count({
        where: { role: "ADMIN", isActive: true },
      });

      if (activeAdminCount <= 1) {
        return NextResponse.json(
          {
            error:
              "Action denied: You cannot deactivate or demote the only remaining active Owner/Admin account. At least one active Owner/Admin must always exist in the ERP.",
          },
          { status: 400 }
        );
      }
    }

    // Check duplicate username or email if modified
    if (username && username.trim().toLowerCase() !== (existingUser.username || "").toLowerCase()) {
      const dupUser = await prisma.user.findFirst({
        where: { username: username.trim().toLowerCase(), id: { not: id } },
      });
      if (dupUser) {
        return NextResponse.json({ error: "Username is already taken by another user." }, { status: 409 });
      }
    }

    if (email && email.trim().toLowerCase() !== existingUser.email.toLowerCase()) {
      const dupEmail = await prisma.user.findFirst({
        where: { email: email.trim().toLowerCase(), id: { not: id } },
      });
      if (dupEmail) {
        return NextResponse.json({ error: "Email is already taken by another user." }, { status: 409 });
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (username !== undefined) updateData.username = username ? username.trim().toLowerCase() : null;
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
    if (role !== undefined) {
      const validRoles: Role[] = ["ADMIN", "BILLING", "STORE"];
      if (validRoles.includes(role)) {
        updateData.role = role;
      }
    }
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (permissions !== undefined) {
      updateData.permissions = permissions ? JSON.stringify(permissions) : null;
    }

    let passwordWasReset = false;
    if (password && password.trim().length >= 6) {
      updateData.passwordHash = await bcrypt.hash(password.trim(), 10);
      passwordWasReset = true;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
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
        updatedAt: true,
      },
    });

    // Record audit logs
    if (passwordWasReset) {
      await recordAuditLog({
        userId: currentUser.id,
        userName: currentUser.name,
        action: "RESET_PASSWORD",
        module: "USERS",
        recordId: id,
        recordTitle: updatedUser.name,
        details: { resetBy: currentUser.name },
      });
    }

    if (permissions !== undefined) {
      await recordAuditLog({
        userId: currentUser.id,
        userName: currentUser.name,
        action: "UPDATE_PERMISSIONS",
        module: "USERS",
        recordId: id,
        recordTitle: updatedUser.name,
        details: { role: updatedUser.role, customPermissionsSet: Boolean(permissions) },
      });
    }

    if (isActive !== undefined && isActive !== existingUser.isActive) {
      await recordAuditLog({
        userId: currentUser.id,
        userName: currentUser.name,
        action: isActive ? "ACTIVATE" : "DEACTIVATE",
        module: "USERS",
        recordId: id,
        recordTitle: updatedUser.name,
        details: { newStatus: isActive ? "ACTIVE" : "INACTIVE" },
      });
    }

    await recordAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      action: "UPDATE",
      module: "USERS",
      recordId: id,
      recordTitle: updatedUser.name,
      details: {
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        email: updatedUser.email,
        username: updatedUser.username,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: "User updated successfully.",
    });
  } catch (error: any) {
    console.error("PUT /api/users/[id] error:", error);
    return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Deactivate user
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Only Owner/Admin can deactivate users." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Protect last active Owner/Admin
    if (existingUser.role === "ADMIN" && existingUser.isActive) {
      const activeAdminCount = await prisma.user.count({
        where: { role: "ADMIN", isActive: true },
      });

      if (activeAdminCount <= 1) {
        return NextResponse.json(
          {
            error:
              "Cannot deactivate or remove the only remaining active Owner/Admin. At least one active Owner/Admin is required.",
          },
          { status: 400 }
        );
      }
    }

    // Safe deactivation
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, name: true, isActive: true },
    });

    await recordAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      action: "DEACTIVATE",
      module: "USERS",
      recordId: id,
      recordTitle: existingUser.name,
      details: { reason: "Deactivated by administrator" },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: `User ${existingUser.name} has been deactivated.`,
    });
  } catch (error: any) {
    console.error("DELETE /api/users/[id] error:", error);
    return NextResponse.json({ error: "Failed to deactivate user" }, { status: 500 });
  }
}
