"use client";

import type { PayPeriodFormValues } from "@/types";
import type { ExpenseRowProps } from "@/types/props";
import { useId, useState } from "react";
import { useController, useFormContext } from "react-hook-form";
import { PiTrashDuotone } from "react-icons/pi";
import { validateBillDates } from "@/lib/utils/bills";
import VariableBillWarningTooltip from "@/components/VariableBillWarningTooltip";

const dollars = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function ExpenseRow(props: ExpenseRowProps) {
  const { field, billName, dueDate, onRemove } = props;

  const id = useId();

  const {
    register,
    control,
    formState: { errors }
  } = useFormContext<PayPeriodFormValues>();

  const index = field.startsWith("expenses.") ? Number(field.slice("expenses.".length)) : undefined;
  const nameError = index === undefined ? undefined : errors.expenses?.[index]?.name;
  const { field: dateField, fieldState: { error: dateError } } = useController({
    control,
    name: `${field}.date`,
    defaultValue: dueDate,
    rules: { validate: (date) => !!date && !validateBillDates(date, null) || "Enter a valid date." },
  });

  const [draft, setDraft] = useState<string | null>(null);

  const {
    field: {
      name,
      ref: amountRef,
      value,
      onChange,
      onBlur
    },
    fieldState: { error: costError },
  } = useController({
    control,
    name: `${field}.cost`,
    defaultValue: dueDate === undefined ? undefined : 0,
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
            aria-invalid={!!dateError}
            aria-describedby={dateError ? `${id}-date-error` : undefined}
            {...dateField}
          />
          {dateError && (
            <span
              id={`${id}-date-error`}
              role="alert"
              className="text-xs text-red-500 dark:text-red-400"
            >
              {dateError.message}
            </span>
          )}
        </label>
      </td>

      {/* Name */}
      <td>
        {billName !== undefined ? (
          <div className="flex items-center gap-2">
            {dueDate !== undefined && value === 0 && <VariableBillWarningTooltip />}
            <span className="text-sm">{billName}</span>
          </div>
        ) : index !== undefined && (
          <label htmlFor={`${id}-name`}>
            <span className="sr-only">Name</span>
            <input
              id={`${id}-name`}
              aria-invalid={!!nameError}
              aria-describedby={nameError ? `${id}-name-error` : undefined}
              {...register(`expenses.${index}.name`, {
                validate: (text) => !!text.trim() || "Enter a name."
              })}
            />
            {nameError && (
              <span
                id={`${id}-name-error`}
                role="alert"
                className="text-xs text-red-500 dark:text-red-400"
              >
                {nameError.message}
              </span>
            )}
          </label>
        )}
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
            aria-invalid={!!costError}
            aria-describedby={costError ? `${id}-cost-error` : undefined}
            onFocus={() => setDraft(Number.isFinite(value) ? value.toFixed(2) : "")}
            onChange={(event) => {
              const text = event.target.value.replace(/[$,]/g, "").trim();
              if (!/^-?\d*(\.\d{0,2})?$/.test(text)) return;
              setDraft(text);
              onChange(text === "" ? NaN : Number(text));
            }}
            onBlur={() => { setDraft(null); onBlur(); }}
          />
          {costError && (
            <span
              id={`${id}-cost-error`}
              role="alert"
              className="text-xs text-red-500 dark:text-red-400"
            >
              {costError.message}
            </span>
          )}
        </label>
      </td>

      <td>
        <button
          type="button"
          onClick={onRemove}
          aria-label={dueDate ? `Clear amount for ${billName}` : `Remove expense ${(index ?? 0) + 1}`}
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
