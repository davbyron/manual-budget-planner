"use client";

import type { PayPeriodFormValues, PayPeriodWithExpenses } from "@/types";
import type { PayPeriodFormProps } from "@/types/props";
import {
  useId,
  useMemo,
  useState,
  useTransition
} from "react";
import { FormProvider, useController, useFieldArray, useForm, useWatch } from "react-hook-form";
import { createPayPeriod, getPayPeriod, savePayPeriod } from "@/lib/actions/pay-periods";
import { validateBillDates } from "@/lib/utils/bills";
import { getBillOccurrenceKey, getBillOccurrences } from "@/lib/utils/pay-periods";
import ExpenseRow from "@/components/ExpenseRow";
import HelpTooltip from "@/components/HelpTooltip";
import Table from "@/components/Table";

const buttonClass = "rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800";

const expenseColumns = (
  <tr>
    <th scope="col" className="w-10">Date</th>
    <th scope="col" className="min-w-[20ch]">Name</th>
    <th scope="col" className="min-w-[10ch]">Amount</th>
    <th scope="col"></th>
  </tr>
);

function getFormValues(period?: PayPeriodWithExpenses): PayPeriodFormValues {
  const expenses = period?.expenses ?? [];
  const variableBills: PayPeriodFormValues["variableBills"] = {};
  for (const expense of expenses) {
    if (expense.bill_id != null && expense.bill_due_date != null) {
      variableBills[getBillOccurrenceKey(expense.bill_id, expense.bill_due_date)] = {
        date: expense.date,
        cost: expense.cost,
      };
    }
  }
  return {
    start_date: period?.start_date ?? "",
    end_date: period?.end_date ?? "",
    color: period?.color || "#3b82f6",
    expenses,
    variableBills,
  };
}

