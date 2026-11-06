import Bills from "@/components/Bills";
import PayPeriods from "@/components/PayPeriods";
import Calendar from "@/components/Calendar";

export default function Home() {
  return (
    <main className="grid flex-1 w-full min-w-0 grid-cols-1 gap-6 items-start py-8 px-4 sm:px-6 xl:grid-cols-3 bg-white dark:bg-black sm:items-start">
      <Calendar />
      <Bills />
      <PayPeriods />
    </main>
  );
}
