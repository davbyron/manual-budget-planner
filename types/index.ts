import type { Tables } from "@/types/database.types";

export type Bill = Pick<Tables<"Bill">, "id" | "day" | "name" | "cost" | "startDate" | "endDate">;
export type BillInput = Pick<Bill, "day" | "name" | "cost" | "startDate" | "endDate">;
export type BillResult<T> = { data: T; error?: never } | { data?: never; error: string };

export type BillDraft = BillInput & { id?: number };
export type BillsFormValues = { bills: BillDraft[] };

export type BillSaveResult = BillResult<Bill[]> & { requiresReload?: boolean };

export type Expense = Pick<Tables<"Expense">, "id" | "date" | "name" | "cost" | "pay_period_id">;
export type ExpenseDraft = Pick<Expense, "date" | "name" | "cost"> & { id?: number };
export type PayPeriod = Pick<Tables<"PayPeriod">, "id" | "start_date" | "end_date">;
export type PayPeriodInput = Pick<PayPeriod, "start_date" | "end_date">;
export type PayPeriodWithExpenses = PayPeriod & { expenses: Expense[] };
export type PayPeriodFormValues = PayPeriodInput & { expenses: ExpenseDraft[] };
export type PayPeriodResult<T> = { data: T; error?: never; requiresReload?: never } | { data?: never; error: string; requiresReload?: boolean };
