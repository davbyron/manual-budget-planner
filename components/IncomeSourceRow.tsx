"use client";

import type { IncomeSourcesFormValues } from "@/types";
import type { IncomeSourceRowProps } from "@/types/props";
import { useId, useState } from "react";
import { useController, useFormContext } from "react-hook-form";
import { PiTrashDuotone } from "react-icons/pi";

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
      validate: (amount) => Number.isFinite(amount) || "Invalid amount"
    },
  });

  return (
    <tr className="border-b border-zinc-200 hover:bg-zinc-200 [&>*:not(:last-child)]:border-r [&>*:not(:last-child)]:border-r-zinc-200">
      {/* Name */}
      <td>
        <label htmlFor={`${id}-name`}>
          <span className="sr-only">Name</span>
          <input
            id={`${id}-name`}
            aria-invalid={!!error?.name}
            aria-describedby={error?.name ? `${id}-name-error` : undefined}
            {...register(`incomeSources.${index}.name`, {
              validate: (text) => !!text.trim() || "Required"
            })}
          />
          {error?.name && (
            <span
              id={`${id}-name-error`}
              role="alert"
              className="text-xs text-red-500"
            >
              {error.name.message}
            </span>
          )}
        </label>
      </td>

      {/* Amount */}
      <td>
        <label htmlFor={`${id}-amount`}>
          <span className="sr-only">Amount</span>
          <input
            id={`${id}-amount`}
            type="text"
            inputMode="decimal"
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
              className="text-xs text-red-500"
            >
              {error.amount.message}
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
