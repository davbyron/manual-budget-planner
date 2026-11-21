import type { Bill, PayPeriod } from "@/types";
import { billOccursOnDate } from "@/lib/utils/bills";

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

export function getBillsForDate(date: string, bills: Bill[]): Bill[] {
  return bills.filter((bill) => billOccursOnDate(bill, date));
}
