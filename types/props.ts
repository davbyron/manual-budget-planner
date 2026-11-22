import type { Dispatch, SetStateAction } from "react";
import type { Bill, CalendarDayCashFlow, IncomeSource, PayPeriodLeftover, PayPeriodWithExpenses } from "@/types";

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
  triggerClassName?: string;
  className?: string;
  arrowFill?: string;
  role?: "label" | "tooltip";
  children: React.ReactNode;
};

export type CalendarCashFlowTooltipProps = {
  dateLabel: string;
  cashFlow: CalendarDayCashFlow;
};

export type CashFlowAmountProps = {
  amountInCents: number;
  stackOnSmallScreens?: boolean;
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
  incomeSources: IncomeSource[];
  payPeriods: PayPeriodWithExpenses[];
};

export type PayPeriodsProps = {
  bills: Bill[];
  periods: PayPeriodWithExpenses[];
  onPeriodsChange: Dispatch<SetStateAction<PayPeriodWithExpenses[]>>;
};

export type PlannerTabsProps = PayPeriodsProps & {
  onBillsChange: (bills: Bill[]) => void;
  onIncomeSourcesChange: (incomeSources: IncomeSource[]) => void;
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
