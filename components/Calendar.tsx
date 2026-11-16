"use client";

import type { CalendarProps } from "@/types/props";
import { useEffect, useId, useState } from "react";
import { getBillsForDate, getPayPeriodColor } from "@/lib/utils/calendar";
import {
  PiCaretRightBold,
  PiCaretDoubleRightBold,
  PiCaretLeftBold,
  PiCaretDoubleLeftBold
} from "react-icons/pi";

const dollarFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const navigationClassName = "\
  px-3 min-h-6 min-w-6 text-xs font-medium \
  rounded-xs border border-zinc-200 transition-colors \
  hover:bg-zinc-100 \
  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 \
  dark:border-zinc-700 dark:hover:bg-zinc-800\
";

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

  const today = new Date();

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
    <section
      aria-labelledby={headingId}
      className="
        p-3
        flex flex-col gap-6
        border border-zinc-200 bg-white
        text-zinc-900 shadow-sm
        sm:p-4
        xl:h-full xl:w-1/2
        dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100
      "
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={headingId} aria-live="polite" aria-atomic="true">
          {months[month]} {year}
        </h2>
        <div role="group" aria-label="Calendar navigation" className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-label="Previous year"
            title="Previous year"
            onClick={() => navigate(-12)}
            className={navigationClassName}
          >
            <PiCaretDoubleLeftBold />
          </button>
          <button
            type="button"
            aria-label="Previous month"
            title="Previous month"
            onClick={() => navigate(-1)}
            className={navigationClassName}
          >
            <PiCaretLeftBold />
          </button>
          <button
            type="button"
            aria-label="Next month"
            title="Next month"
            onClick={() => navigate(1)}
            className={navigationClassName}
          >
            <PiCaretRightBold />
          </button>
          <button
            type="button"
            aria-label="Next year"
            title="Next year"
            onClick={() => navigate(12)}
            className={navigationClassName}
          >
            <PiCaretDoubleRightBold />
          </button>
        </div>
      </div>

      <div className="flex-1 w-full flex flex-col">
        <div className="flex">
          {weekdays.map((day) => (
            <div
              key={day}
              className="
                pb-3 w-1/7 text-xs font-medium text-zinc-500
                dark:text-zinc-400
              "
            >
              <abbr title={day} className="no-underline">
                {day.slice(0, 3)}
              </abbr>
            </div>
          ))}
        </div>

        <div
          role="region"
          aria-label="Monthly calendar days"
          aria-describedby={`${headingId}-scroll-hint`}
          tabIndex={0}
          className="
            min-w-0 min-h-0 flex-1
            grid overflow-x-auto rounded-lg
            focus-visible:outline-2 focus-visible:outline-blue-600
          "
          style={{
            gridTemplateRows: `repeat(${weekCount}, minmax(0, 1fr))`
          }}
        >
          {Array.from({ length: weekCount }, (_, week) => (
            <div key={week} className="w-full grid grid-cols-7">
              {weekdays.map((day, weekday) => {
                const date = week * 7 + weekday - firstWeekday + 1;
                const isCurrentDate = date === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                const isCurrentMonth = date >= 1 && date <= daysInMonth;
                const dateKey = `${String(year).padStart(4, "0")}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
                const backgroundColor = isCurrentMonth ? getPayPeriodColor(dateKey, payPeriods) : undefined;
                const dayBills = isCurrentMonth ? getBillsForDate(dateKey, bills) : [];

                return (
                  <div
                    key={day}
                    style={{ backgroundColor }}
                    className="h-32 sm:h-40 xl:h-auto px-1 py-2 text-sm align-top border-t border-zinc-100 dark:border-zinc-800"
                  >
                    {isCurrentMonth ? (
                      <div className="min-w-0 flex flex-col items-start gap-1">
                        <div
                          className="px-1 pb-1 w-full text-left text-xs"
                          style={{ backgroundColor: backgroundColor ?? "transparent" }}
                        >
                          <div
                            className={isCurrentDate ? `bg-red-600 text-white rounded-full size-4 flex items-center justify-center` : ""}
                          >
                            {date}
                          </div>
                        </div>

                        {dayBills.length > 0 && (
                          <ul className="h-20 sm:h-28 xl:h-10 w-full space-y-1 text-left text-[0.55rem] sm:text-xs overflow-scroll scrollbar-none">
                            {dayBills.map((bill) => (
                              <li
                                key={bill.id}
                                className="rounded bg-white/70 p-1 text-zinc-900 dark:bg-zinc-950/80 dark:text-zinc-100"
                              >
                                <span className="block wrap-anywhere">
                                  {bill.name}
                                </span>
                                <span className="block wrap-anywhere font-medium">
                                  {dollarFormatter.format(bill.cost)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
