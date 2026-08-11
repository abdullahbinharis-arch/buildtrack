# Desktop Transaction Category Styling — Design

**Date:** 2026-07-30
**Status:** Approved

## Problem

On the project detail page (`app/project/[id]/ProjectDetailClient.tsx`), the desktop table view renders the Category column as plain text and Amount without color or sign. At a glance it is hard to tell which transaction belongs to which category. The mobile card view (`renderCard` in `components/DataTable.tsx`) already shows colored category pills, but those colors are hardcoded inline in 7 separate places in `ProjectDetailClient.tsx`, so mobile and desktop can drift apart.

## Goal

Give every desktop table on the project detail page clear visual category distinction:

- Colored category pills (matching the mobile badges)
- A subtle per-category row accent (4px colored left border on each row)
- Signed, colored amounts (green `+ ₹` for income, red `− ₹` for expenses)

Scope: all tabs (All Transactions, Payment Received, Owner Direct Payments, Subcontractor Payments, Material Expenses, Misc Expenses, Commission Payout).

## Category → Style Map

| Category | Badge | Row accent (left border) | Amount |
|---|---|---|---|
| Owner Payment | `bg-emerald-100/80 text-emerald-700` | `border-l-4 border-l-emerald-400` | `text-emerald-600`, prefix `+ ` |
| Owner Direct | `bg-rose-100/80 text-rose-700` | `border-l-4 border-l-rose-400` | `text-rose-600`, prefix `− ` |
| Subcontractor | `bg-amber-100/80 text-amber-700` | `border-l-4 border-l-amber-400` | `text-rose-600`, prefix `− ` |
| Material | `bg-blue-100/80 text-blue-700` | `border-l-4 border-l-blue-400` | `text-rose-600`, prefix `− ` |
| Misc | `bg-slate-200/80 text-slate-700` | `border-l-4 border-l-slate-400` | `text-rose-600`, prefix `− ` |
| Commission Payout | `bg-purple-100/80 text-purple-700` | `border-l-4 border-l-purple-400` | `text-rose-600`, prefix `− ` |

These match the colors already used by the mobile cards.

## Changes

### 1. New file `lib/category-styles.ts`

Single source of truth exporting a `CATEGORY_STYLES` record keyed by the six category strings already used in `ProjectDetailClient.tsx` (`'Owner Payment'`, `'Owner Direct'`, `'Subcontractor'`, `'Material'`, `'Misc'`, `'Commission Payout'`). Each entry provides:

- `badgeClass` — Tailwind classes for the pill
- `rowClass` — Tailwind classes for the row left-border accent
- `amountClass` — text color class for the amount
- `sign` — `'+'` or `'-'`

### 2. `components/DataTable.tsx`

Add one optional prop:

```ts
getRowClassName?: (row: T) => string;
```

Applied to each `<tr>` in the desktop table body via the existing `cn()` util. No other behavior changes; mobile card view untouched.

### 3. `app/project/[id]/ProjectDetailClient.tsx`

- **All Transactions tab:** Category column gets a `render` that outputs the colored pill from `CATEGORY_STYLES`; Amount column gets a signed, colored `render`; the table gets `getRowClassName` returning the category's `rowClass`.
- **Individual tabs:** Amount column gets the signed, colored `render` for that tab's category; table gets `getRowClassName` with that category's `rowClass`. The Subcontractor tab's Type column also renders as a small badge (matching its mobile card, which already shows the type as a pill).
- **Mobile cards:** replace the 7 hardcoded color strings in `renderCard` callbacks with lookups into `CATEGORY_STYLES` so mobile and desktop share one mapping. Visual output on mobile stays the same.

## Non-goals

- No changes to forms, tabs, summary cards, PDF report, or Excel export.
- No data-model or API changes.
- No changes to `DataTable`'s mobile card rendering.

## Testing

- `npm run build` must pass (type check).
- Visual check of the project detail page at desktop width (all 7 tabs) and mobile width (All Transactions) to confirm pills, row accents, and signed amounts render correctly.

## Alternative considered

Putting badge/tint logic inside `DataTable` via a `categoryKey` prop — rejected because it bakes domain knowledge (construction-expense categories and their colors) into a generic table component.
