import type { BillInput } from "@/types";

export function validateBill(input: BillInput): string | null {
  if (!input || typeof input !== "object") return "Enter the bill details.";
  if (input.day !== null && (!Number.isInteger(input.day) || input.day < 1 || input.day > 31)) {
    return "Day must be a whole number from 1 to 31, or blank.";
  }
  if (typeof input.name !== "string" || !input.name.trim()) return "Enter a bill name.";
  if (typeof input.cost !== "number" || !Number.isFinite(input.cost) || input.cost < 0) {
    return "Amount must be a non-negative number.";
  }
  return validateBillDates(input.startDate, input.endDate);
}

export function validateBillDates(startDate: string | null, endDate: string | null): string | null {
  for (const [label, value] of [["Start date", startDate], ["End date", endDate]] as const) {
    if (value === null) continue;
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${label} must be a valid date.`;
    const date = new Date(`${value}T00:00:00.000Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return `${label} must be a valid date.`;
  }
  if (startDate !== null && endDate !== null && endDate < startDate) return "End date must be on or after start date.";
  return null;
}