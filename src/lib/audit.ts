import { prisma } from "./prisma";

export interface AuditLogParams {
  userId?: string | null;
  userName?: string | null;
  action: string;
  module: string;
  recordId?: string | null;
  recordTitle?: string | null;
  details?: Record<string, any> | string | null;
  ipAddress?: string | null;
}

/**
 * Record an audit log entry while ensuring sensitive fields (passwords, tokens, secrets) are sanitized.
 */
export async function recordAuditLog(params: AuditLogParams) {
  try {
    let sanitizedDetails = "";

    if (params.details) {
      if (typeof params.details === "object") {
        const copy = { ...params.details };
        // Strip sensitive keys
        const sensitiveKeys = ["password", "passwordHash", "token", "secret", "newPassword", "oldPassword"];
        for (const key of sensitiveKeys) {
          if (key in copy) {
            copy[key] = "[REDACTED]";
          }
        }
        sanitizedDetails = JSON.stringify(copy);
      } else {
        sanitizedDetails = String(params.details);
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        userName: params.userName || "System",
        action: params.action,
        module: params.module,
        recordId: params.recordId || null,
        recordTitle: params.recordTitle || null,
        details: sanitizedDetails || null,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (error) {
    // Fail-safe: audit log error should not crash the primary transaction, but log to server console
    console.error("Audit log error:", error);
  }
}

export const recordAudit = recordAuditLog;
