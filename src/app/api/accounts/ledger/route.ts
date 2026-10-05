import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("type"); // CUSTOMER or SUPPLIER
    const entityId = searchParams.get("id");

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "Entity type and ID are required" },
        { status: 400 }
      );
    }

    const where: any = {
      entityType: entityType as "CUSTOMER" | "SUPPLIER",
    };

    if (entityType === "CUSTOMER") {
      where.customerId = entityId;
    } else {
      where.supplierId = entityId;
    }

    const entries = await prisma.ledgerEntry.findMany({
      where,
      orderBy: { date: "asc" },
      include: {
        sale: true,
        purchase: true,
        payment: true,
      },
    });

    return NextResponse.json({ success: true, data: entries });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
