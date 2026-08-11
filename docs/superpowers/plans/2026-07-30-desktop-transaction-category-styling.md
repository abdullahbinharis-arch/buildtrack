# Desktop Transaction Category Styling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add colored category pills, per-category row accents, and signed/colored amounts to every desktop table on the project detail page, sharing one style map with the existing mobile cards.

**Architecture:** A new `lib/category-styles.ts` exports a `CATEGORY_STYLES` record (single source of truth for the 6 transaction categories). `DataTable` gains an optional `getRowClassName` prop for row accents. `ProjectDetailClient.tsx` uses the map in all desktop column renders and replaces its 7 hardcoded mobile card color strings with the same map.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Tailwind CSS 3.

**Spec:** `docs/superpowers/specs/2026-07-30-desktop-transaction-category-styling-design.md`

## Global Constraints

- This project has **no test runner** (no jest/vitest). Per the spec, verification is `npx tsc --noEmit` per task and `npm run build` at the end, plus a manual visual check. Do not add a test framework.
- Category keys must exactly match the 6 literals already used in `ProjectDetailClient.tsx`: `'Owner Payment'`, `'Owner Direct'`, `'Subcontractor'`, `'Material'`, `'Misc'`, `'Commission Payout'`.
- Mobile card visual output must stay the same — only the source of the class strings changes.
- Do not change forms, tabs, summary cards, PDF report, Excel export, or any API route.
- Commit steps are included for the workflow; run them only with the user's confirmation.

---

### Task 1: Category style map + Tailwind content glob

`tailwind.config.ts` currently scans only `./pages/**`, `./components/**`, `./app/**` — classes in `lib/` would not be generated. Both changes are required together.

**Files:**
- Modify: `tailwind.config.ts:4-8`
- Create: `lib/category-styles.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `export type CategoryKey = 'Owner Payment' | 'Owner Direct' | 'Subcontractor' | 'Material' | 'Misc' | 'Commission Payout'`
  - `export interface CategoryStyle { badgeClass: string; rowClass: string; amountClass: string; sign: '+' | '-' }`
  - `export const CATEGORY_STYLES: Record<CategoryKey, CategoryStyle>`
  - `export function categoryBadgeClass(category: CategoryKey): string`

- [ ] **Step 1: Add `lib/` to Tailwind content globs**

In `tailwind.config.ts`, change:

```ts
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
```

to:

```ts
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
```

- [ ] **Step 2: Create `lib/category-styles.ts`**

```ts
export type CategoryKey =
  | 'Owner Payment'
  | 'Owner Direct'
  | 'Subcontractor'
  | 'Material'
  | 'Misc'
  | 'Commission Payout';

export interface CategoryStyle {
  /** Tailwind classes for the category pill/badge */
  badgeClass: string;
  /** Tailwind classes for the desktop table row accent (left border) */
  rowClass: string;
  /** Text color class for the amount */
  amountClass: string;
  /** Sign prefix for the amount ('+' income, '-' expense) */
  sign: '+' | '-';
}

export const CATEGORY_STYLES: Record<CategoryKey, CategoryStyle> = {
  'Owner Payment': {
    badgeClass: 'bg-emerald-100/80 text-emerald-700',
    rowClass: 'border-l-4 border-l-emerald-400',
    amountClass: 'text-emerald-600',
    sign: '+',
  },
  'Owner Direct': {
    badgeClass: 'bg-rose-100/80 text-rose-700',
    rowClass: 'border-l-4 border-l-rose-400',
    amountClass: 'text-rose-600',
    sign: '-',
  },
  Subcontractor: {
    badgeClass: 'bg-amber-100/80 text-amber-700',
    rowClass: 'border-l-4 border-l-amber-400',
    amountClass: 'text-rose-600',
    sign: '-',
  },
  Material: {
    badgeClass: 'bg-blue-100/80 text-blue-700',
    rowClass: 'border-l-4 border-l-blue-400',
    amountClass: 'text-rose-600',
    sign: '-',
  },
  Misc: {
    badgeClass: 'bg-slate-200/80 text-slate-700',
    rowClass: 'border-l-4 border-l-slate-400',
    amountClass: 'text-rose-600',
    sign: '-',
  },
  'Commission Payout': {
    badgeClass: 'bg-purple-100/80 text-purple-700',
    rowClass: 'border-l-4 border-l-purple-400',
    amountClass: 'text-rose-600',
    sign: '-',
  },
};

