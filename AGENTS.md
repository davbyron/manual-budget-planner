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

- Imports should follow the structure of the example below. Generally, the order of imports should be: directives, types, imports from installed packages, local functions, local components. Directives should always be followed by an empty line. Order each import alphabetically within their respective groups (i.e., order type imports alphabetically, packages alphabetically, etc.).

Imports example:
```
"use client";

import type { BillsFormValues } from "@/types";
import type { BillRowProps } from "@/types/props";
import { useId, useState, useMemo } from "react";
import { useController, useFormContext } from "react-hook-form";
import { validateBillDates } from "@/lib/utils/bills";
import { Calendar } from "@/lib/utils/Calendar";
```

- Tailwind class names should follow this general order: group, position, margin, padding, width, height, display, text, font, background, border radius, z-index, hover pseudo class, active pseudo class, focus pseudo class. Any unclear categories for styles would fall between z-index and hover pseudo class. Group together similar styles (e.g., `items-center` and `gap-4` go before `bg-cover`).
