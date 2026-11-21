"use server";

import type { Expense, PayPeriod, PayPeriodFormValues, PayPeriodInput, PayPeriodResult, PayPeriodSaveResult, PayPeriodWithExpenses, PlannerExpenseDraft, VariableBillExpenseDraft } from "@/types";
import type { PoolClient } from "pg";
import { getPlannerDatabase } from "@/lib/supabase/admin";
import { readPlannerBills, refreshPayPeriodLeftovers, withPlannerBalanceTransaction } from "@/lib/supabase/planner-balances";
import { getToday } from "@/lib/utils/dates";
import { getBillOccurrenceKey, getBillOccurrences, payPeriodMatches, validateExpense, validatePayPeriod } from "@/lib/utils/pay-periods";

const periodColumns = "id, start_date, end_date, color, leftover";
const expenseColumns = "id, date, name, cost, pay_period_id, bill_id, bill_due_date";
const pageSize = 500;

export async function getPayPeriods(): Promise<PayPeriodResult<PayPeriodWithExpenses[]>> {
  try {
    const { client, userId } = await getPlannerDatabase();
    const periods: PayPeriod[] = [];
    const expenses: Expense[] = [];
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await client.from("PayPeriod").select(periodColumns).eq("user_id", userId).order("id").range(offset, offset + pageSize - 1);
      if (error) return { error: "Could not load pay periods. Please try again." };
      periods.push(...data);
      if (data.length < pageSize) break;
    }
    for (let offset = 0; periods.length; offset += pageSize) {
      const { data, error } = await client.from("Expense").select(expenseColumns).eq("user_id", userId).not("pay_period_id", "is", null).order("id").range(offset, offset + pageSize - 1);
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
    const { client, userId } = await getPlannerDatabase();
    const { data: period, error } = await client.from("PayPeriod").select(periodColumns).eq("user_id", userId).eq("id", id).single();
    if (error) return { error: "Could not load this pay period. It may have been removed." };
    const expenses: Expense[] = [];
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await client.from("Expense").select(expenseColumns).eq("user_id", userId).eq("pay_period_id", id).order("date").order("id").range(offset, offset + pageSize - 1);
      if (error) return { error: "Could not load expenses. Please try again." };
      expenses.push(...data);
      if (data.length < pageSize) break;
    }
    return { data: { ...period, expenses } };
  } catch {
    return { error: "Could not connect to the pay periods database." };
  }
}

async function readPeriodExpenses(db: PoolClient, userId: string, id: number) {
  const { rows } = await db.query<Expense>(`
    select id::float8, date::text, name, cost::float8, pay_period_id::float8,
      bill_id::float8, bill_due_date::text
    from public."Expense"
    where user_id = $1 and pay_period_id = $2
    order by date, id
  `, [userId, id]);
  return rows;
}

async function finishPayPeriodSave(db: PoolClient, userId: string, period: PayPeriod, today: string) {
  const leftovers = await refreshPayPeriodLeftovers(db, userId, today, { editedPeriodId: period.id });
  const saved = leftovers.find((item) => item.id === period.id);
  if (!saved) throw new Error("Could not calculate the pay period balance.");
  const expenses = await readPeriodExpenses(db, userId, period.id);
  return { data: { ...period, leftover: saved.leftover, expenses }, leftovers };
}

async function prepareVariableExpenses(
  db: PoolClient,
  userId: string,
  input: PayPeriodInput,
  entries: Record<string, VariableBillExpenseDraft> | undefined,
  current: Expense[],
): Promise<PayPeriodResult<PlannerExpenseDraft[]>> {
  if (entries !== undefined && (!entries || typeof entries !== "object" || Array.isArray(entries))) {
    return { error: "Invalid variable bill amounts." };
  }

  const bills = await readPlannerBills(db, userId);
  const occurrences = new Map(getBillOccurrences(
    bills.filter((bill) => bill.isCostVariable), input.start_date, input.end_date,
  ).map((occurrence) => [occurrence.key, occurrence]));
  const saved = new Map(
    current.flatMap((expense) => expense.bill_id === null || expense.bill_due_date === null ? [] :
      [[getBillOccurrenceKey(expense.bill_id, expense.bill_due_date), expense] as const]),
  );

  const expenses: PlannerExpenseDraft[] = [];
  for (const [key, entry] of Object.entries(entries ?? {})) {
    const occurrence = occurrences.get(key);
    if (!occurrence) {
      return { error: "The variable bill schedule changed. Reload the planner before saving.", requiresReload: true };
    }
    const { bill, dueDate } = occurrence;
    const expense = {
      id: saved.get(key)?.id,
      bill_id: bill.id,
      bill_due_date: dueDate,
      name: bill.name,
      date: entry?.date,
      cost: entry?.cost,
    };
    const error = validateExpense(expense);
    if (error) return { error };
    expenses.push(expense);
    saved.delete(key);
  }

  for (const [key, expense] of saved) {
    if (occurrences.has(key)) expenses.push(expense);
  }
  return { data: expenses };
}

async function insertExpense(db: PoolClient, userId: string, periodId: number, expense: PlannerExpenseDraft) {
  await db.query(`
    insert into public."Expense" (user_id, pay_period_id, date, name, cost, bill_id, bill_due_date)
    values ($1, $2, $3, $4, $5, $6, $7)
  `, [userId, periodId, expense.date, expense.name, expense.cost, expense.bill_id, expense.bill_due_date]);
}

const periodSqlColumns = "id::float8, start_date::text, end_date::text, color, leftover::float8";

