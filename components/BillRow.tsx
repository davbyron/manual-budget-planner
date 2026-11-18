"use client";

import type { BillsFormValues } from "@/types";
import type { BillRowProps } from "@/types/props";
import { useId, useState } from "react";
import { useController, useFormContext, useWatch } from "react-hook-form";
import { PiTrashDuotone } from "react-icons/pi";
import { validateBillDates } from "@/lib/utils/bills";
import FutureBillTooltip from "@/components/FutureBillTooltip";
import PastBillTooltip from "@/components/PastBillTooltip";

const dollarFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function BillRow(props: BillRowProps) {
  const { index, onRemove } = props;

  const id = useId();

  const {
    register,
    control,
    formState: { errors }
  } = useFormContext<BillsFormValues>();

  const rowErrors = errors.bills?.[index];

  const startDate = useWatch({ control, name: `bills.${index}.startDate` });
  const endDate = useWatch({ control, name: `bills.${index}.endDate` });
  const today = new Date();
  const startsInFuture = !!startDate && new Date(`${startDate}T00:00:00`) > today;
  const endedInPast = !!endDate && new Date(`${endDate}T00:00:00`) < today;

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
    <tr className="border-b border-zinc-200 hover:bg-zinc-200 [&>*:not(:last-child)]:border-r [&>*:not(:last-child)]:border-r-zinc-200">
      {/* Day */}
      <td>
        <label htmlFor={`${id}-day`}>
          <span className="sr-only">Day</span>
          <input
            id={`${id}-day`}
            type="number"
            min={1}
            max={28}
            step={1}
            placeholder="—"
            aria-invalid={!!rowErrors?.day}
            aria-describedby={rowErrors?.day ? `${id}-day-error` : undefined}
            {...register(`bills.${index}.day`, {
              setValueAs: (value) => Number(value),
              validate: (value) => (value === null || (Number.isInteger(value) && value >= 1 && value <= 28)) || "Use 1-28 or leave blank."
            })}
          />
          {rowErrors?.day && (
            <div
              id={`${id}-day-error`}
              role="alert"
              className="w-0 text-xs text-red-600 dark:text-red-400"
            >
              {rowErrors.day.message}
            </div>
          )}
        </label>
      </td>

      {/* Name */}
      <td>
        <div>
          <label htmlFor={`${id}-name`} className="sr-only">Name</label>
          <div className="flex items-center gap-2 ">
            {startsInFuture && (
              <FutureBillTooltip />
            )}
            {endedInPast && (
              <PastBillTooltip />
            )}
            <input
              id={`${id}-name`}
              placeholder="Bill name"
              aria-invalid={!!rowErrors?.name}
              aria-describedby={rowErrors?.name ? `${id}-name-error` : undefined}
              {...register(`bills.${index}.name`, {
                validate: (value) => !!value.trim() || "Enter a name."
              })}
            />
          </div>
          {rowErrors?.name && (
            <span
              id={`${id}-name-error`}
              role="alert"
              className="text-xs text-red-600 dark:text-red-400"
            >
              {rowErrors.name.message}
            </span>
          )}
        </div>
      </td>

      {/* Amount */}
      <td>
        <label htmlFor={`${id}-cost`}>
          <span className="sr-only">Amount</span>
          <input
            id={`${id}-cost`}
            type="text"
            inputMode="decimal"
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
      </td>

      {/* Start date */}
      <td>
        <label htmlFor={`${id}-start-date`}>
          <span className="sr-only">Start date</span>
          <input
            id={`${id}-start-date`}
            type="date"
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
      </td>

      {/* End date */}
      <td>
        <label htmlFor={`${id}-end-date`}>
          <span className="sr-only">End date</span>
          <input
            id={`${id}-end-date`}
            type="date"
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
      </td>

      <td>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove bill ${index + 1}`}
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