export default function PayPeriodForm(props: PayPeriodFormProps) {
  const { bills, payPeriod, onSaved, onCancel, onReload } = props;

  const todaysDateString = useMemo(() => new Date().toISOString().split("T")[0], []);

  const id = useId();

  const [originalPayPeriodData, setOriginalPayPeriodData] = useState(payPeriod);
  const [pending, startTransition] = useTransition();
  const [requiresReload, setRequiresReload] = useState(false);
  const [formSubmissionSucceeded, setFormSubmissionSucceeded] = useState(false);

  const form = useForm<PayPeriodFormValues>({ defaultValues: getFormValues(payPeriod) });

  const {
    register,
    control,
    reset,
    handleSubmit,
    setError,
    setValue,
    clearErrors,
    formState: { errors, isDirty }
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "expenses",
    keyName: "formKey"
  });

  const [startDate, endDate] = useWatch({ control, name: ["start_date", "end_date"] });
  const variableBills = useMemo(
    () => getBillOccurrences(bills.filter((bill) => bill.isCostVariable), startDate, endDate),
    [bills, startDate, endDate],
  );
  const activeKeys = new Set(variableBills.map(({ key }) => key));
  const savedExpenses = new Map(originalPayPeriodData?.expenses.map((expense) => [expense.id, expense]));
  const billsById = new Map(bills.map((bill) => [bill.id, bill]));
  const expenseRows = fields.flatMap((field, index) => {
    const saved = field.id === undefined ? undefined : savedExpenses.get(field.id);
    if (saved?.bill_id != null && saved.bill_due_date &&
        activeKeys.has(getBillOccurrenceKey(saved.bill_id, saved.bill_due_date))) return [];
    const billName = saved?.bill_id == null ? undefined : billsById.get(saved.bill_id)?.name ?? saved.name;
    return [{ field, index, billName }];
  });

  const {
    field: {
      name: colorName,
      value: colorValue,
      ref: colorRef,
      onChange: onColorChange,
      onBlur: onColorBlur
    }
  } = useController<PayPeriodFormValues, "color">({
    control,
    name: "color",
    rules: { validate: (color) => /^#[0-9a-fA-F]{6}$/.test(color) || "Choose a valid color." },
  });

  const save = handleSubmit((values) => {
    if (requiresReload) return;

    clearErrors("root");
    setFormSubmissionSucceeded(false);

    startTransition(async () => {
      try {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const input = {
          ...values,
          variableBills: Object.fromEntries(variableBills.flatMap(({ key }) =>
            values.variableBills[key] ? [[key, values.variableBills[key]]] : []
          )),
          expenses: expenseRows.map(({ index }) => values.expenses[index]),
        };
        const result = originalPayPeriodData
          ? await savePayPeriod(originalPayPeriodData.id, input, originalPayPeriodData, timeZone)
          : await createPayPeriod(input, timeZone);

        if (result.error !== undefined) {
          setRequiresReload(result.requiresReload ?? false);
          setError("root", { message: result.error });
          return;
        }

        reset(getFormValues(result.data));
        setOriginalPayPeriodData(result.data);
        setFormSubmissionSucceeded(true);
        onSaved(result.data, result.leftovers);
      } catch {
        setRequiresReload(true);
        setError("root", { message: "Could not confirm the save. Reload saved data before trying again." });
      }
    });
  });

  function reload() {
    if (!window.confirm("Reload saved data? Unsaved changes in this form will be discarded.")) return;

    if (!originalPayPeriodData) { onReload?.(); return; }

    startTransition(async () => {
      try {
        const result = await getPayPeriod(originalPayPeriodData.id);

        if (result.error !== undefined) {
          setError("root", { message: result.error }); return;
        }

        reset(getFormValues(result.data));
        setOriginalPayPeriodData(result.data);
        setRequiresReload(false);
        setFormSubmissionSucceeded(false);
        onSaved(result.data);
      } catch {
        setError("root", { message: "Could not reload this pay period. Please try again." });
      }
    });
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={save}
        noValidate
        aria-label={originalPayPeriodData ? `Edit pay period ${originalPayPeriodData.start_date} to ${originalPayPeriodData.end_date}` : "New pay period"}
        onChange={() => setFormSubmissionSucceeded(false)}
      >
        <fieldset disabled={pending} className="min-w-0">
          <div className="flex flex-col sm:flex-row gap-3">
            <label htmlFor={`${id}-color`} className="w-20">
              <span className="text-sm font-medium">Color</span>
              <input
                id={`${id}-color`}
                type="color"
                className="
                  w-full cursor-pointer border border-zinc-200
                  focus-visible:outline-2 focus-visible:outline-blue-600
                  dark:border-zinc-700
                "
                aria-invalid={!!errors.color}
                aria-describedby={errors.color ? `${id}-color-error` : undefined}
                name={colorName}
                ref={colorRef}
                value={colorValue}
                onChange={onColorChange}
                onBlur={onColorBlur}
              />
              {errors.color && (
                <span
                  id={`${id}-color-error`}
                  role="alert"
                  className="text-xs text-red-600 dark:text-red-400"
                >
                  {errors.color.message}
                </span>
              )}
            </label>

            <label htmlFor={`${id}-start`} className="min-w-0">
              <span className="text-sm font-medium">Start date</span>
              <input
                id={`${id}-start`}
                type="date"
                className="px-2 border border-zinc-200"
                aria-invalid={!!errors.start_date}
                aria-describedby={errors.start_date ? `${id}-start-error` : undefined}
                {...register("start_date", {
                  validate: (date) => !!date && !validateBillDates(date, null) || "Enter a valid start date.",
                  deps: ["end_date"]
                })}
              />
              {errors.start_date && (
                <span
                  id={`${id}-start-error`}
                  role="alert"
                  className="text-xs text-red-600 dark:text-red-400"
                >
                    {errors.start_date.message}
                </span>
              )}
            </label>

            <label htmlFor={`${id}-end`} className="min-w-0">
              <span className="text-sm font-medium">End date</span>
              <input
                id={`${id}-end`}
                type="date"
                className="px-2 border border-zinc-200"
                aria-invalid={!!errors.end_date}
                aria-describedby={errors.end_date ? `${id}-end-error` : undefined}
                {...register("end_date", {
                  validate: (date, values) => !date ? "Enter an end date." : validateBillDates(values.start_date || null, date) ?? true
                })}
              />
              {errors.end_date && (
                <span
                  id={`${id}-end-error`}
                  role="alert"
                  className="text-xs text-red-600 dark:text-red-400"
                >
                  {errors.end_date.message}
                </span>
              )}
            </label>
          </div>

          {variableBills.length > 0 && (
            <div className="mt-6">
              <h4>Variable Bills</h4>
              <Table
                caption="Variable Bills Table"
                theadContents={expenseColumns}
                tbodyContents={variableBills.map(({ bill, dueDate, key }) => (
                  <ExpenseRow
                    key={key}
                    field={`variableBills.${key}`}
                    billName={bill.name}
                    dueDate={dueDate}
                    onRemove={() => {
                      setValue(`variableBills.${key}.cost`, 0, { shouldDirty: true, shouldValidate: true });
                      setValue(`variableBills.${key}.date`, dueDate, { shouldDirty: true, shouldValidate: true });
                      setFormSubmissionSucceeded(false);
                    }}
                  />
                ))}
              />
            </div>
          )}

          {originalPayPeriodData && (
            <div className="mt-6">
              <div className="flex items-center gap-2">
                <h4>Expenses</h4>
                <HelpTooltip>
                  <p>
                    List completed payments that you make during this pay period here.
                    Use negative values in the Amount field to record one-time income.
                  </p>
                </HelpTooltip>
              </div>

              {expenseRows.length === 0 ? (
                <p className="py-3 text-sm italic text-zinc-500 dark:text-zinc-400">
                  No expenses for this pay period.
                </p>
              ) : (
                <Table
                  caption="Expenses Table"
                  theadContents={expenseColumns}
                  tbodyContents={expenseRows.map(({ field, index, billName }) => (
                    <ExpenseRow
                      key={field.formKey}
                      field={`expenses.${index}`}
                      billName={billName}
                      onRemove={() => { remove(index); setFormSubmissionSucceeded(false); }}
                    />
                  ))}
                />
              )}
            </div>
          )}

          <div className="sticky bottom-0 pt-4 flex flex-wrap justify-between gap-3 bg-white">
            {originalPayPeriodData && (
              <button
                type="button"
                className={buttonClass}
                onClick={() => {
                  append({ date: todaysDateString, name: "New expense", cost: 0 });
                  setFormSubmissionSucceeded(false);
                }}
              >
                + New expense
              </button>
            )}

            <div className="ml-auto flex min-w-0 flex-wrap items-center gap-2">
              {formSubmissionSucceeded && (
                <p role="status" className="text-sm text-green-600 dark:text-green-400">
                  ✔ Pay period saved
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className={buttonClass}
                  >
                      Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={pending || requiresReload || (originalPayPeriodData ? !isDirty : false)}
                  className={buttonClass}
                >
                  {pending ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </fieldset>

        {errors.root && (
          <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
            {errors.root.message}
          </p>
        )}

        {requiresReload && (
          <button
            type="button"
            disabled={pending}
            onClick={reload}
            className={`${buttonClass} mt-3`}
          >
            {originalPayPeriodData ? "Reload this pay period" : "Reload pay periods"}
          </button>
        )}
      </form>
    </FormProvider>
  );
}
