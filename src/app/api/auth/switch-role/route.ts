import { NextResponse } from "next/server";
import { setSession, Role } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
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

    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: `${role.toLowerCase()}@buildstock.com` },
      });
    }

    if (user) {
      await setSession({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as Role,
        phone: user.phone,
      });
      return NextResponse.json({ success: true, role });
    }

    // Fallback virtual user if user row missing
    await setSession({
      id: "active-" + role.toLowerCase(),
      name: role === "ADMIN" ? "Owner Admin" : role === "BILLING" ? "Billing Desk" : "Store Manager",
      email: `${role.toLowerCase()}@shivomconstruction.com`,
      role: role as Role,
    });

    return NextResponse.json({ success: true, role });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
