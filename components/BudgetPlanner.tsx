"use client";

import type { Bill, PayPeriodWithExpenses } from "@/types";
import { useState } from "react";
import Calendar from "@/components/Calendar";
import PlannerTabs from "@/components/PlannerTabs";

export default function BudgetPlanner() {
  const [bills, setBills] = useState<Bill[] | null>(null);
  const [payPeriods, setPayPeriods] = useState<PayPeriodWithExpenses[]>([]);
  return (
    <main
      className="
        p-3 w-full min-w-0 max-w-[120rem]
        flex flex-col gap-6
        sm:p-6
        lg:p-8
        xl:min-h-0 xl:flex-row xl:flex-1 xl:items-stretch
      "
    >
      <PlannerTabs
        periods={payPeriods}
        onPeriodsChange={setPayPeriods}
        bills={bills}
        onBillsChange={setBills}
      />
      <Calendar payPeriods={payPeriods} bills={bills ?? []} />
    </main>
  );
}
