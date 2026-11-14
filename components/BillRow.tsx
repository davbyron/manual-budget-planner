"use client";

import type { BillsFormValues } from "@/types";
import type { BillRowProps } from "@/types/props";
import { useId, useState } from "react";
import { useController, useFormContext, useWatch } from "react-hook-form";
import { PiAlarmDuotone, PiSealWarningDuotone, PiTrashDuotone } from "react-icons/pi";
import { validateBillDates } from "@/lib/utils/bills";

const dollarFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const inputClass = "\
  px-3 py-2 w-full min-w-0 text-sm \
  focus-visible:outline-2 focus-visible:outline-blue-600 \
  dark:border-zinc-700 \
";

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
    <div
      className={`
        grid grid-cols-[3.5rem_minmax(20ch,1fr)_7rem_9rem_9rem_max-content]
        xl:grid-cols-[3rem_minmax(20ch,1fr)_5.8rem_5.5rem_5.5rem_max-content]
        2xl:grid-cols-[3.5rem_minmax(20ch,1fr)_7rem_9rem_9rem_max-content]
      `}
    >
      {/* Day */}
      <label htmlFor={`${id}-day`} className="min-w-0 text-sm font-medium border-r border-zinc-200">
        <span className="sr-only">Day</span>
        <input
          id={`${id}-day`}
          type="number"
          min={1}
          max={28}
          step={1}
          placeholder="—"
          className={`${inputClass} sm:px-2`}
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
      <label htmlFor={`${id}-name`} className="min-w-[20ch] text-sm font-medium border-r border-zinc-200">
        <span className="sr-only">Name</span>
        <div className="flex items-center">
          {startsInFuture && (
            <PiAlarmDuotone
              className="ml-3 shrink-0 text-lg text-blue-600"
              role="img"
              aria-label="This bill is planned for the future"
              title="This bill is planned for the future"
            />
          )}
          {endedInPast && (
            <PiSealWarningDuotone
              className="ml-3 shrink-0 text-lg text-yellow-600"
              role="img"
              aria-label="This bill is past its end date"
              title="This bill is past its end date"
            />
          )}
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
      </label>

      {/* Amount */}
      <label htmlFor={`${id}-cost`} className="min-w-0 text-sm font-medium border-r border-zinc-200">
        <span className="sr-only">Amount</span>
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
      <label htmlFor={`${id}-start-date`} className="min-w-0 text-sm font-medium border-r border-zinc-200">
        <span className="sr-only">Start date</span>
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
      <label htmlFor={`${id}-end-date`} className="min-w-0 text-sm font-medium border-r border-zinc-200">
        <span className="sr-only">End date</span>
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

      <div className="self-end">
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove bill ${index + 1}`}
          className="
            px-3 py-2 text-sm font-medium text-red-600
            hover:bg-red-100
            disabled:opacity-50
            dark:text-red-400 dark:border-zinc-700 dark:hover:bg-zinc-800
          "
        >
          <PiTrashDuotone className="text-lg" />
        </button>
      </div>
    </div>
  );
}
