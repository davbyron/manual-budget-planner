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
  return null;
}
