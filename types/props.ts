import type { Dispatch, SetStateAction } from "react";
import type { PayPeriod, PayPeriodWithExpenses } from "@/types";

export type BillRowProps = {
  index: number;
  onRemove: () => void;
};

export type ExpenseRowProps = {
  index: number;
  onRemove: () => void;
};

export type PayPeriodFormProps = {
  period?: PayPeriodWithExpenses;
  onSaved: (period: PayPeriodWithExpenses) => void;
  onCancel?: () => void;
  onReload?: () => void;
};

export type PayPeriodAccordionProps = {
  period: PayPeriodWithExpenses;
  open: boolean;
  onToggle: () => void;
  onSaved: (period: PayPeriodWithExpenses) => void;
};

export type IncomeSourceRowProps = {
  index: number;
  onRemove: () => void;
};

export type CalendarProps = {
  payPeriods: PayPeriod[];
};

export type PayPeriodsProps = {
  periods: PayPeriodWithExpenses[];
  onPeriodsChange: Dispatch<SetStateAction<PayPeriodWithExpenses[]>>;
};