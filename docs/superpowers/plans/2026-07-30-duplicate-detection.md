# Possible-Duplicate Detection Implementation Plan

**Goal:** Highlight possible duplicate transactions (same category + amount, dates ≤ 3 days apart) in all tables, and warn at entry time with an Add Anyway / Go Back override.

**Spec:** `docs/superpowers/specs/2026-07-30-duplicate-detection-design.md`

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS 3. No test runner — verify with `npx tsc --noEmit` per task, `npm run build` at the end. Commits on main per repo pattern; push at the end to deploy.

---

### Task 1: `lib/find-duplicates.ts`

Create:

```ts
export interface DuplicateCheckRow {
  id: string;
  date: string;
  amount: number;
}

/** IDs of rows that have at least one partner with the same amount within `windowDays`. */
export function findDuplicateIds(rows: DuplicateCheckRow[], windowDays = 3): Set<string>;

/** First row matching `candidate` (same amount, within `windowDays`), excluding `excludeId`. */
export function findDuplicateMatch(
  rows: DuplicateCheckRow[],
  candidate: { date: string; amount: number },
  excludeId?: string,
  windowDays = 3
): DuplicateCheckRow | null;
```

Implementation: group by amount, flag pairs with `|dateA - dateB| <= windowDays * 86400000`.

Verify: `npx tsc --noEmit`. Commit: `feat: duplicate detection helpers (same amount within 3 days)`.

---

### Task 2: `components/DuplicateConfirm.tsx`

Amber-themed modal modeled on `components/DeleteConfirm.tsx`. Props: `{ title: string; onConfirm: () => void; onCancel: () => void }`. Header "Possible duplicate", buttons "Add Anyway" (primary variant from `ui/Button`) and "Go Back" (outline). Check `components/ui/Button.tsx` for the primary variant name first.

Verify: `npx tsc --noEmit`. Commit: `feat: DuplicateConfirm dialog for entry-time override`.

---

### Task 3: `getCardClassName` prop on DataTable

Add optional `getCardClassName?: (row: T) => string` to `DataTableProps`; apply via `cn(...)` to the mobile card wrapper div (merged with its existing base classes so an amber tint can replace `bg-white/60`).

Verify: `npx tsc --noEmit`. Commit: `feat: optional getCardClassName prop on DataTable mobile cards`.

---

### Task 4: Table highlighting in ProjectDetailClient

- Import `findDuplicateIds`, `cn`, `DuplicateCheckRow`.
- `dupIds` memo: union of `findDuplicateIds` over each of the 6 category arrays (IDs are unique across categories).
- Local `DuplicateBadge` component: small amber pill "Possible duplicate".
- Local `AmountCell({ category, row })` component: existing signed colored amount + `DuplicateBadge` when `dupIds.has(row.id)`. Replaces the inline amount renders in all 7 tables.
- `rowAccent(category)` helper returning `getRowClassName` callback: category rowClass + `bg-amber-50/70` when flagged. Wire all 7 tables (All Transactions uses `r.category as CategoryKey`).
- `cardTint` callback: `bg-amber-50/80` when flagged; pass as `getCardClassName` to all 7 tables.
- Mobile: append `<DuplicateBadge />` after the amount in each `renderCard` when flagged.

Verify: `npx tsc --noEmit`. Commit: `feat: highlight possible duplicate transactions in all tables`.

---

### Task 5: Entry-time warning with override

- State: `pendingDuplicate: { message: string; proceed: () => void } | null`.
- Helper `checkDuplicateAndSubmit(rows, data, doSubmit)`: `findDuplicateMatch(rows, data, editing?.id)`; no match → run `doSubmit`; match → set `pendingDuplicate` with message `"{formatCurrency} was already recorded on {formatDate}. Add anyway?"`.
- Wrap the body of all 6 submit handlers (`submitOwner`, `submitOwnerDirect`, `submitSub`, `submitExpense`, `submitMisc`, `submitCommissionPayout`) with this helper; keep `submitSub`'s `'type' in data` guard first.
- Render `<DuplicateConfirm>` next to the delete confirmations: onConfirm clears state then runs `proceed()`; onCancel clears state only (form values preserved — no `formKey` bump, `editing` untouched).

Verify: `npx tsc --noEmit`. Commit: `feat: warn on possible duplicate entry with Add Anyway override`.

---

### Task 6: Build + deploy

`npm run build` must pass. Then `git push origin main` and verify the live CSS/HTML on https://buildtrack-rose.vercel.app/ serves the new bundle.
