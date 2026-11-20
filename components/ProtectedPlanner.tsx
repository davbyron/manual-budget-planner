import { redirect } from "next/navigation";
import BudgetPlanner from "@/components/BudgetPlanner";
import SignOutButton from "@/components/SignOutButton";
import { getVerifiedSession } from "@/lib/utils/get-verified-session";

export default async function ProtectedPlanner() {
  if (!(await getVerifiedSession())) redirect("/sign-in");

  return (
    <>
      <div
        className="
          absolute right-5 top-6
          sm:top-5
          md:top-6
        "
      >
        <SignOutButton />
      </div>
      <BudgetPlanner />
    </>
  );
}
