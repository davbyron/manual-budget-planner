"use client";

import { useId } from "react";
import PayPeriodForm from "@/components/PayPeriodForm";
import type { PayPeriodAccordionProps } from "@/types/props";

export default function PayPeriodAccordion({ period, open, onToggle, onSaved }: PayPeriodAccordionProps) {
  const id = useId();
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800">
      <h3>
        <button id={`${id}-trigger`} type="button" aria-expanded={open} aria-controls={`${id}-panel`} onClick={onToggle}
          className="flex w-full items-center justify-between gap-3 rounded-xl p-4 text-left font-medium hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-blue-600 dark:hover:bg-zinc-900">
          <span>{period.start_date} – {period.end_date}<span className="mt-1 block text-xs font-normal text-zinc-500 dark:text-zinc-400">{period.expenses.length} {period.expenses.length === 1 ? "expense" : "expenses"}</span></span>
          <span aria-hidden="true">{open ? "−" : "+"}</span>
        </button>
      </h3>
      <div id={`${id}-panel`} role="region" aria-labelledby={`${id}-trigger`} hidden={!open} className="border-t border-zinc-200 p-4 dark:border-zinc-800">
        <PayPeriodForm period={period} onSaved={onSaved} />
      </div>
    </div>
  );
}