export async function createPayPeriod(
  input: PayPeriodInput & Partial<Pick<PayPeriodFormValues, "variableBills">>,
  timeZone = "UTC",
): Promise<PayPeriodSaveResult> {
  const validationError = validatePayPeriod(input);
  if (validationError) return { error: validationError };
  try {
    const today = getToday(timeZone);
    const { userId } = await getPlannerDatabase();
    return await withPlannerBalanceTransaction(async (db) => {
      const variable = await prepareVariableExpenses(db, userId, input, input.variableBills, []);
      if (variable.error !== undefined) return variable;

      const { rows: [period] } = await db.query<PayPeriod>(`
        insert into public."PayPeriod" (user_id, start_date, end_date, color, leftover)
        values ($1, $2, $3, $4, 0)
        returning ${periodSqlColumns}
      `, [userId, input.start_date, input.end_date, input.color]);

      for (const expense of variable.data) {
        if (expense.cost !== 0 || expense.date !== expense.bill_due_date) {
          await insertExpense(db, userId, period.id, expense);
        }
      }
      return finishPayPeriodSave(db, userId, period, today);
    });
  } catch {
    return { error: "Could not confirm the new pay period. Reload pay periods before trying again.", requiresReload: true };
  }
}

export async function savePayPeriod(
  id: number,
  input: PayPeriodFormValues,
  original: PayPeriodWithExpenses,
  timeZone = "UTC",
): Promise<PayPeriodSaveResult> {
  if (!Number.isSafeInteger(id) || id < 1 || !original || original.id !== id) return { error: "Invalid pay period ID." };
  const validationError = validatePayPeriod(input);
  if (validationError) return { error: validationError };
  if (!Array.isArray(input.expenses) || !Array.isArray(original.expenses)) return { error: "Invalid expense list." };

  const ids = new Set<number>();
  for (const expense of input.expenses) {
    const error = validateExpense(expense);
    if (error) return { error };
    if (expense.id !== undefined) {
      if (!Number.isSafeInteger(expense.id) || expense.id < 1 || ids.has(expense.id)) {
        return { error: "Invalid or duplicate expense ID." };
      }
      ids.add(expense.id);
    }
  }
  const originalIds = new Set<number>();
  for (const expense of original.expenses) {
    if (!expense || !Number.isSafeInteger(expense.id) || originalIds.has(expense.id) ||
        expense.pay_period_id !== id || validateExpense(expense)) {
      return { error: "Invalid saved expenses. Reload this pay period.", requiresReload: true };
    }
    originalIds.add(expense.id);
  }

  try {
    const today = getToday(timeZone);
    const { userId } = await getPlannerDatabase();
    return await withPlannerBalanceTransaction(async (db) => {
      const { rows: [period] } = await db.query<PayPeriod>(`
        select ${periodSqlColumns} from public."PayPeriod"
        where user_id = $1 and id = $2 for update
      `, [userId, id]);
      if (!period) return { error: "Could not load this pay period. It may have been removed.", requiresReload: true };

      const current = await readPeriodExpenses(db, userId, id);
      if (!payPeriodMatches({ ...period, expenses: current }, original)) {
        return { error: "This pay period changed. Reload it before saving.", requiresReload: true };
      }
      const byId = new Map(current.map((expense) => [expense.id, expense]));
      if ([...ids].some((expenseId) => !byId.has(expenseId))) {
        return { error: "An expense does not belong to this pay period. Reload before saving.", requiresReload: true };
      }

      const variable = await prepareVariableExpenses(db, userId, input, input.variableBills, current);
      if (variable.error !== undefined) return variable;
      if (variable.data.some((expense) => expense.id !== undefined && ids.has(expense.id))) {
        return { error: "The variable bill schedule changed. Reload the planner before saving.", requiresReload: true };
      }

      const expenses: PlannerExpenseDraft[] = input.expenses.map((expense) => {
        const saved = expense.id === undefined ? undefined : byId.get(expense.id);
        return {
          id: expense.id,
          date: expense.date,
          cost: expense.cost,
          name: saved?.bill_id != null ? saved.name : expense.name.trim(),
          bill_id: saved?.bill_id ?? null,
          bill_due_date: saved?.bill_due_date ?? null,
        };
      });
      expenses.push(...variable.data.filter((expense) => expense.cost !== 0 || expense.date !== expense.bill_due_date));

      const kept = new Set(expenses.map((expense) => expense.id));
      const removed = current.filter((expense) => !kept.has(expense.id)).map((expense) => expense.id);
      if (removed.length) {
        await db.query(`
          delete from public."Expense"
          where user_id = $1 and pay_period_id = $2 and id = any($3::bigint[])
        `, [userId, id, removed]);
      }

      for (const expense of expenses) {
        const saved = expense.id === undefined ? undefined : byId.get(expense.id);
        if (!saved) {
          await insertExpense(db, userId, id, expense);
        } else if (saved.date !== expense.date || saved.cost !== expense.cost || saved.name !== expense.name) {
          await db.query(`
            update public."Expense" set date = $4, cost = $5, name = $6, updated_at = now()
            where user_id = $1 and pay_period_id = $2 and id = $3
          `, [userId, id, expense.id, expense.date, expense.cost, expense.name]);
        }
      }

      const { start_date, end_date, color } = input;
      if (start_date !== period.start_date || end_date !== period.end_date || color !== period.color) {
        await db.query(`
          update public."PayPeriod" set start_date = $3, end_date = $4, color = $5, updated_at = now()
          where user_id = $1 and id = $2
        `, [userId, id, start_date, end_date, color]);
      }
      return finishPayPeriodSave(db, userId, { ...period, start_date, end_date, color }, today);
    });
  } catch {
    return { error: "Could not confirm the save. Reload this pay period before trying again.", requiresReload: true };
  }
}
