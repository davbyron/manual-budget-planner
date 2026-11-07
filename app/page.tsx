"use client";

import { useState } from "react";
import type { PayPeriodWithExpenses } from "@/types";
import IncomeSources from "@/components/IncomeSources";
import Bills from "@/components/Bills";
import PayPeriods from "@/components/PayPeriods";
import Calendar from "@/components/Calendar";

export default function Home() {
  const [payPeriods, setPayPeriods] = useState<PayPeriodWithExpenses[]>([]);
  return (
    <main className="grid flex-1 w-full min-w-0 grid-cols-1 gap-6 items-start py-8 px-4 sm:px-6 xl:grid-cols-3 bg-white dark:bg-black sm:items-start">
      <div className="min-w-0 space-y-6">
        <IncomeSources />
        <Calendar payPeriods={payPeriods} />
      </div>
      <Bills />
      <PayPeriods periods={payPeriods} onPeriodsChange={setPayPeriods} />
    </main>
  );
}
