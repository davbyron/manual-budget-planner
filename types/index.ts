import type { Tables } from "@/types/database.types";

export type Bill = Pick<Tables<"Bill">, "id" | "day" | "name" | "cost" | "startDate" | "endDate">;
export type BillInput = Pick<Bill, "day" | "name" | "cost" | "startDate" | "endDate">;
export type BillResult<T> = { data: T; error?: never } | { data?: never; error: string };

export type BillDraft = BillInput & { id?: number };
export type BillsFormValues = { bills: BillDraft[] };

export type BillSaveResult = BillResult<Bill[]> & { requiresReload?: boolean };