const BADGE_BASE =
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-white/60 backdrop-blur-sm';

/** Full class list for a category pill, matching the mobile card badges. */
export function categoryBadgeClass(category: CategoryKey): string {
  return `${BADGE_BASE} ${CATEGORY_STYLES[category].badgeClass}`;
}
```

- [ ] **Step 3: Verify type check**

Run: `cd /Users/abdullaharris/expense-tracker && npx tsc --noEmit`
Expected: exit 0, no output.

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.ts lib/category-styles.ts
git commit -m "feat: shared category style map for transaction categories"
```

---

### Task 2: `getRowClassName` prop on DataTable

**Files:**
- Modify: `components/DataTable.tsx:15-24` (interface), `components/DataTable.tsx:26-33` (destructure), `components/DataTable.tsx:130` (`<tr>`)

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: `DataTableProps<T>` gains optional `getRowClassName?: (row: T) => string` — used by Tasks 3 and 4.

- [ ] **Step 1: Add the prop to the interface**

In `components/DataTable.tsx`, change the `DataTableProps` interface:

```ts
interface DataTableProps<T extends DataTableRow = DataTableRow> {
  columns: Column<T>[];
  rows: T[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  /** If provided, renders a card-based list on mobile (< md) instead of the table. The table is still shown on md+. */
  renderCard?: (row: T) => React.ReactNode;
  /** Used for date grouping in card view. Defaults to (row) => row.date */
  getCardDate?: (row: T) => string;
}
```

to:

```ts
interface DataTableProps<T extends DataTableRow = DataTableRow> {
  columns: Column<T>[];
  rows: T[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  /** If provided, renders a card-based list on mobile (< md) instead of the table. The table is still shown on md+. */
  renderCard?: (row: T) => React.ReactNode;
  /** Used for date grouping in card view. Defaults to (row) => row.date */
  getCardDate?: (row: T) => string;
  /** Optional per-row class names applied to each desktop table row (<tr>). */
  getRowClassName?: (row: T) => string;
}
```

- [ ] **Step 2: Destructure the prop and apply it to `<tr>`**

Change the destructuring:

```ts
export function DataTable<T extends DataTableRow>({
  columns,
  rows,
  onEdit,
  onDelete,
  renderCard,
  getCardDate,
}: DataTableProps<T>) {
```

to:

```ts
export function DataTable<T extends DataTableRow>({
  columns,
  rows,
  onEdit,
  onDelete,
  renderCard,
  getCardDate,
  getRowClassName,
}: DataTableProps<T>) {
```

Then change the desktop body row (line ~130):

```tsx
                    <tr key={row.id}>
```

to:

```tsx
                    <tr key={row.id} className={getRowClassName?.(row)}>
```

- [ ] **Step 3: Verify type check**

Run: `cd /Users/abdullaharris/expense-tracker && npx tsc --noEmit`
Expected: exit 0, no output.

- [ ] **Step 4: Commit**

```bash
git add components/DataTable.tsx
git commit -m "feat: optional getRowClassName prop on DataTable for row accents"
```

---

### Task 3: All Transactions tab — badges, signed amounts, row accents

**Files:**
- Modify: `app/project/[id]/ProjectDetailClient.tsx:1-30` (imports), `app/project/[id]/ProjectDetailClient.tsx:768-811` (All Transactions DataTable)

**Interfaces:**
- Consumes: `CATEGORY_STYLES`, `categoryBadgeClass`, `CategoryKey` from `@/lib/category-styles` (Task 1); `getRowClassName` prop on `DataTable` (Task 2).
- Produces: nothing new for later tasks.

Note: `allTransactions` rows have `category` typed as `string` (widened from literals), so renders cast with `as CategoryKey`. The values are always one of the 6 literals because they are assigned literally where `allTransactions` is built (lines 353-360), so the cast is safe.

- [ ] **Step 1: Add the import**

In `app/project/[id]/ProjectDetailClient.tsx`, after the existing line `import { formatCurrency, formatDate } from '@/lib/utils';` add:

