import type { IncomeSourceDraft } from "@/types";

export function validateIncomeSource(input: IncomeSourceDraft): string | null {
  if (!input || typeof input !== "object") return "Enter the income source details.";
  if (typeof input.name !== "string" || !input.name.trim()) return "Enter an income source name.";
  if (typeof input.amount !== "number" || !Number.isFinite(input.amount)) return "Enter a valid income amount.";
  return null;
}
