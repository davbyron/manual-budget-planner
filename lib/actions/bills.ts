"use server";

import type { Bill, BillDraft, BillInput, BillResult, BillSaveResult } from "@/types";
import type { PoolClient } from "pg";
import { getPlannerDatabase } from "@/lib/supabase/admin";
import { billSqlColumns, readPlannerBills, refreshPayPeriodLeftovers } from "@/lib/supabase/planner-balances";
import { databasePool } from "@/lib/supabase/pool";
import { validateBill } from "@/lib/utils/bills";
import { getToday } from "@/lib/utils/dates";

const columns = "id, day, name, cost, startDate, endDate";

async function saveBillChanges<T>(
  timeZone: string,
  change: (db: PoolClient, userId: string) => Promise<BillResult<T>>,
) {
  const { userId } = await getPlannerDatabase();
  const today = getToday(timeZone);
  const db = await databasePool.connect();
  try {
    await db.query("BEGIN ISOLATION LEVEL REPEATABLE READ");
    const result = await change(db, userId);
    if (result.error !== undefined) {
      await db.query("ROLLBACK");
      return { result, bills: [], leftovers: [] };
    }
    const bills = await readPlannerBills(db, userId);
    const leftovers = await refreshPayPeriodLeftovers(db, userId, today, { bills });
    await db.query("COMMIT");
    return { result, bills, leftovers };
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  } finally {
    db.release();
  }
}

async function writeBill(db: PoolClient, userId: string, input: BillDraft) {
  const values = [userId, input.day, input.name.trim(), input.cost, input.startDate, input.endDate];
  const { rows } = input.id === undefined
    ? await db.query<Bill>(`
        insert into public."Bill" (user_id, day, name, cost, "startDate", "endDate")
        values ($1, $2, $3, $4, $5, $6)
        returning ${billSqlColumns}
      `, values)
    : await db.query<Bill>(`
        update public."Bill"
        set day = $2, name = $3, cost = $4, "startDate" = $5, "endDate" = $6, updated_at = now()
        where user_id = $1 and id = $7
        returning ${billSqlColumns}
      `, [...values, input.id]);
  return rows[0];
}

async function removeBills(db: PoolClient, userId: string, ids: number[]) {
  const removed = await db.query(`
    delete from public."Bill" where user_id = $1 and id = any($2::bigint[])
  `, [userId, ids]);
  return removed.rowCount === ids.length;
}

function billMatches(saved: Bill, input: BillInput) {
  return saved.day === input.day && saved.name === input.name && saved.cost === input.cost &&
    saved.startDate === input.startDate && saved.endDate === input.endDate;
}

export async function getBills(): Promise<BillResult<Bill[]>> {
  try {
    const { client, userId } = await getPlannerDatabase();
    const bills: Bill[] = [];
    const pageSize = 500;
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await client.from("Bill").select(columns).eq("user_id", userId)
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

export async function createBill(input: BillInput, timeZone = "UTC"): Promise<BillResult<Bill>> {
  const validationError = validateBill(input);
  if (validationError) return { error: validationError };
  try {
    const { result } = await saveBillChanges<Bill>(timeZone, async (db, userId) => {
      const data = await writeBill(db, userId, { ...input, id: undefined });
      return data ? { data } : { error: "Could not add the bill. Please try again." };
    });
    return result;
  } catch {
    return { error: "Could not connect to the bills database." };
  }
}

export async function updateBill(id: number, input: BillInput, timeZone = "UTC"): Promise<BillResult<Bill>> {
  if (!Number.isSafeInteger(id) || id < 1) return { error: "Invalid bill ID." };
  const validationError = validateBill(input);
  if (validationError) return { error: validationError };
  try {
    const { result } = await saveBillChanges<Bill>(timeZone, async (db, userId) => {
      const data = await writeBill(db, userId, { ...input, id });
      return data ? { data } : { error: "Could not save the bill. It may have been removed." };
    });
    return result;
  } catch {
    return { error: "Could not connect to the bills database." };
  }
}

export async function deleteBill(id: number, timeZone = "UTC"): Promise<BillResult<number>> {
  if (!Number.isSafeInteger(id) || id < 1) return { error: "Invalid bill ID." };
  try {
    const { result } = await saveBillChanges<number>(timeZone, async (db, userId) => {
      const removed = await removeBills(db, userId, [id]);
      return removed ? { data: id } : { error: "Could not delete the bill. It may have been removed." };
    });
    return result;
  } catch {
    return { error: "Could not delete the bill. It may have been removed." };
  }
}

export async function saveBills(drafts: BillDraft[], original: Bill[], timeZone = "UTC"): Promise<BillSaveResult> {
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

  try {
    const { result, bills, leftovers } = await saveBillChanges<true>(timeZone, async (db, userId) => {
      const current = await readPlannerBills(db, userId);
      const currentById = new Map(current.map((bill) => [bill.id, bill]));
      if (current.length !== original.length || original.some((bill) => {
        const saved = currentById.get(bill.id);
        return !saved || !billMatches(saved, bill);
      })) {
        return { error: "Bills changed since this form was loaded. Reload saved bills before saving." };
      }
      if (drafts.some((bill) => bill.id !== undefined && !currentById.has(bill.id))) {
        return { error: "A bill no longer exists. Reload saved bills before saving." };
      }

      for (const draft of drafts) {
        const saved = draft.id === undefined ? undefined : currentById.get(draft.id);
        if (saved && billMatches(saved, { ...draft, name: draft.name.trim() })) continue;
        if (!await writeBill(db, userId, draft)) return { error: "Could not save a bill. Reload saved bills before trying again." };
      }

      const removed = current.filter((bill) => !seen.has(bill.id)).map((bill) => bill.id);
      if (removed.length && !await removeBills(db, userId, removed)) {
        return { error: "A bill was already removed. Reload saved bills before trying again." };
      }
      return { data: true };
    });
    return result.error !== undefined ? { error: result.error, requiresReload: true } : { data: bills, leftovers };
  } catch {
    return { error: "Could not confirm the save. Reload saved bills before trying again.", requiresReload: true };
  }
}
