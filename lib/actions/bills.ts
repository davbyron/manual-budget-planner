"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { validateBill } from "@/lib/utils/bills";
import type { Bill, BillDraft, BillInput, BillResult, BillSaveResult } from "@/types";

const columns = "id, day, name, cost";

// This personal app is local-only. The admin client bypasses RLS;
// add authorization here before exposing these actions on a hosted app.
export async function getBills(): Promise<BillResult<Bill[]>> {
  try {
    const client = createAdminClient();
    const bills: Bill[] = [];
    const pageSize = 500;
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await client.from("Bill").select(columns)
        .order("id").range(offset, offset + pageSize - 1);
      if (error) return { error: "Could not load bills. Please try again." };
      bills.push(...data);
      if (data.length < pageSize) break;
    }
    return { data: bills.sort((a, b) => (a.day ?? 32) - (b.day ?? 32) || a.id - b.id) };
  } catch {
    return { error: "Could not connect to the bills database." };
  }
}

export async function createBill(input: BillInput): Promise<BillResult<Bill>> {
  const validationError = validateBill(input);
  if (validationError) return { error: validationError };
  try {
    const { data, error } = await createAdminClient().from("Bill")
      .insert({ day: input.day, name: input.name.trim(), cost: input.cost })
      .select(columns).single();
    if (error) return { error: "Could not add the bill. Please try again." };
    return { data };
  } catch {
    return { error: "Could not connect to the bills database." };
  }
}

export async function updateBill(id: number, input: BillInput): Promise<BillResult<Bill>> {
  if (!Number.isSafeInteger(id) || id < 1) return { error: "Invalid bill ID." };
  const validationError = validateBill(input);
  if (validationError) return { error: validationError };
  try {
    const { data, error } = await createAdminClient().from("Bill")
      .update({ day: input.day, name: input.name.trim(), cost: input.cost, updated_at: new Date().toISOString() })
      .eq("id", id).select(columns).single();
    if (error) return { error: "Could not save the bill. It may have been removed." };
    return { data };
  } catch {
    return { error: "Could not connect to the bills database." };
  }
}

export async function deleteBill(id: number): Promise<BillResult<number>> {
  if (!Number.isSafeInteger(id) || id < 1) return { error: "Invalid bill ID." };
  try {
    const { data, error } = await createAdminClient().from("Bill")
      .delete().eq("id", id).select("id").single();
    if (error) return { error: "Could not delete the bill. It may have been removed." };
    return { data: data.id };
  } catch {
    return { error: "Could not connect to the bills database." };
  }
}

export async function saveBills(drafts: BillDraft[], original: Bill[]): Promise<BillSaveResult> {
  // Validate the complete form before any database writes.
  if (!Array.isArray(drafts) || !Array.isArray(original)) return { error: "Invalid bill list." };
  const seen = new Set<number>();
  for (const draft of drafts) {
    const error = validateBill(draft);
    if (error) return { error };
    if (draft.id !== undefined) {
      if (!Number.isSafeInteger(draft.id) || draft.id < 1 || seen.has(draft.id)) {
        return { error: "Invalid or duplicate bill ID." };
      }
      seen.add(draft.id);
    }
  }
  const originalIds = new Set<number>();
  for (const bill of original) {
    if (!bill || !Number.isSafeInteger(bill.id) || bill.id < 1 || originalIds.has(bill.id) || validateBill(bill)) {
      return { error: "Invalid saved bill snapshot. Reload the bills.", requiresReload: true };
    }
    originalIds.add(bill.id);
  }

  const current = await getBills();
  if (current.error !== undefined) return { error: current.error };
  const currentById = new Map(current.data.map((bill) => [bill.id, bill]));
  if (current.data.length !== original.length || original.some((bill) => {
    const saved = currentById.get(bill.id);
    return !saved || saved.day !== bill.day || saved.name !== bill.name || saved.cost !== bill.cost;
  })) {
    return { error: "Bills changed since this form was loaded. Reload saved bills before saving.", requiresReload: true };
  }
  if (drafts.some((bill) => bill.id !== undefined && !currentById.has(bill.id))) {
    return { error: "A bill no longer exists. Reload saved bills before saving.", requiresReload: true };
  }

  const interrupted: BillSaveResult = {
    error: "The save could not be completed. Some changes may have been saved. Reload saved bills before trying again.",
    requiresReload: true,
  };
  try {
    const client = createAdminClient();
    // Keep existing IDs and unrelated columns. Only write edited rows.
    for (const draft of drafts) {
      if (draft.id === undefined) continue;
      const saved = currentById.get(draft.id)!;
      const name = draft.name.trim();
      if (saved.day === draft.day && saved.name === name && saved.cost === draft.cost) continue;
      const { error } = await client.from("Bill")
        .update({ day: draft.day, name, cost: draft.cost, updated_at: new Date().toISOString() })
        .eq("id", draft.id).select("id").single();
      if (error) return interrupted;
    }

    // Delete only IDs in the loaded snapshot, never an unfiltered table delete.
    const removed = current.data.filter((bill) => !seen.has(bill.id)).map((bill) => bill.id);
    for (let offset = 0; offset < removed.length; offset += 100) {
      const ids = removed.slice(offset, offset + 100);
      const { data, error } = await client.from("Bill").delete().in("id", ids).select("id");
      if (error || data.length !== ids.length) return interrupted;
    }

    const added = drafts.filter((bill) => bill.id === undefined)
      .map((bill) => ({ day: bill.day, name: bill.name.trim(), cost: bill.cost }));
    if (added.length) {
      const { error } = await client.from("Bill").insert(added);
      if (error) return interrupted;
    }

    // Refresh IDs assigned to new rows and make the saved list the new baseline.
    const refreshed = await getBills();
    if (refreshed.error !== undefined) return interrupted;
    return refreshed;
  } catch {
    return interrupted;
  }
}