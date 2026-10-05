import { prisma } from "./prisma";

interface AuditParams {
  userId?: string;
  userName?: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "CANCEL" | "ADJUST" | "PAYMENT";
  module: "SALE" | "PURCHASE" | "INVENTORY" | "CUSTOMER" | "SUPPLIER" | "PAYMENT" | "SETTINGS";
  recordId?: string;
  recordTitle?: string;
  details?: string;
  ipAddress?: string;
}

export async function recordAudit(params: AuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        userName: params.userName || "System",
        action: params.action,
        module: params.module,
        recordId: params.recordId,
        recordTitle: params.recordTitle,
        details: params.details,
        ipAddress: params.ipAddress,
      },
    });
  } catch (error) {
    console.error("Failed to record audit log:", error);
  }
}