```ts
import { CATEGORY_STYLES, categoryBadgeClass, type CategoryKey } from '@/lib/category-styles';
```

- [ ] **Step 2: Replace the All Transactions DataTable block**

Replace this entire block (current lines 768-811):

```tsx
              <DataTable
                columns={[
                  { key: 'date', label: 'Date', render: dateCell },
                  { key: 'category', label: 'Category' },
                  { key: 'description', label: 'Description' },
                  { key: 'amount', label: 'Amount', render: (r) => formatCurrency(r.amount) },
                ]}
                rows={allTransactions}
                onEdit={editFromAll}
                onDelete={deleteFromAll}
                renderCard={(row) => {
                  const isIncome = row.category === 'Owner Payment';
                  const categoryColors: Record<string, string> = {
                    'Owner Payment': 'bg-emerald-100/80 text-emerald-700',
                    'Owner Direct': 'bg-rose-100/80 text-rose-700',
                    'Subcontractor': 'bg-amber-100/80 text-amber-700',
                    'Material': 'bg-blue-100/80 text-blue-700',
                    'Misc': 'bg-slate-200/80 text-slate-700',
                    'Commission Payout': 'bg-purple-100/80 text-purple-700',
                  };
                  return (
                    <>
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span
                          className={
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-white/60 backdrop-blur-sm ' +
                            (categoryColors[row.category] || 'bg-slate-100/80 text-slate-700')
                          }
                        >
                          {row.category}
                        </span>
                        <span className="text-xs text-slate-500">{formatDate(row.date)}</span>
                      </div>
                      {row.description && (
                        <p className="mb-1 truncate text-sm text-slate-600">{row.description}</p>
                      )}
                      <p className={`text-lg font-bold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatCurrency(row.amount)}
                      </p>
                    </>
                  );
                }}
                getCardDate={(row) => row.date}
              />
```

with:

```tsx
              <DataTable
                columns={[
                  { key: 'date', label: 'Date', render: dateCell },
                  {
                    key: 'category',
                    label: 'Category',
                    render: (r) => (
                      <span className={categoryBadgeClass(r.category as CategoryKey)}>
                        {r.category}
                      </span>
                    ),
                  },
                  { key: 'description', label: 'Description' },
                  {
                    key: 'amount',
                    label: 'Amount',
                    render: (r) => {
                      const style = CATEGORY_STYLES[r.category as CategoryKey];
                      return (
                        <span className={`font-semibold ${style.amountClass}`}>
                          {style.sign} {formatCurrency(r.amount)}
                        </span>
                      );
                    },
                  },
                ]}
                rows={allTransactions}
                onEdit={editFromAll}
                onDelete={deleteFromAll}
                getRowClassName={(r) => CATEGORY_STYLES[r.category as CategoryKey].rowClass}
                renderCard={(row) => {
                  const style = CATEGORY_STYLES[row.category as CategoryKey];
                  return (
                    <>
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className={categoryBadgeClass(row.category as CategoryKey)}>
                          {row.category}
                        </span>
                        <span className="text-xs text-slate-500">{formatDate(row.date)}</span>
                      </div>
                      {row.description && (
                        <p className="mb-1 truncate text-sm text-slate-600">{row.description}</p>
                      )}
                      <p className={`text-lg font-bold ${style.amountClass}`}>
                        {formatCurrency(row.amount)}
                      </p>
                    </>
                  );
                }}
                getCardDate={(row) => row.date}
              />
