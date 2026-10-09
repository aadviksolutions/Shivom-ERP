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
      altMobile,
      whatsapp,
      email,
      address,
      city,
      state = "Maharashtra",
      stateCode = "27",
      pincode,
      customerType,
      gstin,
      pan,
      creditLimit = 0,
      openingBalance = 0,
      notes,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Customer name is mandatory." },
        { status: 400 }
      );
    }

    if (!mobile?.trim()) {
      return NextResponse.json(
        { error: "Mobile number is mandatory." },
        { status: 400 }
      );
    }

    // Clean and validate Indian 10-digit mobile number
    let cleanMobile = mobile.trim().replace(/\D/g, "");
    if (cleanMobile.length === 12 && cleanMobile.startsWith("91")) {
      cleanMobile = cleanMobile.slice(2);
    }
    if (cleanMobile.length !== 10 || !/^[6-9]/.test(cleanMobile)) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit Indian mobile number (e.g. 98200 12345)." },
        { status: 400 }
      );
    }

    // Validate GSTIN if provided
    const cleanGstin = gstin?.trim().toUpperCase() || null;
    if (cleanGstin) {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(cleanGstin)) {
        return NextResponse.json(
          { error: "Invalid GSTIN format. Standard 15-character format required (e.g. 27AABCS1429B1Z8)." },
          { status: 400 }
        );
      }
    }

    // Check for duplicate customer by mobile number
    const existing = await prisma.customer.findFirst({
      where: {
        mobile: cleanMobile,
        isActive: true,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: `A customer with mobile number ${cleanMobile} already exists: "${existing.name}".`,
          existingCustomer: existing,
        },
        { status: 409 }
      );
    }

    const ob = Number(openingBalance) || 0;

    let combinedNotes = notes?.trim() || "";
    if (customerType) {
      combinedNotes = combinedNotes
        ? `[Type: ${customerType}] ${combinedNotes}`
        : `[Type: ${customerType}]`;
    }

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        contactPerson: contactPerson?.trim() || null,
        mobile: cleanMobile,
        phone: altMobile?.trim() || null,
        whatsapp: whatsapp?.trim() || cleanMobile,
        email: email?.trim() || null,
        address: address?.trim() || null,
        city: city?.trim() || "Pune",
        state: state?.trim() || "Maharashtra",
        stateCode: stateCode?.trim() || "27",
        pincode: pincode?.trim() || null,
        gstin: cleanGstin,
        pan: pan?.trim().toUpperCase() || (cleanGstin ? cleanGstin.substring(2, 12) : null),
        creditLimit: Number(creditLimit) || 0,
        openingBalance: ob,
        currentBalance: ob,
        totalSales: ob,
        totalPaid: 0,
        notes: combinedNotes || null,
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
