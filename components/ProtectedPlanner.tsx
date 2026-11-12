import { redirect } from "next/navigation";
import BudgetPlanner from "@/components/BudgetPlanner";
import SignOutButton from "@/components/SignOutButton";
import { getVerifiedSession } from "@/lib/utils/get-verified-session";

export default async function ProtectedPlanner() {
  if (!(await getVerifiedSession())) redirect("/sign-in");

  return (
    <>
      <div className="absolute right-5 top-5 md:right-8.5 lg:right-10 md:top-8.5 lg:top-10">
        <SignOutButton />
      </div>
      <BudgetPlanner />
    </>
  );
}
