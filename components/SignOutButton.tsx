"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function SignOutButton() {
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);

    try {
      const { error } = await authClient.signOut();
      if (!error) {
        window.location.replace("/sign-in");
        return;
      }
    } catch {
      // The user can retry from the planner.
    }

    setPending(false);
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={pending}
      className="
        px-2 sm:px-4 text-xs sm:text-sm text-white font-semibold border-2 border-white rounded-lg transition-colors
        hover:bg-white hover:text-black
        active:brightness-90
        disabled:opacity-50 disabled:cursor-not-allowed
      "
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
