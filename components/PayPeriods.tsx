"use client";

import type { PayPeriodsProps } from "@/types/props";
import type { PayPeriodLeftover, PayPeriodWithExpenses } from "@/types";
import { useEffect, useState, useTransition } from "react";
import { getPayPeriods } from "@/lib/actions/pay-periods";
import { applyPayPeriodLeftovers } from "@/lib/utils/pay-periods";
import PayPeriodAccordion from "@/components/PayPeriodAccordion";
import PayPeriodForm from "@/components/PayPeriodForm";
import HelpTooltip from "@/components/HelpTooltip";

const buttonClass = "rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800";

export default function PayPeriods(props: PayPeriodsProps) {
  const { periods, onPeriodsChange } = props;

  const [openIds, setOpenIds] = useState<Set<number>>(() => new Set());
  const [creating, setCreating] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [pending, startTransition] = useTransition();
  const allOpen = periods.length > 0 && periods.every((period) => openIds.has(period.id));

  useEffect(() => {
    let active = true;
    startTransition(async () => {
      try {
        const result = await getPayPeriods();
        if (!active) return;
        if (result.error !== undefined) setError(result.error);
        else { onPeriodsChange(result.data); setLoaded(true); setError(null); }
      } catch {
        if (active) setError("Could not load pay periods. Please try again.");
      }
    });
    return () => { active = false; };
  }, [attempt, onPeriodsChange]);

  function saved(period: PayPeriodWithExpenses, leftovers: PayPeriodLeftover[] = []) {
    onPeriodsChange((current) => {
      const next = current.some((item) => item.id === period.id)
        ? current.map((item) => item.id === period.id ? period : item)
        : [...current, period];
      return applyPayPeriodLeftovers(next, leftovers).sort((a, b) => b.start_date.localeCompare(a.start_date) || b.id - a.id);
    });
  }

  return (
    <section
      className="
        p-4 w-full h-full min-w-0 flex flex-col gap-4 text-zinc-900
        bg-white rounded-b-2xl border border-zinc-200 shadow-sm
        sm:p-6 sm:rounded-none
        dark:text-zinc-100 dark:bg-zinc-950 dark:border-zinc-800
      "
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2>Pay Periods & Expenses</h2>
          <HelpTooltip>
            <div className="flex flex-col gap-3">
              <p>
                <b>Pay periods</b> are ranges of dates in which
                you plan to receive some amount of income.
                List regularly occurring income in the
                {" "}<b>Income Sources</b>{" "}
                tab. For one-time or irregular payments,
                add a negative expense to the pay period.
              </p>
              <p>
                In each pay period, you can see how much you start with,
                list <b>expenses</b>, and see how much you have
                remaining. The remaining balance is calculated
                with the following equation. Note that each pay
                period compounds onto the next.
              </p>
              <p className="max-w-4/5 self-center text-center italic font-serif">
                Remaining Balance = SUM(Income Sources)
                - SUM(Bills during pay period)
                - SUM(Expenses listed for pay period)
                + Remaining Balance from previous pay period
              </p>
            </div>
          </HelpTooltip>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCreating(true)}
            className={buttonClass}
            disabled={creating}
          >
            + New pay period
          </button>
          <button
            type="button"
            disabled={!periods.length}
            className={buttonClass}
            onClick={() => setOpenIds(allOpen ? new Set() : new Set(periods.map((period) => period.id)))}
          >
              {allOpen ? "Close all" : "Open all"}
          </button>
        </div>
      </div>

      {!loaded && !error && <p role="status">Loading pay periods…</p>}

      {error && (
        <div
          role="alert"
          className="mb-4 text-sm text-red-600 dark:text-red-400"
        >
          {error}
          <button
            type="button"
            disabled={pending}
            className={buttonClass}
            onClick={() => setAttempt((value) => value + 1)}
          >
            Retry
          </button>
        </div>
      )}

      {loaded && (
        <>
          {creating ? (
            <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
              <h3 className="mb-3">New pay period</h3>
              <PayPeriodForm onCancel={() => setCreating(false)} onReload={() => { setCreating(false); setAttempt((value) => value + 1); }} onSaved={(period, leftovers) => {
                saved(period, leftovers);
                setOpenIds((current) => new Set(current).add(period.id));
                setCreating(false);
              }} />
            </div>
          ) : null }

          <div id="accordion-container" className="min-h-0 flex-1 overflow-y-auto">
            {periods.map((period) => (
              <PayPeriodAccordion
                key={period.id}
                remainingBalance={period.leftover}
                payPeriod={period}
                open={openIds.has(period.id)}
                onSaved={saved}
                onToggle={() => setOpenIds((current) => {
                  const next = new Set(current);
                  if (next.has(period.id)) next.delete(period.id); else next.add(period.id);
                  return next;
                })}
              />
            ))}
          </div>

          {periods.length === 0 && (
            <p className="py-3 text-sm text-zinc-500 italic dark:text-zinc-400">
              No pay periods.
            </p>
          )}
        </>
      )}
    </section>
  );
}
