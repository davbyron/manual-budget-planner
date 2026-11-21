import type { Bill, ExpenseDraft, IncomeSource, PayPeriodBalanceInput, PayPeriodInput, PayPeriodLeftover, PayPeriodWithExpenses, VariableBillOccurrence } from "@/types";
import { billOccursOnDate, validateBillDates } from "@/lib/utils/bills";

export function validatePayPeriod(input: PayPeriodInput): string | null {
  if (!input || typeof input.start_date !== "string" || !input.start_date || typeof input.end_date !== "string" || !input.end_date) {
    return "Enter both a start date and an end date.";
  }
  if (typeof input.color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(input.color)) return "Choose a valid color.";
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
  if (current.id !== original.id || current.color !== original.color || current.start_date !== original.start_date || current.end_date !== original.end_date || current.expenses.length !== original.expenses.length) return false;
  const saved = new Map(current.expenses.map((expense) => [expense.id, expense]));
  return original.expenses.every((expense) => {
    const match = saved.get(expense.id);
    return match && match.date === expense.date && match.cost === expense.cost &&
      match.pay_period_id === expense.pay_period_id && match.bill_id === expense.bill_id &&
      match.bill_due_date === expense.bill_due_date && (match.bill_id != null || match.name === expense.name);
  });
}

export function getBillOccurrenceKey(billId: number, dueDate: string) {
  return `${billId}_${dueDate}`;
}

export function getBillOccurrences(bills: Bill[], startDate: string, endDate: string): VariableBillOccurrence[] {
  if (validateBillDates(startDate, endDate)) return [];
  const occurrences: VariableBillOccurrence[] = [];
  const month = new Date(`${startDate.slice(0, 7)}-01T00:00:00.000Z`);
  const lastMonth = new Date(`${endDate.slice(0, 7)}-01T00:00:00.000Z`);

  while (month <= lastMonth) {
    const monthPrefix = month.toISOString().slice(0, 7);
    for (const bill of bills) {
      if (bill.day === null) continue;
      const dueDate = `${monthPrefix}-${String(bill.day).padStart(2, "0")}`;
      if (validateBillDates(dueDate, null)) continue;
      if (dueDate < startDate || dueDate > endDate || !billOccursOnDate(bill, dueDate)) continue;
      occurrences.push({ bill, dueDate, key: getBillOccurrenceKey(bill.id, dueDate) });
    }
    month.setUTCMonth(month.getUTCMonth() + 1);
  }
  return occurrences;
}

export function getPayPeriodRemainingBalance(
  period: PayPeriodBalanceInput,
  bills: Bill[],
  incomeSources: IncomeSource[],
  previousRemainingBalance = 0,
): number {
  const recordedBills = new Set(period.expenses.flatMap((expense) =>
    expense.bill_id != null && expense.bill_due_date
      ? [getBillOccurrenceKey(expense.bill_id, expense.bill_due_date)]
      : []
  ));
  const billTotal = getBillOccurrences(bills, period.start_date, period.end_date).reduce(
    (total, { bill, key }) => bill.isCostVariable || recordedBills.has(key) ? total : total + Math.round(bill.cost * 100),
    0,
  );
  const expenseTotal = period.expenses.reduce((total, expense) => total + Math.round(expense.cost * 100), 0);
  const beginningBalance = incomeSources.reduce((total, source) => total + Math.round(source.amount * 100), 0);
  return (beginningBalance + Math.round(previousRemainingBalance * 100) - billTotal - expenseTotal) / 100;
}

export function getPayPeriodRemainingBalances(
  periods: PayPeriodBalanceInput[],
  bills: Bill[],
  incomeSources: IncomeSource[],
  today: string,
): Map<number, number> {
  const chronologicalPeriods = [...periods].sort((a, b) => a.start_date.localeCompare(b.start_date) || a.id - b.id);
  const balances = new Map<number, number>();
  let previousRemainingBalance = 0;

  for (const period of chronologicalPeriods) {
    const remainingBalance = period.end_date < today && period.leftover !== undefined
      ? period.leftover
      : getPayPeriodRemainingBalance(period, bills, incomeSources, previousRemainingBalance);
    balances.set(period.id, remainingBalance);
    previousRemainingBalance = remainingBalance;
  }

  return balances;
}

export function applyPayPeriodLeftovers(periods: PayPeriodWithExpenses[], leftovers: PayPeriodLeftover[]): PayPeriodWithExpenses[] {
  const byId = new Map(leftovers.map((period) => [period.id, period.leftover]));
  return periods.map((period) => {
    const leftover = byId.get(period.id);
    return leftover === undefined || leftover === period.leftover ? period : { ...period, leftover };
  });
}
