import type { PayPeriodWithExpenses } from "@/types";

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