```

Note: the mobile card amount intentionally keeps no sign prefix — mobile output stays byte-identical in appearance; only the desktop columns gain signs.

- [ ] **Step 3: Verify type check**

Run: `cd /Users/abdullaharris/expense-tracker && npx tsc --noEmit`
Expected: exit 0, no output.

- [ ] **Step 4: Commit**

```bash
git add app/project/[id]/ProjectDetailClient.tsx
git commit -m "feat: category badges, signed amounts, row accents on All Transactions desktop table"
```

---

### Task 4: Individual tabs — signed amounts, row accents, shared mobile styles

Each step replaces one tab's `DataTable` block in `app/project/[id]/ProjectDetailClient.tsx`. Every replacement also swaps that tab's hardcoded mobile `renderCard` color strings for `CATEGORY_STYLES` / `categoryBadgeClass` lookups, with identical visual output.

**Files:**
- Modify: `app/project/[id]/ProjectDetailClient.tsx` (Payment Received block lines 600-622; Owner Direct block lines 640-666; Subcontractor block lines 685-712; Material block lines 730-756; Misc block lines 829-855; Commission Payout block lines 874-896)

**Interfaces:**
- Consumes: `CATEGORY_STYLES`, `categoryBadgeClass` (Task 1); `getRowClassName` (Task 2); import added in Task 3 Step 1.
- Produces: nothing new.

- [ ] **Step 1: Payment Received tab**

Replace (lines 600-622):

```tsx
              <DataTable
                columns={[
                  { key: 'date', label: 'Date', render: dateCell },
                  { key: 'amount', label: 'Amount', render: (r) => formatCurrency(r.amount) },
                ]}
                rows={project.owner_payments}
                onEdit={(r) => setEditing(r)}
                onDelete={(r) => setDeleting({ type: 'owner', id: r.id })}
                renderCard={(row) => (
                  <>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-white/60 backdrop-blur-sm">
                        Owner Payment
                      </span>
                      <span className="text-xs text-slate-500">{formatDate(row.date)}</span>
                    </div>
                    <p className="text-lg font-bold text-emerald-600">
                      + {formatCurrency(row.amount)}
                    </p>
                  </>
                )}
                getCardDate={(row) => row.date}
              />
```

with:

```tsx
              <DataTable
                columns={[
                  { key: 'date', label: 'Date', render: dateCell },
                  {
                    key: 'amount',
                    label: 'Amount',
                    render: (r) => (
                      <span className={`font-semibold ${CATEGORY_STYLES['Owner Payment'].amountClass}`}>
                        {CATEGORY_STYLES['Owner Payment'].sign} {formatCurrency(r.amount)}
                      </span>
                    ),
                  },
                ]}
                rows={project.owner_payments}
                onEdit={(r) => setEditing(r)}
                onDelete={(r) => setDeleting({ type: 'owner', id: r.id })}
                getRowClassName={() => CATEGORY_STYLES['Owner Payment'].rowClass}
                renderCard={(row) => (
                  <>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className={categoryBadgeClass('Owner Payment')}>
                        Owner Payment
                      </span>
                      <span className="text-xs text-slate-500">{formatDate(row.date)}</span>
                    </div>
                    <p className={`text-lg font-bold ${CATEGORY_STYLES['Owner Payment'].amountClass}`}>
                      {CATEGORY_STYLES['Owner Payment'].sign} {formatCurrency(row.amount)}
                    </p>
                  </>
                )}
                getCardDate={(row) => row.date}
              />
```

- [ ] **Step 2: Owner Direct Payments tab**

Replace (lines 640-666):

```tsx
              <DataTable
                columns={[
                  { key: 'date', label: 'Date', render: dateCell },
                  { key: 'description', label: 'Description' },
                  { key: 'amount', label: 'Amount', render: (r) => formatCurrency(r.amount) },
                ]}
                rows={project.owner_direct_payments}
                onEdit={(r) => setEditing(r)}
                onDelete={(r) => setDeleting({ type: 'owner_direct', id: r.id })}
                renderCard={(row) => (
                  <>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center rounded-full bg-rose-100/80 px-2.5 py-0.5 text-xs font-semibold text-rose-700 ring-1 ring-white/60 backdrop-blur-sm">
                        Owner Direct
                      </span>
                      <span className="text-xs text-slate-500">{formatDate(row.date)}</span>
                    </div>
                    {row.description && (
                      <p className="mb-1 truncate text-sm text-slate-600">{row.description}</p>
                    )}
                    <p className="text-lg font-bold text-rose-600">
                      - {formatCurrency(row.amount)}
                    </p>
                  </>
                )}
                getCardDate={(row) => row.date}
              />
