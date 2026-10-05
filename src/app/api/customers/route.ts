import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { mobile: { contains: search, mode: "insensitive" } },
        { gstin: { contains: search, mode: "insensitive" } },
        { contactPerson: { contains: search, mode: "insensitive" } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        _count: {
          select: { sales: true, payments: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: customers });
  } catch (error: any) {
    console.error("Customers GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();

    const {
      name,
      contactPerson,
      mobile,
      whatsapp,
      email,
      address,
      city,
      state = "Maharashtra",
      stateCode = "27",
      pincode,
      gstin,
      pan,
      creditLimit = 0,
      openingBalance = 0,
      notes,
    } = body;

    if (!name || !mobile) {
      return NextResponse.json(
        { error: "Customer name and mobile number are required" },
        { status: 400 }
      );
    }

    const ob = Number(openingBalance) || 0;

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        contactPerson: contactPerson?.trim() || null,
        mobile: mobile.trim(),
        whatsapp: whatsapp?.trim() || mobile.trim(),
        email: email?.trim() || null,
        address: address?.trim() || null,
        city: city?.trim() || "Pune",
        state: state?.trim() || "Maharashtra",
        stateCode: stateCode?.trim() || "27",
        pincode: pincode?.trim() || null,
        gstin: gstin?.trim().toUpperCase() || null,
        pan: pan?.trim().toUpperCase() || null,
        creditLimit: Number(creditLimit) || 0,
        openingBalance: ob,
        currentBalance: ob,
        totalSales: ob,
        totalPaid: 0,
        notes: notes?.trim() || null,
      },
    });

    // Create Opening Balance Ledger Entry if balance > 0
    if (ob > 0) {
      await prisma.ledgerEntry.create({
        data: {
          entityType: "CUSTOMER",
          customerId: customer.id,
          transactionType: "OPENING_BALANCE",
          referenceNo: "OB-" + new Date().getFullYear(),
          debit: ob,
          credit: 0,
          runningBalance: ob,
          notes: "Customer Opening Balance",
          createdById: user?.id,
        },
      });
    }

    await recordAudit({
      userId: user?.id,
      userName: user?.name,
      action: "CREATE",
      module: "CUSTOMER",
      recordId: customer.id,
      recordTitle: customer.name,
      details: `Created customer ${customer.name} (Mobile: ${customer.mobile}, OB: ₹${ob})`,
    });

    return NextResponse.json({ success: true, data: customer }, { status: 201 });
  } catch (error: any) {
    console.error("Customers POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        contactPerson: data.contactPerson?.trim() || null,
        mobile: data.mobile?.trim(),
        whatsapp: data.whatsapp?.trim() || null,
        email: data.email?.trim() || null,
        address: data.address?.trim() || null,
        city: data.city?.trim() || null,
        state: data.state?.trim() || null,
        stateCode: data.stateCode?.trim() || null,
        pincode: data.pincode?.trim() || null,
        gstin: data.gstin?.trim().toUpperCase() || null,
        pan: data.pan?.trim().toUpperCase() || null,
        creditLimit: data.creditLimit !== undefined ? Number(data.creditLimit) : undefined,
        notes: data.notes?.trim() || null,
        isActive: data.isActive,
      },
    });

    await recordAudit({
      userId: user?.id,
      userName: user?.name,
      action: "UPDATE",
      module: "CUSTOMER",
      recordId: updated.id,
      recordTitle: updated.name,
      details: `Updated customer ${updated.name}`,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Customers PUT error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
