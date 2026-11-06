import Bills from "@/components/Bills";
import Calendar from "@/components/Calendar";

export default function Home() {
  return (
    <main className="flex flex-1 w-full gap-6 items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
      <Calendar />
      <Bills />
    </main>
  );
}
