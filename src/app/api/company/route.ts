import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export async function GET() {
  try {
    const company = await prisma.company.findFirst() || await prisma.company.create({
      data: {
        name: "Shivom Construction",
        legalName: "Shivom Construction",
        logoUrl: "/images/shivom-logo.png",
      },
    });

    return NextResponse.json({ success: true, data: company });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();

    const existing = await prisma.company.findFirst();
    const id = existing?.id || "default-company";

    const updated = await prisma.company.upsert({
      where: { id },
      update: {
        name: body.name?.trim(),
        legalName: body.legalName?.trim() || null,
        gstin: body.gstin?.trim()?.toUpperCase() || null,
        pan: body.pan?.trim()?.toUpperCase() || null,
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        altPhone: body.altPhone?.trim() || null,
        address: body.address?.trim() || null,
        city: body.city?.trim() || null,
        state: body.state?.trim() || null,
        stateCode: body.stateCode?.trim() || null,
        pincode: body.pincode?.trim() || null,
        logoUrl: body.logoUrl?.trim() || null,
        bankName: body.bankName?.trim() || null,
        bankAccountNo: body.bankAccountNo?.trim() || null,
        bankIfsc: body.bankIfsc?.trim() || null,
        bankBranch: body.bankBranch?.trim() || null,
        upiId: body.upiId?.trim() || null,
        invoiceTerms: body.invoiceTerms || null,
        invoicePrefix: body.invoicePrefix || "INV-26/",
        quotationPrefix: body.quotationPrefix || "QTN-26/",
        purchasePrefix: body.purchasePrefix || "PO-26/",
        paymentPrefix: body.paymentPrefix || "REC-26/",
      },
      create: {
        id,
        name: body.name || "BuildStock ERP",
        legalName: body.legalName,
        gstin: body.gstin,
        phone: body.phone,
      },
    });

    await recordAudit({
      userId: user?.id,
      userName: user?.name,
      action: "UPDATE",
      module: "SETTINGS",
      recordId: updated.id,
      recordTitle: "Company Profile",
      details: "Updated company profile & invoice settings",
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
