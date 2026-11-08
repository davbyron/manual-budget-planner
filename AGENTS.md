<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project conventions

- Store all type and interface declarations in the `types/` folder. Keep component props in `types/props.ts` and shared application types in `types/index.ts`. Import types into components and runtime modules rather than declaring them there.

- Only store one component per file in the `components/` folder.

- Store necessary util functions under `lib/utils/`.

- When an HTML or JSX element has a long string of attributes, place each of them on a new line. Example:
```typescript
<form
  onSubmit={save}
  noValidate
  aria-label={originalPayPeriodData ? `Edit pay period ${originalPayPeriodData.start_date} to ${originalPayPeriodData.end_date}` : "New pay period"}
  onChange={() => setFormSubmissionSucceeded(false)}
>
  <fieldset disabled={pending} className="min-w-0">
    <div className="flex flex-wrap gap-3">
      <label htmlFor={`${id}-start`} className="min-w-40 flex-1 text-sm font-medium">
        Start date
        <input
          id={`${id}-start`}
          type="date"
          className={inputClass}
          aria-invalid={!!errors.start_date}
          aria-describedby={errors.start_date ? `${id}-start-error` : undefined}
          {...register("start_date", {
            validate: (date) => !!date && !validateBillDates(date, null) || "Enter a valid start date.",
            deps: ["end_date"]
          })}
        />

  // rest of form
</form>
```

- Always extract props like so:
```typescript
export default function PayPeriodForm(props: PayPeriodFormProps) {
  const { period, onSaved, onCancel, onReload } = props;

  // rest of component
}
```

- Always import types before all other imports.
