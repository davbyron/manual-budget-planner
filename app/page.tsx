import { Suspense } from "react";
import ProtectedPlanner from "@/components/ProtectedPlanner";

export default function Home() {
  return (
    <Suspense
      fallback={
        <p className="p-6 text-center" role="status">
          Loading planner...
        </p>
      }
    >
      <ProtectedPlanner />
    </Suspense>
  );
}
