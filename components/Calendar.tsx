"use client";

import { useEffect, useId, useState } from "react";
import { getBillsForDate, getPayPeriodColor } from "@/lib/utils/calendar";
import type { CalendarProps } from "@/types/props";

const dollarFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const navigationClassName = "rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-zinc-700 dark:hover:bg-zinc-800";

export default function Calendar(props: CalendarProps) {
  const { payPeriods, bills } = props;
  const headingId = useId();
  const [visibleMonth, setVisibleMonth] = useState<Date | null>(null);

  useEffect(() => {
    const now = new Date();
    // Read the browser's clock after hydration, never during prerendering.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisibleMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  }, []);

  if (visibleMonth === null) {
    return (
      <section aria-label="Calendar" aria-busy="true" className="w-full rounded-2xl border border-zinc-200 bg-white p-4 text-zinc-900 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
        <p role="status" className="text-sm text-zinc-500 dark:text-zinc-400">Loading calendar…</p>
      </section>
    );
  }

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstWeekday = visibleMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weekCount = Math.ceil((firstWeekday + daysInMonth) / 7);

  function navigate(monthOffset: number) {
    setVisibleMonth((current) => {
      if (current === null) return current;
      const next = new Date(current);
      next.setMonth(next.getMonth() + monthOffset);
      return next;
    });
  }

  return (
    <section aria-labelledby={headingId} className="w-full rounded-2xl border border-zinc-200 bg-white p-4 text-zinc-900 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 id={headingId} aria-live="polite" aria-atomic="true" className="text-xl font-semibold">
          {months[month]} {year}
        </h2>
        <div role="group" aria-label="Calendar navigation" className="flex flex-wrap gap-2">
          <button type="button" aria-label="Previous year" title="Previous year" onClick={() => navigate(-12)} className={navigationClassName}>
            <span aria-hidden="true">«</span>
          </button>
          <button type="button" aria-label="Previous month" title="Previous month" onClick={() => navigate(-1)} className={navigationClassName}>
            <span aria-hidden="true">‹</span>
          </button>
          <button type="button" aria-label="Next month" title="Next month" onClick={() => navigate(1)} className={navigationClassName}>
            <span aria-hidden="true">›</span>
          </button>
          <button type="button" aria-label="Next year" title="Next year" onClick={() => navigate(12)} className={navigationClassName}>
            <span aria-hidden="true">»</span>
          </button>
        </div>
      </header>
      <table aria-labelledby={headingId} className="w-full table-fixed border-collapse text-center">
        <thead>
          <tr>
            {weekdays.map((day) => (
              <th key={day} scope="col" className="pb-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                <abbr title={day} className="no-underline">{day.slice(0, 3)}</abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: weekCount }, (_, week) => (
            <tr key={week}>
              {weekdays.map((day, weekday) => {
                const date = week * 7 + weekday - firstWeekday + 1;
                const isCurrentMonth = date >= 1 && date <= daysInMonth;
                const dateKey = `${String(year).padStart(4, "0")}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
                const backgroundColor = isCurrentMonth ? getPayPeriodColor(dateKey, payPeriods) : undefined;
                const dayBills = isCurrentMonth ? getBillsForDate(dateKey, bills) : [];
                return (
                  <td key={day} style={{ backgroundColor }} className="h-12 border-t border-zinc-100 px-1 py-2 align-top text-sm sm:h-20 dark:border-zinc-800">
                    {isCurrentMonth ? <>
                      <span>{date}</span>
                      {dayBills.length > 0 && <ul className="mt-1 space-y-1 text-left text-xs">
                        {dayBills.map((bill) => (
                          <li key={bill.id} className="rounded bg-white/80 p-1 text-zinc-900 dark:bg-zinc-950/80 dark:text-zinc-100">
                            <span className="block break-words">{bill.name}</span>
                            <span className="block break-words font-medium">{dollarFormatter.format(bill.cost)}</span>
                          </li>
                        ))}
                      </ul>}
                    </> : null}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
