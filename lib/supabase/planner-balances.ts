import type { Bill, IncomeSource, PayPeriodBalanceInput, PayPeriodLeftover } from "@/types";
import type { PoolClient } from "pg";
import "server-only";
import { databasePool } from "@/lib/supabase/pool";
import { getPayPeriodRemainingBalances } from "@/lib/utils/pay-periods";

export const billSqlColumns = 'id::float8 as id, day::integer as day, name, cost, "startDate"::text, "endDate"::text, "isCostVariable"';

export async function readPlannerBills(db: PoolClient, userId: string): Promise<Bill[]> {
  const { rows } = await db.query<Bill>(`
    select ${billSqlColumns}
    from public."Bill" where user_id = $1
    order by coalesce(day, 32), id
  `, [userId]);
  return rows;
}

export async function refreshPayPeriodLeftovers(
  db: PoolClient,
  userId: string,
  today: string,
  options: { bills?: Bill[]; editedPeriodId?: number } = {},
): Promise<PayPeriodLeftover[]> {
  const { bills, editedPeriodId } = options;
  const { rows: periods } = await db.query<PayPeriodBalanceInput>(`
    select period.id::float8, period.start_date::text, period.end_date::text, period.leftover,
      coalesce((
        select json_agg(json_build_object('cost', expense.cost, 'bill_id', expense.bill_id, 'bill_due_date', expense.bill_due_date))
        from public."Expense" expense
        where expense.user_id = $1 and expense.pay_period_id = period.id
          and (period.end_date >= $2 or period.id = $3)
      ), '[]'::json) as expenses
    from public."PayPeriod" period
    where period.user_id = $1
    order by period.start_date, period.id
  `, [userId, today, editedPeriodId ?? null]);
  const recalculated = periods.filter((period) => period.end_date >= today || period.id === editedPeriodId);
  if (!recalculated.length) return [];

  const savedBills = bills ?? await readPlannerBills(db, userId);
  const { rows: income } = await db.query<IncomeSource>(`
    select id, name, amount from public."IncomeSource" where user_id = $1
  `, [userId]);
  const inputs = periods.map((period) => period.id === editedPeriodId ? { ...period, leftover: undefined } : period);
  const balances = getPayPeriodRemainingBalances(inputs, savedBills, income, today);
  const leftovers: PayPeriodLeftover[] = [];
  for (const period of recalculated) {
    const leftover = balances.get(period.id);
    if (leftover === undefined || !Number.isFinite(leftover)) throw new Error("Could not calculate leftover.");
    leftovers.push({ id: period.id, leftover });
    if (leftover === period.leftover) continue;
    await db.query(`
      update public."PayPeriod" set leftover = $3, updated_at = now()
      where user_id = $1 and id = $2
    `, [userId, period.id, leftover]);
  }
  return leftovers;
}

export async function savePayPeriodLeftovers(userId: string, today: string, editedPeriodId?: number) {
  return withPlannerBalanceTransaction((db) => refreshPayPeriodLeftovers(db, userId, today, { editedPeriodId }));
}

export async function withPlannerBalanceTransaction<T>(save: (db: PoolClient) => Promise<T>): Promise<T> {
  const db = await databasePool.connect();
  try {
    await db.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
    const result = await save(db);
    await db.query("COMMIT");
    return result;
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  } finally {
    db.release();
  }
}
