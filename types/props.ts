import type { Dispatch, SetStateAction } from "react";
import type { Bill, IncomeSource, PayPeriod, PayPeriodLeftover, PayPeriodWithExpenses } from "@/types";

export type BillsProps = {
  onBillsChange?: (bills: Bill[]) => void;
  onLeftoversChange?: (leftovers: PayPeriodLeftover[]) => void;
};

export type BillRowProps = {
  index: number;
  onRemove: () => void;
};

export type DialogProps = {
  level: "info" | "warn" | "error";
  content: React.ReactNode;
}

export type HelpTooltipProps = {
  children: React.ReactNode;
};

export type TooltipProps = {
  trigger: React.ReactNode;
  className?: string;
  arrowFill?: string;
  children: React.ReactNode;
};

export type ExpenseRowProps = {
  field: `expenses.${number}` | `variableBills.${string}`;
  billName?: string;
  dueDate?: string;
  onRemove: () => void;
};

export type PayPeriodFormProps = {
  bills: Bill[];
  payPeriod?: PayPeriodWithExpenses;
  onSaved: (period: PayPeriodWithExpenses, leftovers?: PayPeriodLeftover[]) => void;
  onCancel?: () => void;
  onReload?: () => void;
};

export type PayPeriodAccordionProps = {
  bills: Bill[];
  remainingBalance: number | null;
  payPeriod: PayPeriodWithExpenses;
  open: boolean;
  onToggle: () => void;
  onSaved: PayPeriodFormProps["onSaved"];
};

export type IncomeSourcesProps = {
  onIncomeSourcesChange?: (incomeSources: IncomeSource[]) => void;
  onLeftoversChange?: (leftovers: PayPeriodLeftover[]) => void;
};

export type IncomeSourceRowProps = {
  index: number;
  onRemove: () => void;
};

export type CalendarProps = {
  bills: Bill[];
  payPeriods: PayPeriod[];
};

export type PayPeriodsProps = {
  bills: Bill[];
  periods: PayPeriodWithExpenses[];
  onPeriodsChange: Dispatch<SetStateAction<PayPeriodWithExpenses[]>>;
};

export type PlannerTabsProps = PayPeriodsProps & {
  onBillsChange: (bills: Bill[]) => void;
};

export interface EmailTemplateBaseProps {
  previewText: string;
  children: React.ReactNode;
}

export interface EmailTemplateProps {
  url: string;
}

export type AuthFormProps = {
  mode: "sign-in" | "sign-up" | "forgot-password" | "reset-password";
};

export type TableProps = {
  caption: string;
  theadContents: React.ReactNode;
  tbodyContents: React.ReactNode;
}
