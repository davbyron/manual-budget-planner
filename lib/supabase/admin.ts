import type { Database } from "@/types/database.types";
import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getVerifiedSession } from "@/lib/utils/get-verified-session";

export async function getPlannerDatabase() {
  const session = await getVerifiedSession();
  if (!session) {
    throw new Error("Sign in with a verified email to access the planner.");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error("Supabase server credentials are not configured.");
  }

  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  return { client, userId: session.user.id };
}
