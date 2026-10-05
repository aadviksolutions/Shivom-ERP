import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId");
    const brandId = searchParams.get("brandId");
    const lowStock = searchParams.get("lowStock") === "true";

    const where: any = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
        { hsnCode: { contains: search, mode: "insensitive" } },
      ];
    }

    if (categoryId) where.categoryId = categoryId;
    if (brandId) where.brandId = brandId;

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        brand: true,
        unit: true,
        stocks: {
          include: { warehouse: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const result = lowStock
      ? products.filter((p) => p.currentStock <= p.minStockLevel)
      : products;

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Products GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();

    const {
      name,
      sku,
      barcode,
      description,
      hsnCode,
      purchasePrice = 0,
      salePrice = 0,
      minSalePrice = 0,
      gstRate = 18,
      minStockLevel = 10,
      openingStock = 0,
      categoryId,
      brandId,
      unitId,
    } = body;

    if (!name || !sku || !unitId) {
      return NextResponse.json(
        { error: "Product name, SKU and Unit are required" },
        { status: 400 }
      );
    }

    // Check SKU uniqueness
    const existing = await prisma.product.findUnique({
      where: { sku: sku.trim().toUpperCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A product with this SKU already exists" },
        { status: 400 }
      );
    }

    // Get default warehouse
    const defaultWarehouse = await prisma.warehouse.findFirst({
      where: { isDefault: true },
    }) || await prisma.warehouse.findFirst();

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        barcode: barcode?.trim() || null,
        description: description?.trim() || null,
        hsnCode: hsnCode?.trim() || null,
        purchasePrice: Number(purchasePrice) || 0,
        salePrice: Number(salePrice) || 0,
        minSalePrice: Number(minSalePrice) || 0,
        gstRate: Number(gstRate) || 18,
        minStockLevel: Number(minStockLevel) || 10,
        openingStock: Number(openingStock) || 0,
        currentStock: Number(openingStock) || 0,
        categoryId: categoryId || null,
        brandId: brandId || null,
        unitId,
      },
      include: {
        category: true,
        brand: true,
        unit: true,
      },
    });

    // Create warehouse stock
    if (defaultWarehouse) {
      await prisma.stock.create({
        data: {
          productId: product.id,
          warehouseId: defaultWarehouse.id,
          quantity: Number(openingStock) || 0,
          minStock: Number(minStockLevel) || 10,
        },
      });

      if (Number(openingStock) > 0) {
        await prisma.stockMovement.create({
          data: {
            productId: product.id,
            warehouseId: defaultWarehouse.id,
            type: "OPENING",
            quantity: Number(openingStock),
            balanceAfter: Number(openingStock),
            reason: "Opening Stock on Product Creation",
            createdById: user?.id,
          },
        });
      }
    }

    await recordAudit({
      userId: user?.id,
      userName: user?.name,
      action: "CREATE",
      module: "INVENTORY",
      recordId: product.id,
      recordTitle: product.name,
      details: `Created product ${product.name} (SKU: ${product.sku}, Stock: ${product.currentStock})`,
    });

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error: any) {
    console.error("Products POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        barcode: data.barcode?.trim() || null,
        description: data.description?.trim() || null,
        hsnCode: data.hsnCode?.trim() || null,
        purchasePrice: data.purchasePrice !== undefined ? Number(data.purchasePrice) : undefined,
        salePrice: data.salePrice !== undefined ? Number(data.salePrice) : undefined,
        minSalePrice: data.minSalePrice !== undefined ? Number(data.minSalePrice) : undefined,
        gstRate: data.gstRate !== undefined ? Number(data.gstRate) : undefined,
        minStockLevel: data.minStockLevel !== undefined ? Number(data.minStockLevel) : undefined,
        categoryId: data.categoryId,
        brandId: data.brandId,
        unitId: data.unitId,
        isActive: data.isActive,
      },
      include: {
        category: true,
        brand: true,
        unit: true,
      },
    });

    await recordAudit({
      userId: user?.id,
      userName: user?.name,
      action: "UPDATE",
      module: "INVENTORY",
      recordId: updated.id,
      recordTitle: updated.name,
      details: `Updated product ${updated.name}`,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Products PUT error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
