"use client";

import type { PayPeriodAccordionProps } from "@/types/props";
import { useId } from "react";
import PayPeriodForm from "@/components/PayPeriodForm";
import formatDate from "@/lib/utils/formatDate";

export default function PayPeriodAccordion(props: PayPeriodAccordionProps) {
  const {
    period,
    open,
    onToggle,
    onSaved
  } = props;

  const id = useId();

  return (
    <div
      className={`rounded-xl border overflow-hidden`}
      style={{ borderColor: period.color }}
    >
      <h3>
        <button
          id={`${id}-trigger`}
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={onToggle}
          className="w-full flex items-center justify-between gap-3 p-4 text-left font-medium hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-blue-600 dark:hover:bg-zinc-900"
          style={{
            background: `radial-gradient(circle at left, ${period.color}, white)`
          }}
        >
          <span>
            {formatDate(period.start_date)} - {formatDate(period.end_date)}
            <span className="mt-1 block text-xs font-normal text-zinc-500 dark:text-zinc-400">
              {period.expenses.length} {period.expenses.length === 1 ? "expense" : "expenses"}
            </span>
          </span>

          <span aria-hidden="true">
            {open ? "-" : "+"}
          </span>
        </button>
      </h3>
      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-trigger`}
        hidden={!open}
        className="border-t p-4"
        style={{ borderColor: period.color }}
      >
        <PayPeriodForm period={period} onSaved={onSaved} />
      </div>
    </div>
  );
}
