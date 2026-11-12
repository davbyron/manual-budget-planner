"use server";

import { getPlannerDatabase } from "@/lib/supabase/admin";
import { validateIncomeSource } from "@/lib/utils/income-sources";
import type { IncomeSource, IncomeSourceDraft, IncomeSourceResult } from "@/types";

const columns = "id, name, amount";

export async function getIncomeSources(): Promise<IncomeSourceResult<IncomeSource[]>> {
  try {
    const { client, userId } = await getPlannerDatabase();
    const sources: IncomeSource[] = [];
    const pageSize = 500;
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await client.from("IncomeSource").select(columns).eq("user_id", userId).order("id").range(offset, offset + pageSize - 1);
      if (error) return { error: "Could not load income sources. Please try again." };
      sources.push(...data);
      if (data.length < pageSize) break;
    }
    return { data: sources };
  } catch {
    return { error: "Could not connect to the income sources database." };
  }
}

export async function saveIncomeSources(drafts: IncomeSourceDraft[], original: IncomeSource[]): Promise<IncomeSourceResult<IncomeSource[]>> {
  if (!Array.isArray(drafts) || !Array.isArray(original)) return { error: "Invalid income source list." };
  const ids = new Set<number>();
  for (const source of drafts) {
    const error = validateIncomeSource(source);
    if (error) return { error };
    if (source.id !== undefined) {
      if (!Number.isSafeInteger(source.id) || source.id < 1 || ids.has(source.id)) return { error: "Invalid or duplicate income source ID." };
      ids.add(source.id);
    }
  }
  const baselineIds = new Set<number>();
  for (const source of original) {
    if (!source || !Number.isSafeInteger(source.id) || source.id < 1 || baselineIds.has(source.id) || validateIncomeSource(source)) {
      return { error: "Invalid saved income sources. Reload before saving.", requiresReload: true };
    }
    baselineIds.add(source.id);
  }
  const current = await getIncomeSources();
  if (current.error !== undefined) return { error: current.error };
  const byId = new Map(current.data.map((source) => [source.id, source]));
  if (current.data.length !== original.length || original.some((source) => {
    const saved = byId.get(source.id);
    return !saved || saved.name !== source.name || saved.amount !== source.amount;
  })) return { error: "Income sources changed since this form loaded. Reload before saving.", requiresReload: true };
  if (drafts.some((source) => source.id !== undefined && !byId.has(source.id))) {
    return { error: "An income source no longer exists. Reload before saving.", requiresReload: true };
  }
  const interrupted: IncomeSourceResult<IncomeSource[]> = {
    error: "The save could not be completed. Some changes may have been saved. Reload income sources before trying again.", requiresReload: true,
  };
  try {
    const { client, userId } = await getPlannerDatabase();
    for (const source of drafts) {
      if (source.id === undefined) continue;
      const saved = byId.get(source.id)!;
      if (saved.name === source.name.trim() && saved.amount === source.amount) continue;
      const { error } = await client.from("IncomeSource")
        .update({ name: source.name.trim(), amount: source.amount, updated_at: new Date().toISOString() }).eq("user_id", userId)
        .eq("id", source.id).select("id").single();
      if (error) return interrupted;
    }
    const removed = current.data.filter((source) => !ids.has(source.id)).map((source) => source.id);
    for (let offset = 0; offset < removed.length; offset += 100) {
      const batch = removed.slice(offset, offset + 100);
      const { data, error } = await client.from("IncomeSource").delete().eq("user_id", userId).in("id", batch).select("id");
      if (error?.code === "23503") return {
        error: "An income source is still linked to a pay period and cannot be deleted. Some edits may have been saved; reload income sources.", requiresReload: true,
      };
      if (error || data.length !== batch.length) return interrupted;
    }
    const added = drafts.filter((source) => source.id === undefined).map((source) => ({ user_id: userId, name: source.name.trim(), amount: source.amount }));
    if (added.length) {
      const { error } = await client.from("IncomeSource").insert(added);
      if (error) return interrupted;
    }
    const refreshed = await getIncomeSources();
    return refreshed.error !== undefined ? interrupted : refreshed;
  } catch {
    return interrupted;
  }
}
