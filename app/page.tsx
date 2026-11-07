"use client";

import type { Bill, PayPeriodWithExpenses } from "@/types";
import { useState } from "react";
import Calendar from "@/components/Calendar";
import PlannerTabs from "@/components/PlannerTabs";

export default function Home() {
  const [bills, setBills] = useState<Bill[] | null>(null);
  const [payPeriods, setPayPeriods] = useState<PayPeriodWithExpenses[]>([]);
  return (
    <main className="w-full flex gap-6">
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
