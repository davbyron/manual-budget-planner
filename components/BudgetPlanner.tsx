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
        p-3 mx-auto w-full min-w-0 max-w-[120rem]
        grid grid-cols-1 items-start gap-6
        sm:p-6
        lg:p-8
        xl:grid-cols-2
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
