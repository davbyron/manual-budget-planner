"use client";

import type { Bill, BillsFormValues } from "@/types";
import type { BillsProps } from "@/types/props";
import { useEffect, useId, useState, useTransition } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { getBills, saveBills } from "@/lib/actions/bills";
import BillRow from "@/components/BillRow";
import Dialog from "@/components/Dialog";

const buttonClass = "rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800";

export default function Bills(props: BillsProps) {
  const { onBillsChange } = props;

  const headingId = useId();

  const [originalBills, setOriginalBills] = useState<Bill[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [formSubmissionSucceeded, setFormSubmissionSucceeded] = useState(false);
  const [requiresReload, setRequiresReload] = useState(false);

  const [pending, startTransition] = useTransition();

  const form = useForm<BillsFormValues>({ defaultValues: { bills: [] } });

  const {
    control,
    reset,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isDirty }
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "bills",
    keyName: "formKey"
  });

  useEffect(() => {
    let active = true;

    startTransition(async () => {
      try {
        const result = await getBills();

        if (!active) return;

        if (result.error !== undefined) {
          setLoadError(result.error);
        } else {
          reset({ bills: result.data });
          setOriginalBills(result.data);
          onBillsChange?.(result.data);
          setLoadError(null);
          setLoaded(true);
        }
      } catch {
        if (active) setLoadError("Could not load bills. Please try again.");
      }
    });

    return () => { active = false; };
  }, [attempt, reset, onBillsChange]);

  const save = handleSubmit(({ bills }) => {
    if (requiresReload) return;

    clearErrors("root");
    setFormSubmissionSucceeded(false);

    startTransition(async () => {
      try {
        const result = await saveBills(bills, originalBills);

        if (result.error !== undefined) {
          setRequiresReload(result.requiresReload ?? false);
          setError("root", { message: result.error });
          return;
        }

        reset({ bills: result.data });
        setOriginalBills(result.data);
        onBillsChange?.(result.data);
       setFormSubmissionSucceeded(true);
      } catch {
        setRequiresReload(true);
        setError("root", {
          message: "Could not confirm the save. Your edits are still here; reload the saved bills before retrying."
        });
      }
    });
  });

  return (
    <section
      aria-labelledby={headingId}
      className="
        p-4 w-full h-full flex flex-col gap-4 text-zinc-900
        bg-white rounded-b-2xl border border-zinc-200 shadow-sm
        sm:p-6 sm:rounded-bl-none sm:rounded-r-2xl
        dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100
      "
    >
      <h2 id={headingId}>Bills</h2>

      <Dialog
        level="info"
        content={(
          <div className="flex flex-col gap-2">
            <p>
              Bills are recurring monthly payments on a scheduled day.
              Bills are automatically deducted from the amount left in
              a pay period if the bill&apos;s day falls within the
              pay period.
            </p>
            <p>
              Add an optional start or end date to indicate when the
              bill should be deductd from the remaining balance in
              your pay periods.
            </p>
          </div>
        )}
      />
      
      {!loaded && !loadError && <p role="status">Loading bills…</p>}

      {loadError && (
        <div
          role="alert"
          className="mb-4 text-sm text-red-600 dark:text-red-400"
        >
          {loadError}
          <button
            type="button"
            disabled={pending}
            onClick={() => setAttempt((value) => value + 1)}
            className={buttonClass}
          >
            Retry
          </button>
        </div>
      )}

      {loaded && (
        <FormProvider {...form}>
          <form
            onSubmit={save}
            noValidate
            aria-label="Bills"
            onChange={() => setFormSubmissionSucceeded(false)}
          >
            <fieldset disabled={pending} className="min-w-0">
              {fields.length === 0 && (
                <p className="py-3 text-sm text-zinc-500 italic dark:text-zinc-400">
                  No bills.
                </p>
              )}

              <ul className="list-none">
                {fields.map((field, index) => (
                  <li key={field.formKey}>
                    <BillRow
                      index={index}
                      onRemove={() => { remove(index); setFormSubmissionSucceeded(false); }}
                    />
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    append({ day: null, name: "New bill", cost: 0, startDate: null, endDate: null });
                    setFormSubmissionSucceeded(false);
                  }}
                  className={buttonClass}
                >
                  + Add new bill
                </button>

                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  {formSubmissionSucceeded && (
                    <p role="status" className="text-sm text-green-600 dark:text-green-400">
                      ✔ Bills saved
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={pending || !isDirty || requiresReload}
                    className={buttonClass}
                  >
                    {pending ? "Saving…" : "Save"}
                  </button>
                </div>
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
                className={`${buttonClass} mt-3`}
                onClick={() => {
                  if (!window.confirm("Reload saved bills? This will discard the unsaved edits in this form.")) return;
                  setLoaded(false);
                  setRequiresReload(false);
                  setFormSubmissionSucceeded(false);
                  setAttempt((value) => value + 1);
                }}
              >
                Reload saved bills
              </button>
            )}
          </form>
        </FormProvider>
      )}
    </section>
  );
}
