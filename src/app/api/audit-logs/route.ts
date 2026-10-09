import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Only Owner/Admin can review audit records." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const moduleFilter = searchParams.get("module");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const where: any = {};
    if (moduleFilter && moduleFilter !== "ALL") {
      where.module = moduleFilter;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 100),
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: logs,
    });
  } catch (error: any) {
    console.error("GET /api/audit-logs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
