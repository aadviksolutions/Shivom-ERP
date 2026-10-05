import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const movements = await prisma.stockMovement.findMany({
      where: {
        type: { in: ["ADJUSTMENT_INCREASE", "ADJUSTMENT_DECREASE"] },
      },
      include: {
        product: true,
        warehouse: true,
        createdBy: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, data: movements });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();

    const {
      productId,
      warehouseId,
      type, // ADJUSTMENT_INCREASE or ADJUSTMENT_DECREASE
      quantity,
      reason,
    } = body;

    const qty = Number(quantity);
    if (!productId || !qty || qty <= 0 || !reason) {
      return NextResponse.json(
        { error: "Product, valid positive quantity, and reason are required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const targetWarehouse = warehouseId
      ? await prisma.warehouse.findUnique({ where: { id: warehouseId } })
      : await prisma.warehouse.findFirst({ where: { isDefault: true } }) ||
        await prisma.warehouse.findFirst();

    if (!targetWarehouse) {
      return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
    }

    const isIncrease = type === "ADJUSTMENT_INCREASE";
    const delta = isIncrease ? qty : -qty;
    const newStock = product.currentStock + delta;

    if (newStock < 0) {
      return NextResponse.json(
        {
          error: `Cannot decrease stock below 0. Current stock is ${product.currentStock}`,
        },
        { status: 400 }
      );
    }

    const movement = await prisma.$transaction(async (tx) => {
      // 1. Update product
      await tx.product.update({
        where: { id: productId },
        data: { currentStock: newStock },
      });

      // 2. Update warehouse stock
      await tx.stock.upsert({
        where: {
          productId_warehouseId: {
            productId,
            warehouseId: targetWarehouse.id,
          },
        },
        update: { quantity: { increment: delta } },
        create: {
          productId,
          warehouseId: targetWarehouse.id,
          quantity: newStock,
        },
      });

      // 3. Record stock movement
      return await tx.stockMovement.create({
        data: {
          productId,
          warehouseId: targetWarehouse.id,
          type: isIncrease ? "ADJUSTMENT_INCREASE" : "ADJUSTMENT_DECREASE",
          quantity: delta,
          balanceAfter: newStock,
          referenceType: "ADJUSTMENT",
          reason: reason.trim(),
          createdById: user?.id,
        },
        include: {
          product: true,
          warehouse: true,
        },
      });
    });

    await recordAudit({
      userId: user?.id,
      userName: user?.name,
      action: "ADJUST",
      module: "INVENTORY",
      recordId: movement.id,
      recordTitle: product.name,
      details: `Stock adjusted by ${delta > 0 ? "+" : ""}${delta} for ${product.name}. Reason: ${reason} (New Stock: ${newStock})`,
    });

    return NextResponse.json({ success: true, data: movement }, { status: 201 });
  } catch (error: any) {
    console.error("Adjustment POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
