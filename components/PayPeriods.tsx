"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { getPayPeriods } from "@/lib/actions/pay-periods";
import PayPeriodAccordion from "@/components/PayPeriodAccordion";
import PayPeriodForm from "@/components/PayPeriodForm";
import type { PayPeriodsProps } from "@/types/props";
import type { PayPeriodWithExpenses } from "@/types";

const buttonClass = "rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800";

export default function PayPeriods({ periods, onPeriodsChange }: PayPeriodsProps) {
  const headingId = useId();
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

  function saved(period: PayPeriodWithExpenses) {
    onPeriodsChange((current) => {
      const next = current.some((item) => item.id === period.id)
        ? current.map((item) => item.id === period.id ? period : item)
        : [...current, period];
      return next.sort((a, b) => b.start_date.localeCompare(a.start_date) || b.id - a.id);
    });
  }

  return (
    <section aria-labelledby={headingId} className="w-full min-w-0 rounded-2xl border border-zinc-200 bg-white p-4 text-zinc-900 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id={headingId} className="text-xl font-semibold">Pay Periods & Expenses</h2>
        <button type="button" disabled={!periods.length} className={buttonClass} onClick={() => setOpenIds(allOpen ? new Set() : new Set(periods.map((period) => period.id)))}>{allOpen ? "Close all pay periods" : "Open all pay periods"}</button>
      </header>
      {!loaded && !error && <p role="status">Loading pay periods…</p>}
      {error && <div role="alert" className="mb-4 text-sm text-red-600 dark:text-red-400">{error} <button type="button" disabled={pending} className={buttonClass} onClick={() => setAttempt((value) => value + 1)}>Retry</button></div>}
      {loaded && <>
        {periods.length === 0 && <p className="py-3 text-sm text-zinc-500 dark:text-zinc-400">No pay periods.</p>}
        <div className="space-y-3">
          {periods.map((period) => <PayPeriodAccordion key={period.id} period={period} open={openIds.has(period.id)} onSaved={saved} onToggle={() => setOpenIds((current) => {
            const next = new Set(current);
            if (next.has(period.id)) next.delete(period.id); else next.add(period.id);
            return next;
          })} />)}
        </div>
        <div className="mt-4">
          {creating ? <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <h3 className="mb-3 font-semibold">New pay period</h3>
            <PayPeriodForm onCancel={() => setCreating(false)} onReload={() => { setCreating(false); setAttempt((value) => value + 1); }} onSaved={(period) => {
              saved(period);
              setOpenIds((current) => new Set(current).add(period.id));
              setCreating(false);
            }} />
          </div> : <button type="button" onClick={() => setCreating(true)} className={buttonClass}>+ Add new pay period</button>}
        </div>
      </>}
    </section>
  );
}
