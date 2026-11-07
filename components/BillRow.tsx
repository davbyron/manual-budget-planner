"use client";

import { useId, useState } from "react";
import { useController, useFormContext } from "react-hook-form";
import { validateBillDates } from "@/lib/utils/bills";
import type { BillsFormValues } from "@/types";
import type { BillRowProps } from "@/types/props";

const dollarFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const inputClass = "mt-1 w-full min-w-0 rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-blue-600 dark:border-zinc-700";

export default function BillRow(props: BillRowProps) {
  const { index, onRemove } = props;

  const id = useId();

  const {
    register,
    control,
    formState: { errors }
  } = useFormContext<BillsFormValues>();

  const rowErrors = errors.bills?.[index];

  const [amountDraft, setAmountDraft] = useState<string | null>(null);

  const {
    field: {
      name: amountName,
      ref: amountRef,
      value: amountValue,
      onChange: onAmountChange,
      onBlur: onAmountBlur
    }
  } = useController<BillsFormValues, `bills.${number}.cost`>({
    control,
    name: `bills.${index}.cost`,
    rules: {
      validate: (value) => (Number.isFinite(value) && value >= 0) || "Enter an amount of 0 or more.",
    },
  });

  return (
    <div className="flex min-w-0 flex-wrap items-start gap-3 border-t border-zinc-200 py-4 dark:border-zinc-800">
      {/* Day */}
      <label htmlFor={`${id}-day`} className="w-20 text-sm font-medium">
        Day
        <input
          id={`${id}-day`}
          type="number"
          min={1}
          max={28}
          step={1}
          placeholder="—"
          className={inputClass}
          aria-invalid={!!rowErrors?.day}
          aria-describedby={rowErrors?.day ? `${id}-day-error` : undefined}
          {...register(`bills.${index}.day`, {
            setValueAs: (value) => value === "" ? null : Number(value),
            validate: (value) => value === null || (Number.isInteger(value) && value >= 1 && value <= 28) || "Use 1-28 or leave blank."
          })}
        />
        {rowErrors?.day && (
          <span
            id={`${id}-day-error`}
            role="alert"
            className="text-xs text-red-600 dark:text-red-400"
          >
            {rowErrors.day.message}
          </span>
        )}
      </label>

      {/* Name */}
      <label htmlFor={`${id}-name`} className="min-w-32 flex-1 text-sm font-medium">
        Name
        <input
          id={`${id}-name`}
          className={inputClass}
          placeholder="Bill name"
          aria-invalid={!!rowErrors?.name}
          aria-describedby={rowErrors?.name ? `${id}-name-error` : undefined}
          {...register(`bills.${index}.name`, {
            validate: (value) => !!value.trim() || "Enter a name."
          })}
        />
        {rowErrors?.name && (
          <span
            id={`${id}-name-error`}
            role="alert"
            className="text-xs text-red-600 dark:text-red-400"
          >
            {rowErrors.name.message}
          </span>
        )}
      </label>

      {/* Amount */}
      <label htmlFor={`${id}-cost`} className="w-28 text-sm font-medium">
        Amount
        <input
          id={`${id}-cost`}
          type="text"
          inputMode="decimal"
          className={inputClass}
          name={amountName}
          ref={amountRef}
          value={amountDraft ?? (Number.isFinite(amountValue) ? dollarFormatter.format(amountValue) : "")}
          aria-invalid={!!rowErrors?.cost}
          aria-describedby={rowErrors?.cost ? `${id}-cost-error` : undefined}
          onFocus={() => setAmountDraft(Number.isFinite(amountValue) ? amountValue.toFixed(2) : "")}
          onChange={(event) => {
            const value = event.target.value.replace(/[$,]/g, "").trim();
            if (!/^\d*(\.\d{0,2})?$/.test(value)) return;
            setAmountDraft(value);
            onAmountChange(value === "" || value === "." ? NaN : Number(value));
          }}
          onBlur={() => {
            setAmountDraft(null);
            onAmountBlur();
          }}
        />
        {rowErrors?.cost && (
          <span
            id={`${id}-cost-error`}
            role="alert"
            className="text-xs text-red-600 dark:text-red-400"
          >
            {rowErrors.cost.message}
          </span>
        )}
      </label>

      {/* Start date */}
      <label htmlFor={`${id}-start-date`} className="w-40 text-sm font-medium">
        Start date
        <input
          id={`${id}-start-date`}
          type="date"
          className={inputClass}
          aria-invalid={!!rowErrors?.startDate}
          aria-describedby={rowErrors?.startDate ? `${id}-start-date-error` : undefined}
          {...register(`bills.${index}.startDate`, {
            setValueAs: (value) => value === "" ? null : value,
            validate: (value) => validateBillDates(value, null) ?? true,
            deps: [`bills.${index}.endDate`],
          })}
        />
        {rowErrors?.startDate && (
          <span
            id={`${id}-start-date-error`}
            role="alert"
            className="text-xs text-red-600 dark:text-red-400"
          >
            {rowErrors.startDate.message}
          </span>
        )}
      </label>

      {/* End date */}
      <label htmlFor={`${id}-end-date`} className="w-40 text-sm font-medium">
        End date
        <input
          id={`${id}-end-date`}
          type="date"
          className={inputClass}
          aria-invalid={!!rowErrors?.endDate}
          aria-describedby={rowErrors?.endDate ? `${id}-end-date-error` : undefined}
          {...register(`bills.${index}.endDate`, {
            setValueAs: (value) => value === "" ? null : value,
            validate: (value, values) => validateBillDates(values.bills[index].startDate, value) ?? true,
          })}
        />
        {rowErrors?.endDate && (
          <span
            id={`${id}-end-date-error`}
            role="alert"
            className="text-xs text-red-600 dark:text-red-400"
          >
            {rowErrors.endDate.message}
          </span>
        )}
      </label>

      <div className="pt-6">
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove bill ${index + 1}`}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-red-400 dark:hover:bg-zinc-800"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
