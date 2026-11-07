"use client";

import type { IncomeSourcesFormValues } from "@/types";
import type { IncomeSourceRowProps } from "@/types/props";
import { useId, useState } from "react";
import { useController, useFormContext } from "react-hook-form";

const inputClass = "mt-1 w-full min-w-0 rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-blue-600 dark:border-zinc-700";
const dollars = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function IncomeSourceRow(props: IncomeSourceRowProps) {
  const { index, onRemove } = props;

  const id = useId();

  const {
    register,
    control,
    formState: { errors }
  } = useFormContext<IncomeSourcesFormValues>();

  const error = errors.incomeSources?.[index];

  const [draft, setDraft] = useState<string | null>(null);

  const {
    field: {
      name,
      ref: amountRef,
      value,
      onChange,
      onBlur
    }
  } = useController<IncomeSourcesFormValues, `incomeSources.${number}.amount`>({
    control,
    name: `incomeSources.${index}.amount`,
    rules: {
      validate: (amount) => Number.isFinite(amount) || "Enter a valid amount."
    },
  });

  return (
    <div className="flex min-w-0 flex-wrap items-start gap-3 border-t border-zinc-200 py-4 dark:border-zinc-800">
      <label htmlFor={`${id}-name`} className="min-w-32 flex-1 text-sm font-medium">
        Name
        <input
          id={`${id}-name`}
          className={inputClass}
          aria-invalid={!!error?.name}
          aria-describedby={error?.name ? `${id}-name-error` : undefined}
          {...register(`incomeSources.${index}.name`, {
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

      <label htmlFor={`${id}-amount`} className="w-28 text-sm font-medium">
        Amount
        <input
          id={`${id}-amount`}
          type="text"
          inputMode="decimal"
          className={inputClass}
          name={name}
          ref={amountRef}
          value={draft ?? (Number.isFinite(value) ? dollars.format(value) : "")}
          aria-invalid={!!error?.amount}
          aria-describedby={error?.amount ? `${id}-amount-error` : undefined}
          onFocus={() => setDraft(Number.isFinite(value) ? value.toFixed(2) : "")}
          onChange={(event) => {
            const text = event.target.value.replace(/[$,]/g, "").trim();
            if (!/^-?\d*(\.\d{0,2})?$/.test(text)) return;
            setDraft(text);
            onChange(text === "" ? NaN : Number(text));
          }}
          onBlur={() => { setDraft(null); onBlur(); }}
        />
        {error?.amount && (
          <span
            id={`${id}-amount-error`}
            role="alert"
            className="text-xs text-red-600 dark:text-red-400"
          >
            {error.amount.message}
          </span>
        )}
      </label>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove income source ${index + 1}`}
        className="mt-6 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-red-600 disabled:opacity-50 dark:border-zinc-700 dark:text-red-400"
      >
        Remove
      </button>
    </div>
  );
}