```

with:

```tsx
              <DataTable
                columns={[
                  { key: 'date', label: 'Date', render: dateCell },
                  { key: 'description', label: 'Description' },
                  {
                    key: 'amount',
                    label: 'Amount',
                    render: (r) => (
                      <span className={`font-semibold ${CATEGORY_STYLES['Owner Direct'].amountClass}`}>
                        {CATEGORY_STYLES['Owner Direct'].sign} {formatCurrency(r.amount)}
                      </span>
                    ),
                  },
                ]}
                rows={project.owner_direct_payments}
                onEdit={(r) => setEditing(r)}
                onDelete={(r) => setDeleting({ type: 'owner_direct', id: r.id })}
                getRowClassName={() => CATEGORY_STYLES['Owner Direct'].rowClass}
                renderCard={(row) => (
                  <>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className={categoryBadgeClass('Owner Direct')}>
                        Owner Direct
                      </span>
                      <span className="text-xs text-slate-500">{formatDate(row.date)}</span>
                    </div>
                    {row.description && (
                      <p className="mb-1 truncate text-sm text-slate-600">{row.description}</p>
                    )}
                    <p className={`text-lg font-bold ${CATEGORY_STYLES['Owner Direct'].amountClass}`}>
                      {CATEGORY_STYLES['Owner Direct'].sign} {formatCurrency(row.amount)}
                    </p>
                  </>
                )}
                getCardDate={(row) => row.date}
              />
```

- [ ] **Step 3: Subcontractor Payments tab (Type column also gets a badge)**

Replace (lines 685-712):

```tsx
              <DataTable
                columns={[
                  { key: 'date', label: 'Date', render: dateCell },
                  { key: 'type', label: 'Type' },
                  { key: 'description', label: 'Description' },
                  { key: 'amount', label: 'Amount', render: (r) => formatCurrency(r.amount) },
                ]}
                rows={project.subcontractor_payments}
                onEdit={(r) => setEditing(r)}
                onDelete={(r) => setDeleting({ type: 'sub', id: r.id })}
                renderCard={(row) => (
                  <>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center rounded-full bg-amber-100/80 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-white/60 backdrop-blur-sm">
                        {row.type}
                      </span>
                      <span className="text-xs text-slate-500">{formatDate(row.date)}</span>
                    </div>
                    {row.description && (
                      <p className="mb-1 truncate text-sm text-slate-600">{row.description}</p>
                    )}
                    <p className="text-lg font-bold text-rose-600">
                      - {formatCurrency(row.amount)}
                    </p>
                  </>
                )}
                getCardDate={(row) => row.date}
              />
```

with:

```tsx
              <DataTable
                columns={[
                  { key: 'date', label: 'Date', render: dateCell },
                  {
                    key: 'type',
                    label: 'Type',
                    render: (r) => (
                      <span className={categoryBadgeClass('Subcontractor')}>
                        {r.type}
                      </span>
                    ),
                  },
                  { key: 'description', label: 'Description' },
                  {
                    key: 'amount',
                    label: 'Amount',
                    render: (r) => (
                      <span className={`font-semibold ${CATEGORY_STYLES.Subcontractor.amountClass}`}>
                        {CATEGORY_STYLES.Subcontractor.sign} {formatCurrency(r.amount)}
                      </span>
                    ),
                  },
                ]}
                rows={project.subcontractor_payments}
                onEdit={(r) => setEditing(r)}
                onDelete={(r) => setDeleting({ type: 'sub', id: r.id })}
                getRowClassName={() => CATEGORY_STYLES.Subcontractor.rowClass}
                renderCard={(row) => (
                  <>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className={categoryBadgeClass('Subcontractor')}>
                        {row.type}
                      </span>
                      <span className="text-xs text-slate-500">{formatDate(row.date)}</span>
                    </div>
                    {row.description && (
                      <p className="mb-1 truncate text-sm text-slate-600">{row.description}</p>
                    )}
                    <p className={`text-lg font-bold ${CATEGORY_STYLES.Subcontractor.amountClass}`}>
                      {CATEGORY_STYLES.Subcontractor.sign} {formatCurrency(row.amount)}
                    </p>
                  </>
                )}
                getCardDate={(row) => row.date}
              />
