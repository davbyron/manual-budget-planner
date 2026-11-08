import type { Dispatch, SetStateAction } from "react";
import type { Bill, IncomeSource, PayPeriod, PayPeriodWithExpenses } from "@/types";

export type BillsProps = {
  onBillsChange?: (bills: Bill[]) => void;
};

export type BillRowProps = {
  index: number;
  onRemove: () => void;
};

export type ExpenseRowProps = {
  index: number;
  onRemove: () => void;
};

export type PayPeriodFormProps = {
  payPeriod?: PayPeriodWithExpenses;
  onSaved: (period: PayPeriodWithExpenses) => void;
  onCancel?: () => void;
  onReload?: () => void;
};

export type PayPeriodAccordionProps = {
  remainingBalance: number | null;
  payPeriod: PayPeriodWithExpenses;
  open: boolean;
  onToggle: () => void;
  onSaved: (period: PayPeriodWithExpenses) => void;
};

export type IncomeSourcesProps = {
  onIncomeSourcesChange?: (incomeSources: IncomeSource[]) => void;
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
  bills?: Bill[] | null;
  incomeSources?: IncomeSource[] | null;
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
