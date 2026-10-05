import React from "react";

export type StatusVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "purple";

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  size?: "sm" | "md";
}

export default function StatusBadge({
  status,
  variant,
  size = "md",
}: StatusBadgeProps) {
  // Infer variant from common status strings if not explicitly provided
  let computedVariant: StatusVariant = variant || "neutral";

  if (!variant) {
    const s = status.toUpperCase();
    if (["PAID", "COMPLETED", "ACTIVE", "IN STOCK", "ACCEPTED", "RECEIVED"].includes(s)) {
      computedVariant = "success";
    } else if (["PARTIAL", "PENDING", "LOW STOCK", "SENT", "ORDERED"].includes(s)) {
      computedVariant = "warning";
    } else if (["UNPAID", "CANCELLED", "VOID", "REJECTED", "OUT OF STOCK", "BOUNCED"].includes(s)) {
      computedVariant = "danger";
    } else if (["DRAFT", "INACTIVE"].includes(s)) {
      computedVariant = "neutral";
    } else if (["CONVERTED", "TRANSFER"].includes(s)) {
      computedVariant = "purple";
    }
  }

  const styles = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    warning: "bg-amber-50 text-amber-700 border-amber-200/60",
    danger: "bg-rose-50 text-rose-700 border-rose-200/60",
    info: "bg-blue-50 text-blue-700 border-blue-200/60",
    purple: "bg-purple-50 text-purple-700 border-purple-200/60",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span
      className={`inline-flex items-center justify-center font-semibold rounded-full border ${styles[computedVariant]} ${sizes[size]}`}
    >
      {status}
    </span>
  );
}
