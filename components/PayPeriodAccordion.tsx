"use client";

import type { PayPeriodAccordionProps } from "@/types/props";
import { useId } from "react";
import PayPeriodForm from "@/components/PayPeriodForm";
import formatDate from "@/lib/utils/formatDate";

const dollars = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function PayPeriodAccordion(props: PayPeriodAccordionProps) {
  const {
    bills,
    remainingBalance,
    payPeriod,
    open,
    onToggle,
    onSaved
  } = props;

  const id = useId();

  return (
    <div
      className="border"
      style={{ borderColor: payPeriod.color }}
    >
      <h3 className="sticky top-0 z-10">
        <button
          id={`${id}-trigger`}
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={onToggle}
          className="
            p-2 w-full min-h-0! flex items-center justify-between gap-3
            text-left font-medium
            hover:bg-zinc-50
            dark:hover:bg-zinc-900
          "
          style={{
            background: `radial-gradient(circle at left, ${payPeriod.color}, white)`
          }}
        >
          <div className="flex min-w-0 flex-col items-start sm:flex-row sm:items-center gap-2 sm:gap-3">
            <span>
              {formatDate(payPeriod.start_date)} - {formatDate(payPeriod.end_date)}
            </span>
            <span className="text-xs text-center bg-white/75 py-0.5 px-2.5 rounded-full text-zinc-500 dark:text-zinc-400">
              {remainingBalance === null ? "Loading remaining balance…" : `${dollars.format(remainingBalance)} remaining`}
            </span>
          </div>

          <span aria-hidden="true" className="shrink-0">
            {open ? "-" : "+"}
          </span>
        </button>
      </h3>
      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-trigger`}
        hidden={!open}
        className="border-t p-3 sm:p-4 flex flex-col gap-2"
        style={{ borderColor: payPeriod.color }}
      >
        <h4>Options</h4>
        <PayPeriodForm bills={bills} payPeriod={payPeriod} onSaved={onSaved} />
      </div>
    </div>
  );
}
