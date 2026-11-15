"use client";

import type { PayPeriodFormValues } from "@/types";
import type { ExpenseRowProps } from "@/types/props";
import { useId, useState } from "react";
import { useController, useFormContext } from "react-hook-form";
import { validateBillDates } from "@/lib/utils/bills";
import { PiTrashDuotone } from "react-icons/pi";

const dollars = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function ExpenseRow(props: ExpenseRowProps) {
  const { index, onRemove } = props;

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
    <tr className="border-b border-zinc-200 hover:bg-zinc-200 [&>*:not(:last-child)]:border-r [&>*:not(:last-child)]:border-r-zinc-200">
      {/* Date */}
      <td>
        <label htmlFor={`${id}-date`}>
          <span className="sr-only">Date</span>
          <input
            id={`${id}-date`}
            type="date"
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
              className="text-xs text-red-500 dark:text-red-400"
            >
              {error.date.message}
            </span>
          )}
        </label>
      </td>

      {/* Name */}
      <td>
        <label htmlFor={`${id}-name`}>
          <span className="sr-only">Name</span>
          <input
            id={`${id}-name`}
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
              className="text-xs text-red-500 dark:text-red-400"
            >
              {error.name.message}
            </span>
          )}
        </label>
      </td>

      {/* Amount */}
      <td>
        <label htmlFor={`${id}-cost`}>
          <span className="sr-only">Amount</span>
          <input
            id={`${id}-cost`}
            type="text"
            inputMode="decimal"
            className={`${Number.isFinite(value) && value < 0
              ? "text-green-700 dark:text-green-400"
              : Number.isFinite(value) && value > 0
                ? "text-red-600 dark:text-red-400"
                : ""}`}
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
              className="text-xs text-red-500 dark:text-red-400"
            >
              {error.cost.message}
            </span>
          )}
        </label>
      </td>

      <td>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove expense ${index + 1}`}
          className="
            px-2 w-full h-fit flex items-center justify-center
            text-sm text-red-600 font-medium
            hover:bg-red-100
            disabled:opacity-50
            dark:text-red-400 dark:border-zinc-700 dark:hover:bg-zinc-800
          "
        >
          <PiTrashDuotone className="size-5" />
        </button>
      </td>
    </tr>
  );
}
