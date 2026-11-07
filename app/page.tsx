"use client";

import { useState } from "react";
import type { PayPeriodWithExpenses } from "@/types";
import Calendar from "@/components/Calendar";
import PlannerTabs from "@/components/PlannerTabs";

export default function Home() {
  const [payPeriods, setPayPeriods] = useState<PayPeriodWithExpenses[]>([]);
  return (
    <main className="grid flex-1 w-full min-w-0 grid-cols-1 items-start gap-6 bg-white px-4 py-8 sm:px-6 lg:grid-cols-2 dark:bg-black">
      <Calendar payPeriods={payPeriods} />
      <PlannerTabs periods={payPeriods} onPeriodsChange={setPayPeriods} />
    </main>
  );
}
