import { NextResponse } from "next/server";
import { getCurrentUser, setSession, Role } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Owner/Admin is allowed to switch demo roles
    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Privilege escalation prevented. Only Owner/Admin can simulate roles." },
        { status: 403 }
      );
    }

    const { role } = await request.json();
    const validRoles: Role[] = ["ADMIN", "BILLING", "STORE"];

    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const emailMap = {
      ADMIN: "admin@shivomconstruction.com",
      BILLING: "billing@shivomconstruction.com",
      STORE: "store@shivomconstruction.com",
    };

    let user = await prisma.user.findUnique({
      where: { email: emailMap[role as Role] },
    });

    if (user && user.isActive) {
      await setSession({
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role as Role,
        phone: user.phone,
        permissions: user.permissions,
      });
      return NextResponse.json({ success: true, role });
    }

    return NextResponse.json({ error: "Target role user not found" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
