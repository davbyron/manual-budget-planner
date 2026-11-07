"use client";

import { useId, useState, useTransition } from "react";
import { FormProvider, useController, useFieldArray, useForm } from "react-hook-form";
import { createPayPeriod, getPayPeriod, savePayPeriod } from "@/lib/actions/pay-periods";
import { validateBillDates } from "@/lib/utils/bills";
import ExpenseRow from "@/components/ExpenseRow";
import type { PayPeriodFormValues } from "@/types";
import type { PayPeriodFormProps } from "@/types/props";

const buttonClass = "rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800";
const inputClass = "mt-1 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-blue-600 dark:border-zinc-700";

export default function PayPeriodForm(props: PayPeriodFormProps) {
  const { period, onSaved, onCancel, onReload } = props;

  const id = useId();

  const [original, setOriginal] = useState(period);
  const [pending, startTransition] = useTransition();
  const [requiresReload, setRequiresReload] = useState(false);
  const [message, setMessage] = useState("");

  const form = useForm<PayPeriodFormValues>({
    defaultValues: {
      start_date: period?.start_date ?? "",
      end_date: period?.end_date ?? "",
      color: period?.color || "#3b82f6",
      expenses: period?.expenses ?? [],
  }});

  const {
    register,
    control,
    reset,
    handleSubmit,
    getValues,
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
    setMessage("");

    startTransition(async () => {
      try {
        const result = original
          ? await savePayPeriod(original.id, values, original)
          : await createPayPeriod({ start_date: values.start_date, end_date: values.end_date, color: values.color });

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
        setOriginal(result.data);
        setMessage("Pay period saved.");
        onSaved(result.data);
      } catch {
        setRequiresReload(true);
        setError("root", { message: "Could not confirm the save. Reload saved data before trying again." });
      }
    });
  });

  function reload() {
    if (!window.confirm("Reload saved data? Unsaved changes in this form will be discarded.")) return;

    if (!original) { onReload?.(); return; }

    startTransition(async () => {
      try {
        const result = await getPayPeriod(original.id);

        if (result.error !== undefined) {
          setError("root", { message: result.error }); return;
        }

        reset({
          start_date: result.data.start_date,
          end_date: result.data.end_date,
          color: result.data.color,
          expenses: result.data.expenses
        });
        setOriginal(result.data);
        setRequiresReload(false);
        setMessage("");
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
        aria-label={original ? `Edit pay period ${original.start_date} to ${original.end_date}` : "New pay period"}
        onChange={() => setMessage("")}
      >
        <fieldset disabled={pending} className="min-w-0">
          <div className="flex flex-wrap gap-3">
            <label htmlFor={`${id}-start`} className="min-w-40 flex-1 text-sm font-medium">
              Start date
              <input
                id={`${id}-start`}
                type="date"
                className={inputClass}
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

            <label htmlFor={`${id}-end`} className="min-w-40 flex-1 text-sm font-medium">
              End date
              <input
                id={`${id}-end`}
                type="date"
                className={inputClass}
                aria-invalid={!!errors.end_date}
                aria-describedby={errors.end_date ? `${id}-end-error` : undefined}
                {...register("end_date", { validate: (date, values) => !date ? "Enter an end date." : validateBillDates(values.start_date || null, date) ?? true })}
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

            <label htmlFor={`${id}-color`} className="w-20 text-sm font-medium">
              Color
              <input
                id={`${id}-color`}
                type="color"
                className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-zinc-300 bg-transparent p-1 focus-visible:outline-2 focus-visible:outline-blue-600 dark:border-zinc-700"
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
          </div>

          {original && (
            <div className="mt-6">
              <h3 className="mb-2 font-semibold">Expenses</h3>
              {fields.length === 0 && (
                <p className="py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  No expenses.
                </p>
              )}

              <ul className="list-none">
                {fields.map((field, index) => (
                  <li key={field.formKey}>
                    <ExpenseRow
                      index={index}
                      onRemove={() => { remove(index); setMessage(""); }}
                    />
                  </li>)
                )}
              </ul>

              <button
                type="button"
                className={buttonClass}
                onClick={() => {
                  append({ date: getValues("start_date"), name: "New expense", cost: 0 });
                  setMessage("");
                }}
              >
                + Add new expense
              </button>
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
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
              disabled={pending || requiresReload || (original ? !isDirty : false)}
              className={buttonClass}
            >
              {pending ? "Saving…" : "Save"}
            </button>
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
            {original ? "Reload this pay period" : "Reload pay periods"}
          </button>
        )}

        <p role="status" className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {message}
        </p>
      </form>
    </FormProvider>
  );
}
