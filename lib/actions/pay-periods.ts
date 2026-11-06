"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { payPeriodMatches, validateExpense, validatePayPeriod } from "@/lib/utils/pay-periods";
import type { Expense, PayPeriod, PayPeriodFormValues, PayPeriodInput, PayPeriodResult, PayPeriodWithExpenses } from "@/types";

const periodColumns = "id, start_date, end_date";
const expenseColumns = "id, date, name, cost, pay_period_id";
const pageSize = 500;

// Local-only personal app: the server-only client uses the secret key.
export async function getPayPeriods(): Promise<PayPeriodResult<PayPeriodWithExpenses[]>> {
  try {
    const client = createAdminClient();
    const periods: PayPeriod[] = [];
    const expenses: Expense[] = [];
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await client.from("PayPeriod").select(periodColumns).order("id").range(offset, offset + pageSize - 1);
      if (error) return { error: "Could not load pay periods. Please try again." };
      periods.push(...data);
      if (data.length < pageSize) break;
    }
    for (let offset = 0; periods.length; offset += pageSize) {
      const { data, error } = await client.from("Expense").select(expenseColumns).not("pay_period_id", "is", null).order("id").range(offset, offset + pageSize - 1);
      if (error) return { error: "Could not load expenses. Please try again." };
      expenses.push(...data);
      if (data.length < pageSize) break;
    }
    const byPeriod = new Map<number, Expense[]>();
    for (const expense of expenses) {
      if (expense.pay_period_id === null) continue;
      const list = byPeriod.get(expense.pay_period_id) ?? [];
      list.push(expense);
      byPeriod.set(expense.pay_period_id, list);
    }
    return { data: periods.sort((a, b) => b.start_date.localeCompare(a.start_date) || b.id - a.id).map((period) => ({
      ...period, expenses: (byPeriod.get(period.id) ?? []).sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id),
    })) };
  } catch {
    return { error: "Could not connect to the pay periods database." };
  }
}

export async function getPayPeriod(id: number): Promise<PayPeriodResult<PayPeriodWithExpenses>> {
  if (!Number.isSafeInteger(id) || id < 1) return { error: "Invalid pay period ID." };
  try {
    const client = createAdminClient();
    const { data: period, error } = await client.from("PayPeriod").select(periodColumns).eq("id", id).single();
    if (error) return { error: "Could not load this pay period. It may have been removed." };
    const expenses: Expense[] = [];
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await client.from("Expense").select(expenseColumns).eq("pay_period_id", id).order("date").order("id").range(offset, offset + pageSize - 1);
      if (error) return { error: "Could not load expenses. Please try again." };
      expenses.push(...data);
      if (data.length < pageSize) break;
    }
    return { data: { ...period, expenses } };
  } catch {
    return { error: "Could not connect to the pay periods database." };
  }
}

export async function createPayPeriod(input: PayPeriodInput): Promise<PayPeriodResult<PayPeriodWithExpenses>> {
  const validationError = validatePayPeriod(input);
  if (validationError) return { error: validationError };
  try {
    const { data, error } = await createAdminClient().from("PayPeriod")
      .insert({ start_date: input.start_date, end_date: input.end_date }).select(periodColumns).single();
    if (error) return { error: "Could not confirm the new pay period. Reload pay periods before trying again.", requiresReload: true };
    return { data: { ...data, expenses: [] } };
  } catch {
    return { error: "Could not confirm the new pay period. Reload pay periods before trying again.", requiresReload: true };
  }
}

export async function savePayPeriod(id: number, input: PayPeriodFormValues, original: PayPeriodWithExpenses): Promise<PayPeriodResult<PayPeriodWithExpenses>> {
  if (!Number.isSafeInteger(id) || id < 1 || !original || original.id !== id) return { error: "Invalid pay period ID." };
  const validationError = validatePayPeriod(input);
  if (validationError) return { error: validationError };
  if (!Array.isArray(input.expenses) || !Array.isArray(original.expenses)) return { error: "Invalid expense list." };
  const ids = new Set<number>();
  for (const expense of input.expenses) {
    const error = validateExpense(expense);
    if (error) return { error };
    if (expense.id !== undefined) {
      if (!Number.isSafeInteger(expense.id) || expense.id < 1 || ids.has(expense.id)) return { error: "Invalid or duplicate expense ID." };
      ids.add(expense.id);
    }
  }
  const baselineIds = new Set<number>();
  for (const expense of original.expenses) {
    if (!expense || !Number.isSafeInteger(expense.id) || baselineIds.has(expense.id) || expense.pay_period_id !== id || validateExpense(expense)) {
      return { error: "Invalid saved expenses. Reload this pay period.", requiresReload: true };
    }
    baselineIds.add(expense.id);
  }
  const current = await getPayPeriod(id);
  if (current.error !== undefined) return { error: current.error };
  if (!payPeriodMatches(current.data, original)) return { error: "This pay period changed. Reload it before saving.", requiresReload: true };
  const byId = new Map(current.data.expenses.map((expense) => [expense.id, expense]));
  if (input.expenses.some((expense) => expense.id !== undefined && !byId.has(expense.id))) {
    return { error: "An expense does not belong to this pay period. Reload before saving.", requiresReload: true };
  }
  const interrupted: PayPeriodResult<PayPeriodWithExpenses> = {
    error: "The save could not be completed. Some changes may have been saved. Reload this pay period before trying again.", requiresReload: true,
  };
  try {
    const client = createAdminClient();
    if (input.start_date !== current.data.start_date || input.end_date !== current.data.end_date) {
      const { error } = await client.from("PayPeriod").update({ start_date: input.start_date, end_date: input.end_date, updated_at: new Date().toISOString() })
        .eq("id", id).select("id").single();
      if (error) return interrupted;
    }
    for (const expense of input.expenses) {
      if (expense.id === undefined) continue;
      const saved = byId.get(expense.id)!;
      if (saved.name === expense.name.trim() && saved.date === expense.date && saved.cost === expense.cost) continue;
      const { error } = await client.from("Expense").update({ date: expense.date, name: expense.name.trim(), cost: expense.cost, updated_at: new Date().toISOString() })
        .eq("id", expense.id).eq("pay_period_id", id).select("id").single();
      if (error) return interrupted;
    }
    const removed = current.data.expenses.filter((expense) => !ids.has(expense.id)).map((expense) => expense.id);
    for (let offset = 0; offset < removed.length; offset += 100) {
      const batch = removed.slice(offset, offset + 100);
      const { data, error } = await client.from("Expense").delete().eq("pay_period_id", id).in("id", batch).select("id");
      if (error || data.length !== batch.length) return interrupted;
    }
    const added = input.expenses.filter((expense) => expense.id === undefined)
      .map((expense) => ({ date: expense.date, name: expense.name.trim(), cost: expense.cost, pay_period_id: id }));
    if (added.length) {
      const { error } = await client.from("Expense").insert(added);
      if (error) return interrupted;
    }
    const refreshed = await getPayPeriod(id);
    return refreshed.error !== undefined ? interrupted : refreshed;
  } catch {
    return interrupted;
  }
}
