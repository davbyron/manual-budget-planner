"use client";

import type { CalendarCashFlowTooltipProps } from "@/types/props";
import CashFlowAmount from "@/components/CashFlowAmount";
import Tooltip from "@/components/Tooltip";

export default function CalendarCashFlowTooltip(props: CalendarCashFlowTooltipProps) {
  const { dateLabel, cashFlow } = props;
  const { bills, expenses, incomeSources, gainsInCents, lossesInCents } = cashFlow;
  const sections = [
    { label: "Bills", entries: bills },
    { label: "Expenses", entries: expenses },
    { label: "Income Sources", entries: incomeSources },
  ];

  return (
    <Tooltip
      role="tooltip"
      triggerClassName="
        w-full min-h-0! flex flex-col gap-0.5 text-left text-[0.45rem] sm:text-xs
        focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600
      "
      className="
        w-72 max-w-[calc(100vw-1.5rem)] text-zinc-900 bg-white rounded-lg ring-1 ring-zinc-200
        [--calendar-tooltip-fill:var(--color-white)]
        dark:text-zinc-100 dark:bg-zinc-950 dark:ring-zinc-800
        dark:[--calendar-tooltip-fill:var(--color-zinc-950)]
      "
      arrowFill="var(--calendar-tooltip-fill)"
      trigger={
        <>
          <span className="sr-only">{dateLabel}</span>
          {gainsInCents > 0 && (
            <span className="px-0.5 w-full rounded bg-white/90 dark:bg-zinc-950/90">
              <CashFlowAmount amountInCents={gainsInCents} stackOnSmallScreens />
            </span>
          )}
          {lossesInCents < 0 && (
            <span className="px-0.5 w-full rounded bg-white/90 dark:bg-zinc-950/90">
              <CashFlowAmount amountInCents={lossesInCents} stackOnSmallScreens />
            </span>
          )}
        </>
      }
    >
      <div className="max-h-[55dvh] flex flex-col gap-3 min-w-0 w-full overflow-y-auto">
        <h4>{dateLabel}</h4>

        <div className="flex flex-col gap-2">
          {sections.filter(({ entries }) => entries.length > 0).map(({ label, entries }) => (
            <div key={label}>
              <h5 className="font-semibold mb-1">{label}</h5>
              <ul className="">
                {entries.map(({ id, name, amountInCents }) => (
                  <li key={id} className="flex justify-between gap-3">
                    <span className="min-w-0 wrap-anywhere">{name}</span>
                    <span className="shrink-0 text-right">
                      {amountInCents === null ? "Amount pending" : (
                        <CashFlowAmount amountInCents={amountInCents} />
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-2 flex justify-between gap-3 font-semibold border-t border-zinc-200 dark:border-zinc-800">
          <span>Net</span>
          <CashFlowAmount amountInCents={gainsInCents + lossesInCents} />
        </div>
      </div>
    </Tooltip>
  );
}
