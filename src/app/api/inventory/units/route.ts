import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const units = await prisma.unit.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { code: "asc" },
    });
    return NextResponse.json({ success: true, data: units });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, code, description, isDefault = false } = body;
    if (!name || !code) {
      return NextResponse.json({ error: "Unit name and code are required" }, { status: 400 });
    }

    const unit = await prisma.unit.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description?.trim() || null,
        isDefault,
      },
    });
    return NextResponse.json({ success: true, data: unit }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
