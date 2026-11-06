"use client";

import { useId } from "react";
import { useFormContext } from "react-hook-form";
import type { BillsFormValues } from "@/types";
import type { BillRowProps } from "@/types/props";

const inputClass = "mt-1 w-full min-w-0 rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-blue-600 dark:border-zinc-700";

export default function BillRow({ index, onRemove }: BillRowProps) {
  const id = useId();
  const { register, formState: { errors } } = useFormContext<BillsFormValues>();
  const rowErrors = errors.bills?.[index];

  return (
    <div className="flex min-w-0 flex-wrap items-start gap-3 border-t border-zinc-200 py-4 dark:border-zinc-800">
      <label htmlFor={`${id}-day`} className="w-20 text-sm font-medium">
        Day
        <input id={`${id}-day`} type="number" min={1} max={28} step={1} placeholder="—" className={inputClass}
          aria-invalid={!!rowErrors?.day} aria-describedby={rowErrors?.day ? `${id}-day-error` : undefined}
          {...register(`bills.${index}.day`, { setValueAs: (value) => value === "" ? null : Number(value), validate: (value) => value === null || (Number.isInteger(value) && value >= 1 && value <= 28) || "Use 1-28 or leave blank." })} />
        {rowErrors?.day && <span id={`${id}-day-error`} role="alert" className="text-xs text-red-600 dark:text-red-400">{rowErrors.day.message}</span>}
      </label>

      <label htmlFor={`${id}-name`} className="min-w-32 flex-1 text-sm font-medium">
        Name
        <input id={`${id}-name`} className={inputClass} placeholder="Bill name" aria-invalid={!!rowErrors?.name} aria-describedby={rowErrors?.name ? `${id}-name-error` : undefined}
          {...register(`bills.${index}.name`, { validate: (value) => !!value.trim() || "Enter a name." })} />
        {rowErrors?.name && <span id={`${id}-name-error`} role="alert" className="text-xs text-red-600 dark:text-red-400">{rowErrors.name.message}</span>}
      </label>

      <label htmlFor={`${id}-cost`} className="w-28 text-sm font-medium">
        Amount
        <input id={`${id}-cost`} type="number" min={0} step="any" inputMode="decimal" className={inputClass}
          aria-invalid={!!rowErrors?.cost} aria-describedby={rowErrors?.cost ? `${id}-cost-error` : undefined}
          {...register(`bills.${index}.cost`, { valueAsNumber: true, validate: (value) => (Number.isFinite(value) && value >= 0) || "Enter an amount of 0 or more." })} />
        {rowErrors?.cost && <span id={`${id}-cost-error`} role="alert" className="text-xs text-red-600 dark:text-red-400">{rowErrors.cost.message}</span>}
      </label>

      <div className="pt-6">
        <button type="button" onClick={onRemove} aria-label={`Remove bill ${index + 1}`} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-red-400 dark:hover:bg-zinc-800">Remove</button>
      </div>
    </div>
  );
}
