import type { Bill, CalendarDayCashFlow, IncomeSource, PayPeriod, PayPeriodWithExpenses } from "@/types";
import { getBillOccurrenceKey, getBillOccurrences } from "@/lib/utils/pay-periods";

// ISO date-only strings compare without timezone conversion. Both endpoints count.
export function getPayPeriodColor(date: string, periods: PayPeriod[]): string | undefined {
  let match: PayPeriod | undefined;
  for (const period of periods) {
    if (date < period.start_date || date > period.end_date) continue;
    if (!match || period.start_date > match.start_date || (period.start_date === match.start_date && period.id > match.id)) {
      match = period;
    }
  }
  return match?.color;
}

export function getCalendarCashFlow(
  month: string,
  daysInMonth: number,
  bills: Bill[],
  periods: PayPeriodWithExpenses[],
  incomeSources: IncomeSource[],
): Map<string, CalendarDayCashFlow> {
  const days = new Map<string, CalendarDayCashFlow>();
  const billsById = new Map(bills.map((bill) => [bill.id, bill]));
  const recordedBills = new Set<string>();

  for (let day = 1; day <= daysInMonth; day++) {
    days.set(`${month}-${String(day).padStart(2, "0")}`, {
      bills: [],
      expenses: [],
      incomeSources: [],
      gainsInCents: 0,
      lossesInCents: 0,
    });
  }

  for (const period of periods) {
    const firstDay = days.get(period.start_date);
    if (firstDay) {
      for (const source of incomeSources) {
        firstDay.incomeSources.push({
          id: `${period.id}-${source.id}`,
          name: source.name,
          amountInCents: Math.round(source.amount * 100),
        });
      }
    }

    for (const expense of period.expenses) {
      // The recorded payment can be dated differently from its scheduled bill.
      if (expense.bill_id !== null && expense.bill_due_date !== null) {
        recordedBills.add(getBillOccurrenceKey(expense.bill_id, expense.bill_due_date));
      }
      const bill = expense.bill_id === null ? undefined : billsById.get(expense.bill_id);
      days.get(expense.date)?.expenses.push({
        id: String(expense.id),
        name: bill?.name ?? expense.name,
        amountInCents: -Math.round(expense.cost * 100),
      });
    }
  }

  for (const { bill, dueDate, key } of getBillOccurrences(bills, `${month}-01`, `${month}-${daysInMonth}`)) {
    if (recordedBills.has(key)) continue;
    days.get(dueDate)?.bills.push({
      id: key,
      name: bill.name,
      amountInCents: bill.isCostVariable ? null : -Math.round(bill.cost * 100),
    });
  }

  for (const day of days.values()) {
    for (const { amountInCents } of [...day.bills, ...day.expenses, ...day.incomeSources]) {
      if (amountInCents === null) continue;
      if (amountInCents > 0) day.gainsInCents += amountInCents;
      if (amountInCents < 0) day.lossesInCents += amountInCents;
    }
  }

  return days;
}
