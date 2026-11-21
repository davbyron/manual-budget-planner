"use client";

import type { PayPeriodFormValues } from "@/types";
import type { PayPeriodFormProps } from "@/types/props";
import {
  Fragment,
  useId,
  useMemo,
  useState,
  useTransition
} from "react";
import { FormProvider, useController, useFieldArray, useForm } from "react-hook-form";
import { createPayPeriod, getPayPeriod, savePayPeriod } from "@/lib/actions/pay-periods";
import { validateBillDates } from "@/lib/utils/bills";
import ExpenseRow from "@/components/ExpenseRow";
import Table from "@/components/Table";
import HelpTooltip from "@/components/HelpTooltip";

const buttonClass = "rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800";

export default function PayPeriodForm(props: PayPeriodFormProps) {
  const { payPeriod, onSaved, onCancel, onReload } = props;

  const todaysDateString = useMemo(() => new Date().toISOString().split("T")[0], []);

  const id = useId();

  const [originalPayPeriodData, setOriginalPayPeriodData] = useState(payPeriod);
  const [pending, startTransition] = useTransition();
  const [requiresReload, setRequiresReload] = useState(false);
  const [formSubmissionSucceeded, setFormSubmissionSucceeded] = useState(false);

  const form = useForm<PayPeriodFormValues>({
    defaultValues: {
      start_date: payPeriod?.start_date ?? "",
      end_date: payPeriod?.end_date ?? "",
      color: payPeriod?.color || "#3b82f6",
      expenses: payPeriod?.expenses ?? [],
  }});

  const {
    register,
    control,
    reset,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isDirty }
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "expenses",
    keyName: "formKey"
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
        const result = originalPayPeriodData
          ? await savePayPeriod(originalPayPeriodData.id, values, originalPayPeriodData, timeZone)
          : await createPayPeriod({ start_date: values.start_date, end_date: values.end_date, color: values.color }, timeZone);

        if (result.error !== undefined) {
          setRequiresReload(result.requiresReload ?? false);
          setError("root", { message: result.error });
          return;
        }

        reset({
          start_date: result.data.start_date,
          end_date: result.data.end_date,
          color: result.data.color,
          expenses: result.data.expenses
        });
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

        reset({
          start_date: result.data.start_date,
          end_date: result.data.end_date,
          color: result.data.color,
          expenses: result.data.expenses
        });
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

              {fields.length === 0 ? (
                <p className="py-3 text-sm italic text-zinc-500 dark:text-zinc-400">
                  No expenses for this pay period.
                </p>
              ) : (
                <Table
                  caption="Expenses Table"
                  theadContents={
                    <tr>
                      <th scope="col" className="w-10">Date</th>
                      <th scope="col" className="min-w-[20ch]">Name</th>
                      <th scope="col" className="min-w-[10ch]">Amount</th>
                      <th scope="col"></th>
                    </tr>
                  }
                  tbodyContents={fields.map((field, index) => (
                    <Fragment key={field.formKey}>
                      <ExpenseRow
                        index={index}
                        onRemove={() => { remove(index); setFormSubmissionSucceeded(false); }}
                      />
                    </Fragment>
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
