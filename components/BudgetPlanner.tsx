"use client";

import type { Bill, IncomeSource, PayPeriodWithExpenses } from "@/types";
import { useState } from "react";
import Calendar from "@/components/Calendar";
import PlannerTabs from "@/components/PlannerTabs";

export default function BudgetPlanner() {
  const [bills, setBills] = useState<Bill[] | null>(null);
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [payPeriods, setPayPeriods] = useState<PayPeriodWithExpenses[]>([]);
  return (
    <main
      className="
        mx-auto p-3 w-full min-w-0 max-w-[120rem]
        flex flex-col gap-3
        xl:min-h-0 xl:flex-row xl:flex-1 xl:items-stretch
      "
    >
      <PlannerTabs
        bills={bills ?? []}
        periods={payPeriods}
        onPeriodsChange={setPayPeriods}
        onBillsChange={setBills}
        onIncomeSourcesChange={setIncomeSources}
      />
      <Calendar bills={bills ?? []} incomeSources={incomeSources} payPeriods={payPeriods} />
    </main>
  );
}
