import { validateBillDates } from "@/lib/utils/bills";
import type { ExpenseDraft, PayPeriodInput, PayPeriodWithExpenses } from "@/types";

export function validatePayPeriod(input: PayPeriodInput): string | null {
  if (!input || typeof input.start_date !== "string" || !input.start_date || typeof input.end_date !== "string" || !input.end_date) {
    return "Enter both a start date and an end date.";
  }
  return validateBillDates(input.start_date, input.end_date);
}

export function validateExpense(input: ExpenseDraft): string | null {
  if (!input || typeof input !== "object") return "Enter the expense details.";
  if (typeof input.date !== "string" || !input.date || validateBillDates(input.date, null)) return "Enter a valid expense date.";
  if (typeof input.name !== "string" || !input.name.trim()) return "Enter an expense name.";
  if (typeof input.cost !== "number" || !Number.isFinite(input.cost)) return "Enter a valid expense amount.";
  return null;
}

export function payPeriodMatches(current: PayPeriodWithExpenses, original: PayPeriodWithExpenses): boolean {
  if (current.id !== original.id || current.start_date !== original.start_date || current.end_date !== original.end_date || current.expenses.length !== original.expenses.length) return false;
  const saved = new Map(current.expenses.map((expense) => [expense.id, expense]));
  return original.expenses.every((expense) => {
    const match = saved.get(expense.id);
    return match && match.date === expense.date && match.name === expense.name && match.cost === expense.cost && match.pay_period_id === expense.pay_period_id;
  });
}
