import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: quotation });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;
    const body = await request.json();
    const { status, notes, terms } = body;

    const existing = await prisma.quotation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    const data: any = {};
    if (status) data.status = status;
    if (notes !== undefined) data.notes = notes;
    if (terms !== undefined) data.terms = terms;

    const updated = await prisma.quotation.update({
      where: { id },
      data,
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });

    if (user) {
      await recordAudit({
        userId: user.id,
        userName: user.name,
        action: "UPDATE",
        module: "QUOTATIONS",
        recordId: id,
        recordTitle: existing.quotationNumber,
        details: `Updated quotation status to ${status || existing.status}`,
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    const quotation = await prisma.quotation.findUnique({ where: { id } });
    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    if (quotation.status === "CONVERTED") {
      return NextResponse.json(
        { error: "Converted quotations cannot be deleted" },
        { status: 400 }
      );
    }

    await prisma.quotationItem.deleteMany({ where: { quotationId: id } });
    await prisma.quotation.delete({ where: { id } });

    if (user) {
      await recordAudit({
        userId: user.id,
        userName: user.name,
        action: "DELETE",
        module: "QUOTATIONS",
        recordId: id,
        recordTitle: quotation.quotationNumber,
        details: `Deleted quotation ${quotation.quotationNumber}`,
      });
    }

    return NextResponse.json({ success: true, message: "Quotation deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
