import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const warehouses = await prisma.warehouse.findMany({
      where: { isActive: true },
      include: {
        stocks: {
          include: { product: true },
        },
        _count: {
          select: { stocks: true, movements: true },
        },
      },
      orderBy: { isDefault: "desc" },
    });

    return NextResponse.json({ success: true, data: warehouses });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, code, address, isDefault = false } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: "Godown name and unique code are required" },
        { status: 400 }
      );
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        address: address?.trim() || null,
        isDefault,
      },
    });

    return NextResponse.json({ success: true, data: warehouse }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
