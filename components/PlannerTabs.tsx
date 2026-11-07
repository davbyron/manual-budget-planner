"use client";

import { useId, useState } from "react";
import Bills from "@/components/Bills";
import IncomeSources from "@/components/IncomeSources";
import PayPeriods from "@/components/PayPeriods";
import type { PlannerTabsProps } from "@/types/props";

const tabs = [
  { id: "pay-periods", label: "Pay Periods" },
  { id: "bills", label: "Bills" },
  { id: "income-sources", label: "Income Sources" },
];

export default function PlannerTabs({ periods, onPeriodsChange }: PlannerTabsProps) {
  const id = useId();
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="min-w-0 space-y-3">
      <div role="tablist" aria-label="Financial planner sections" className="flex flex-wrap gap-1 rounded-xl border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-900">
        {tabs.map((tab, index) => (
          <button key={tab.id} id={`${id}-${tab.id}-tab`} type="button" role="tab"
            aria-selected={activeTab === index} aria-controls={`${id}-${tab.id}-panel`} tabIndex={activeTab === index ? 0 : -1}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${activeTab === index ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100" : "text-zinc-600 hover:bg-white/60 dark:text-zinc-400 dark:hover:bg-zinc-800/60"}`}
            onClick={() => setActiveTab(index)}
            onKeyDown={(event) => {
              let next = index;
              if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
              else if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = tabs.length - 1;
              else return;
              event.preventDefault();
              setActiveTab(next);
              event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
            }}>
            {tab.label}
          </button>
        ))}
      </div>
      {/* Keep panels mounted so switching tabs preserves drafts and accordion state. */}
      <div id={`${id}-pay-periods-panel`} role="tabpanel" aria-labelledby={`${id}-pay-periods-tab`} hidden={activeTab !== 0} tabIndex={0}>
        <PayPeriods periods={periods} onPeriodsChange={onPeriodsChange} />
      </div>
      <div id={`${id}-bills-panel`} role="tabpanel" aria-labelledby={`${id}-bills-tab`} hidden={activeTab !== 1} tabIndex={0}>
        <Bills />
      </div>
      <div id={`${id}-income-sources-panel`} role="tabpanel" aria-labelledby={`${id}-income-sources-tab`} hidden={activeTab !== 2} tabIndex={0}>
        <IncomeSources />
      </div>
    </div>
  );
}
