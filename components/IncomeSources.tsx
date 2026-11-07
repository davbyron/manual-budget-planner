"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { getIncomeSources, saveIncomeSources } from "@/lib/actions/income-sources";
import IncomeSourceRow from "@/components/IncomeSourceRow";
import type { IncomeSource, IncomeSourcesFormValues } from "@/types";
import type { IncomeSourcesProps } from "@/types/props";

const buttonClass = "rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800";

export default function IncomeSources(props: IncomeSourcesProps) {
  const { onIncomeSourcesChange } = props;
  const headingId = useId();
  const [originalIncomeSources, setOriginalIncomeSources] = useState<IncomeSource[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [message, setMessage] = useState("");
  const [requiresReload, setRequiresReload] = useState(false);
  const [pending, startTransition] = useTransition();
  const form = useForm<IncomeSourcesFormValues>({ defaultValues: { incomeSources: [] } });
  const { control, reset, handleSubmit, setError, clearErrors, formState: { errors, isDirty } } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "incomeSources", keyName: "formKey" });

  useEffect(() => {
    let active = true;
    startTransition(async () => {
      try {
        const result = await getIncomeSources();
        if (!active) return;
        if (result.error !== undefined) setLoadError(result.error);
        else {
          reset({ incomeSources: result.data });
          setOriginalIncomeSources(result.data);
          onIncomeSourcesChange?.(result.data);
          setLoadError(null);
          setLoaded(true);
        }
      } catch {
        if (active) setLoadError("Could not load income sources. Please try again.");
      }
    });
    return () => { active = false; };
  }, [attempt, reset, onIncomeSourcesChange]);

  const save = handleSubmit(({ incomeSources }) => {
    if (requiresReload) return;
    clearErrors("root");
    setMessage("");
    startTransition(async () => {
      try {
        const result = await saveIncomeSources(incomeSources, originalIncomeSources);
        if (result.error !== undefined) {
          setRequiresReload(result.requiresReload ?? false);
          setError("root", { message: result.error });
          return;
        }
        reset({ incomeSources: result.data });
        setOriginalIncomeSources(result.data);
        onIncomeSourcesChange?.(result.data);
        setMessage("Income sources saved.");
      } catch {
        setRequiresReload(true);
        setError("root", { message: "Could not confirm the save. Your edits are still here; reload the saved income sources before retrying." });
      }
    });
  });

  return (
    <section
      aria-labelledby={headingId}
      className="w-full h-full rounded-r-2xl border border-zinc-200 bg-white p-4 text-zinc-900 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
    >
      <h2 id={headingId} className="mb-2">Income sources</h2>
      {!loaded && !loadError && <p role="status">Loading income sources…</p>}
      {loadError && <div role="alert" className="mb-4 text-sm text-red-600 dark:text-red-400">{loadError} <button type="button" disabled={pending} onClick={() => setAttempt((value) => value + 1)} className={buttonClass}>Retry</button></div>}
      {loaded && <FormProvider {...form}>
        <form onSubmit={save} noValidate aria-label="Income sources" onChange={() => setMessage("")}>
          <fieldset disabled={pending}>
            {fields.length === 0 && <p className="py-3 text-sm text-zinc-500 dark:text-zinc-400">No income sources.</p>}
            <ul className="list-none">
              {fields.map((field, index) => <li key={field.formKey}><IncomeSourceRow index={index} onRemove={() => { remove(index); setMessage(""); }} /></li>)}
            </ul>
            <div className="mt-4 flex flex-wrap justify-between gap-3">
              <button type="button" onClick={() => { append({ name: "New income source", amount: 0 }); setMessage(""); }} className={buttonClass}>+ Add new income source</button>
              <button type="submit" disabled={pending || !isDirty || requiresReload} className={buttonClass}>{pending ? "Saving…" : "Save"}</button>
            </div>
          </fieldset>
          {errors.root && <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">{errors.root.message}</p>}
          {requiresReload && <button type="button" disabled={pending} className={`${buttonClass} mt-3`} onClick={() => {
            if (!window.confirm("Reload saved income sources? This will discard the unsaved edits in this form.")) return;
            setLoaded(false);
            setRequiresReload(false);
            setMessage("");
            setAttempt((value) => value + 1);
          }}>Reload saved income sources</button>}
          <p role="status" className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
        </form>
      </FormProvider>}
    </section>
  );
}