```

- [ ] **Step 4: Material Expenses tab**

Replace (lines 730-756):

```tsx
              <DataTable
                columns={[
                  { key: 'date', label: 'Date', render: dateCell },
                  { key: 'description', label: 'Description' },
                  { key: 'amount', label: 'Amount', render: (r) => formatCurrency(r.amount) },
                ]}
                rows={project.material_expenses}
                onEdit={(r) => setEditing(r)}
                onDelete={(r) => setDeleting({ type: 'expense', id: r.id })}
                renderCard={(row) => (
                  <>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center rounded-full bg-blue-100/80 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-white/60 backdrop-blur-sm">
                        Material
                      </span>
                      <span className="text-xs text-slate-500">{formatDate(row.date)}</span>
                    </div>
                    {row.description && (
                      <p className="mb-1 truncate text-sm text-slate-600">{row.description}</p>
                    )}
                    <p className="text-lg font-bold text-rose-600">
                      - {formatCurrency(row.amount)}
                    </p>
                  </>
                )}
                getCardDate={(row) => row.date}
              />
```

with:

```tsx
              <DataTable
                columns={[
                  { key: 'date', label: 'Date', render: dateCell },
                  { key: 'description', label: 'Description' },
                  {
                    key: 'amount',
                    label: 'Amount',
                    render: (r) => (
                      <span className={`font-semibold ${CATEGORY_STYLES.Material.amountClass}`}>
                        {CATEGORY_STYLES.Material.sign} {formatCurrency(r.amount)}
                      </span>
                    ),
                  },
                ]}
                rows={project.material_expenses}
                onEdit={(r) => setEditing(r)}
                onDelete={(r) => setDeleting({ type: 'expense', id: r.id })}
                getRowClassName={() => CATEGORY_STYLES.Material.rowClass}
                renderCard={(row) => (
                  <>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className={categoryBadgeClass('Material')}>
                        Material
                      </span>
                      <span className="text-xs text-slate-500">{formatDate(row.date)}</span>
                    </div>
                    {row.description && (
                      <p className="mb-1 truncate text-sm text-slate-600">{row.description}</p>
                    )}
                    <p className={`text-lg font-bold ${CATEGORY_STYLES.Material.amountClass}`}>
                      {CATEGORY_STYLES.Material.sign} {formatCurrency(row.amount)}
                    </p>
                  </>
                )}
                getCardDate={(row) => row.date}
              />
```

- [ ] **Step 5: Misc Expenses tab**

Replace (lines 829-855):

```tsx
              <DataTable
                columns={[
                  { key: 'date', label: 'Date', render: dateCell },
                  { key: 'description', label: 'Description' },
                  { key: 'amount', label: 'Amount', render: (r) => formatCurrency(r.amount) },
                ]}
                rows={project.miscellaneous_expenses}
                onEdit={(r) => setEditing(r)}
                onDelete={(r) => setDeleting({ type: 'misc', id: r.id })}
                renderCard={(row) => (
                  <>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center rounded-full bg-slate-200/80 px-2.5 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-white/60 backdrop-blur-sm">
                        Misc
                      </span>
                      <span className="text-xs text-slate-500">{formatDate(row.date)}</span>
                    </div>
                    {row.description && (
                      <p className="mb-1 truncate text-sm text-slate-600">{row.description}</p>
                    )}
                    <p className="text-lg font-bold text-rose-600">
                      - {formatCurrency(row.amount)}
                    </p>
                  </>
                )}
                getCardDate={(row) => row.date}
              />
```

with:

```tsx
              <DataTable
                columns={[
                  { key: 'date', label: 'Date', render: dateCell },
                  { key: 'description', label: 'Description' },
                  {
                    key: 'amount',
                    label: 'Amount',
                    render: (r) => (
                      <span className={`font-semibold ${CATEGORY_STYLES.Misc.amountClass}`}>
                        {CATEGORY_STYLES.Misc.sign} {formatCurrency(r.amount)}
                      </span>
                    ),
                  },
                ]}
                rows={project.miscellaneous_expenses}
                onEdit={(r) => setEditing(r)}
                onDelete={(r) => setDeleting({ type: 'misc', id: r.id })}
                getRowClassName={() => CATEGORY_STYLES.Misc.rowClass}
                renderCard={(row) => (
                  <>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className={categoryBadgeClass('Misc')}>
                        Misc
                      </span>
                      <span className="text-xs text-slate-500">{formatDate(row.date)}</span>
                    </div>
                    {row.description && (
                      <p className="mb-1 truncate text-sm text-slate-600">{row.description}</p>
                    )}
                    <p className={`text-lg font-bold ${CATEGORY_STYLES.Misc.amountClass}`}>
                      {CATEGORY_STYLES.Misc.sign} {formatCurrency(row.amount)}
                    </p>
                  </>
                )}
                getCardDate={(row) => row.date}
              />
