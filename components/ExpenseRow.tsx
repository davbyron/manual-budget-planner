"use client";

import type { PayPeriodFormValues } from "@/types";
import type { ExpenseRowProps } from "@/types/props";
import { useId, useState, useMemo } from "react";
import { useController, useFormContext } from "react-hook-form";
import { validateBillDates } from "@/lib/utils/bills";

const inputClass = "mt-1 w-full min-w-0 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-blue-600 dark:border-zinc-700";
const dollars = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function ExpenseRow(props: ExpenseRowProps) {
  const { index, onRemove } = props;

  const isEven = useMemo(() => index % 2 === 0, [index]);

  const id = useId();

  const {
    register,
    control,
    formState: { errors }
  } = useFormContext<PayPeriodFormValues>();

  const error = errors.expenses?.[index];

  const [draft, setDraft] = useState<string | null>(null);

  const {
    field: {
      name,
      ref: amountRef,
      value,
      onChange,
      onBlur
    }
  } = useController<PayPeriodFormValues, `expenses.${number}.cost`>({
    control,
    name: `expenses.${index}.cost`,
    rules: {
      validate: (amount) => Number.isFinite(amount) || "Enter a valid amount."
    },
  });

  return (
    <div
      className={`
        px-2 py-4 min-w-0 flex flex-wrap items-start gap-3
        border-t border-zinc-200 dark:border-zinc-800
        ${isEven ? "bg-zinc-100 dark:bg-zinc-900" : ""}
      `}
    >
      <label htmlFor={`${id}-date`} className="w-40 text-sm font-medium">
        Date
        <input
          id={`${id}-date`}
          type="date"
          className={inputClass}
          aria-invalid={!!error?.date}
          aria-describedby={error?.date ? `${id}-date-error` : undefined}
          {...register(`expenses.${index}.date`, {
            validate: (date) => !!date && !validateBillDates(date, null) || "Enter a valid date."
          })}
        />
        {error?.date && (
          <span 
            id={`${id}-date-error`}
            role="alert"
            className="text-xs text-red-600 dark:text-red-400"
          >
            {error.date.message}
          </span>
        )}
      </label>

      <label htmlFor={`${id}-name`} className="min-w-32 flex-1 text-sm font-medium">
        Name
        <input
          id={`${id}-name`}
          className={inputClass}
          aria-invalid={!!error?.name}
          aria-describedby={error?.name ? `${id}-name-error` : undefined}
          {...register(`expenses.${index}.name`, {
            validate: (text) => !!text.trim() || "Enter a name."
          })}
        />
        {error?.name && (
          <span
            id={`${id}-name-error`}
            role="alert"
            className="text-xs text-red-600 dark:text-red-400"
          >
            {error.name.message}
          </span>
        )}
      </label>

      <label htmlFor={`${id}-cost`} className="w-28 text-sm font-medium">
        Amount
        <input
          id={`${id}-cost`}
          type="text"
          inputMode="decimal"
          className={inputClass}
          name={name}
          ref={amountRef}
          value={draft ?? (Number.isFinite(value) ? dollars.format(value) : "")}
          aria-invalid={!!error?.cost}
          aria-describedby={error?.cost ? `${id}-cost-error` : undefined}
          onFocus={() => setDraft(Number.isFinite(value) ? value.toFixed(2) : "")}
          onChange={(event) => {
            const text = event.target.value.replace(/[$,]/g, "").trim();
            if (!/^-?\d*(\.\d{0,2})?$/.test(text)) return;
            setDraft(text);
            onChange(text === "" ? NaN : Number(text));
          }}
          onBlur={() => { setDraft(null); onBlur(); }}
        />
        {error?.cost && (
          <span
            id={`${id}-cost-error`}
            role="alert"
            className="text-xs text-red-600 dark:text-red-400"
          >
            {error.cost.message}
          </span>
        )}
      </label>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove expense ${index + 1}`}
        className="mt-6 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-red-600 disabled:opacity-50 dark:border-zinc-700 dark:text-red-400"
      >
        Remove
      </button>
    </div>
  );
}
