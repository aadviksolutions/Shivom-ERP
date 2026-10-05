// Formatting and utility functions for BuildStock ERP

/**
 * Format a number as Indian Rupee (INR)
 * e.g. 125000 -> ₹1,25,000.00
 */
export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format compact number in Lakhs/Crores
 */
export function formatCompactINR(amount: number | null | undefined): string {
  if (!amount || isNaN(amount)) return "₹0";
  if (Math.abs(amount) >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (Math.abs(amount) >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  if (Math.abs(amount) >= 1000) {
    return `₹${(amount / 1000).toFixed(1)} k`;
  }
  return formatINR(amount);
}

/**
 * Format date in Indian business format (e.g. 05 Oct 2026)
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

/**
 * Format date & time (e.g. 05 Oct 2026, 05:45 PM)
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

/**
 * Calculate GST amounts cleanly without floating point roundoff issues
 */
export function calculateGSTBreakdown({
  rate,
  quantity,
  discountPercent = 0,
  gstRate = 18,
  isInterState = false,
}: {
  rate: number;
  quantity: number;
  discountPercent?: number;
  gstRate?: number;
  isInterState?: boolean;
}) {
  const lineSubtotal = Math.round(rate * quantity * 100) / 100;
  const discountAmount = Math.round((lineSubtotal * (discountPercent / 100)) * 100) / 100;
  const taxableAmount = Math.max(0, lineSubtotal - discountAmount);

  const taxAmount = Math.round((taxableAmount * (gstRate / 100)) * 100) / 100;
  const cgstAmount = isInterState ? 0 : Math.round((taxAmount / 2) * 100) / 100;
  const sgstAmount = isInterState ? 0 : Math.round((taxAmount - cgstAmount) * 100) / 100;
  const igstAmount = isInterState ? taxAmount : 0;
  const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

  return {
    lineSubtotal,
    discountAmount,
    taxableAmount,
    gstRate,
    taxAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalAmount,
  };
}

/**
 * Convert number to words in Indian numbering format for invoice printing
 */
export function numberToWordsINR(num: number): string {
  const a = [
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Eleven ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function convertNumber(n: number): string {
    if (n === 0) return "";
    let str = "";
    if (n > 19) {
      str += b[Math.floor(n / 10)] + " " + a[n % 10];
    } else {
      str += a[n];
    }
    return str.trim();
  }

  const rounded = Math.floor(Math.abs(num));
  if (rounded === 0) return "Rupees Zero Only";

  let result = "";

  const crore = Math.floor(rounded / 10000000);
  const lakh = Math.floor((rounded % 10000000) / 100000);
  const thousand = Math.floor((rounded % 100000) / 1000);
  const hundred = Math.floor((rounded % 1000) / 100);
  const rest = rounded % 100;

  if (crore > 0) {
    result += `${convertNumber(crore)} Crore `;
  }
  if (lakh > 0) {
    result += `${convertNumber(lakh)} Lakh `;
  }
  if (thousand > 0) {
    result += `${convertNumber(thousand)} Thousand `;
  }
  if (hundred > 0) {
    result += `${convertNumber(hundred)} Hundred `;
  }
  if (rest > 0) {
    result += `${convertNumber(rest)} `;
  }

  return `Rupees ${result.trim()} Only`;
}

/**
 * Stock indicator badge
 */
export function getStockStatus(currentStock: number, minStock: number): {
  label: string;
  variant: "success" | "warning" | "danger";
} {
  if (currentStock <= 0) {
    return { label: "Out of Stock", variant: "danger" };
  }
  if (currentStock <= minStock) {
    return { label: "Low Stock", variant: "warning" };
  }
  return { label: "In Stock", variant: "success" };
}