```

- [ ] **Step 6: Commission Payout tab**

Replace (lines 874-896):

```tsx
              <DataTable
                columns={[
                  { key: 'date', label: 'Date', render: dateCell },
                  { key: 'amount', label: 'Amount', render: (r) => formatCurrency(r.amount) },
                ]}
                rows={project.commission_payouts}
                onEdit={(r) => setEditing(r)}
                onDelete={(r) => setDeleting({ type: 'commission_payout', id: r.id })}
                renderCard={(row) => (
                  <>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center rounded-full bg-purple-100/80 px-2.5 py-0.5 text-xs font-semibold text-purple-700 ring-1 ring-white/60 backdrop-blur-sm">
                        Commission
                      </span>
                      <span className="text-xs text-slate-500">{formatDate(row.date)}</span>
                    </div>
                    <p className="text-lg font-bold text-rose-600">
                      - {formatCurrency(row.amount)}
                    </p>
                  </>
                )}
                getCardDate={(row) => row.date}
              />
```

with:

```tsx
              <DataTable
                columns={[
                  { key: 'date', label: 'Date', render: dateCell },
                  {
                    key: 'amount',
                    label: 'Amount',
                    render: (r) => (
                      <span className={`font-semibold ${CATEGORY_STYLES['Commission Payout'].amountClass}`}>
                        {CATEGORY_STYLES['Commission Payout'].sign} {formatCurrency(r.amount)}
                      </span>
                    ),
                  },
                ]}
                rows={project.commission_payouts}
                onEdit={(r) => setEditing(r)}
                onDelete={(r) => setDeleting({ type: 'commission_payout', id: r.id })}
                getRowClassName={() => CATEGORY_STYLES['Commission Payout'].rowClass}
                renderCard={(row) => (
                  <>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className={categoryBadgeClass('Commission Payout')}>
                        Commission
                      </span>
                      <span className="text-xs text-slate-500">{formatDate(row.date)}</span>
                    </div>
                    <p className={`text-lg font-bold ${CATEGORY_STYLES['Commission Payout'].amountClass}`}>
                      {CATEGORY_STYLES['Commission Payout'].sign} {formatCurrency(row.amount)}
                    </p>
                  </>
                )}
                getCardDate={(row) => row.date}
              />
```

(The mobile badge text stays "Commission" — same as before.)

- [ ] **Step 7: Verify type check**

Run: `cd /Users/abdullaharris/expense-tracker && npx tsc --noEmit`
Expected: exit 0, no output.

- [ ] **Step 8: Commit**

```bash
git add app/project/[id]/ProjectDetailClient.tsx
git commit -m "feat: signed colored amounts and row accents on all transaction tabs"
```

---

### Task 5: Full build + visual verification

**Files:** none modified.

**Interfaces:**
- Consumes: everything above.
- Produces: verified working build.

- [ ] **Step 1: Production build**

Run: `cd /Users/abdullaharris/expense-tracker && npm run build`
Expected: `✓ Compiled successfully`, no type errors. (This also confirms Tailwind generates the new `border-l-*` classes from `lib/`.)

- [ ] **Step 2: Visual check (manual)**

Run `npm run dev`, open a project detail page, and verify:

- Desktop width, **All Transactions** tab: each row shows a colored category pill, a colored left border matching the category, and a signed colored amount (green `+` for Owner Payment, red `−` for everything else).
- Desktop width, each individual tab: amounts are signed and colored; rows have the tab's category left border; Subcontractor Type shows as an amber pill.
- Mobile width (< 768px), All Transactions and individual tabs: cards look exactly as before.

- [ ] **Step 3: Final commit (if anything was adjusted)**

```bash
git add -A
git commit -m "fix: adjustments from visual verification"
```
