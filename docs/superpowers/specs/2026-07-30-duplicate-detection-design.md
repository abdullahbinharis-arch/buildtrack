# Possible-Duplicate Detection — Design

**Date:** 2026-07-30
**Status:** Approved

## Problem

Double entries happen: the same payment gets recorded twice with the same amount on the same or a nearby date. Today nothing in the UI calls this out, so duplicates are only caught by manually scanning the tables.

## Goal

1. **Table highlighting (Excel-style conditional formatting):** rows that look like possible duplicates are visually highlighted in every transaction table, desktop and mobile.
2. **Entry-time warning with override:** when a new/edited entry matches an existing one, a dialog warns the user before saving; the user can override ("Add Anyway") or go back and fix the entry.

## Detection Rule

Within one category, two entries are **possible duplicates** when:

- amounts are exactly equal, **and**
- dates are ≤ 3 days apart (absolute difference)

Description is NOT considered. When editing an entry, that entry is excluded from the check (an entry never flags itself).

Categories are the existing six: Owner Payment, Owner Direct, Subcontractor, Material, Misc, Commission Payout. Cross-category matches never flag (a Material ₹5,000 and a Misc ₹5,000 are unrelated).

Rationale for 3 days: catches duplicates entered with a date typo while leaving the user's recurring weekly subcontractor payments (6-8 days apart) unflagged.

## Changes

### 1. New file `lib/find-duplicates.ts`

Pure function, no framework dependencies:

```ts
findDuplicateIds(
  rows: { id: string; date: string; amount: number }[],
  windowDays?: number  // default 3
): Set<string>
```

Returns the IDs of all rows that have at least one possible-duplicate partner within the input set.

### 2. Table highlighting — `app/project/[id]/ProjectDetailClient.tsx`

- For each category's rows (and per-category within `allTransactions`), compute flagged IDs with `findDuplicateIds`.
- Desktop: extend the existing `getRowClassName` callbacks to append `bg-amber-50/70` when the row is flagged. Flagged rows also get a small amber "Possible duplicate" badge rendered next to the amount.
- Mobile: flagged cards get the same amber tint and badge.
- Existing category colors, pills, and left-border accents are unchanged.

### 3. Entry-time warning — `components/DuplicateConfirm.tsx` (new)

Amber-themed modal modeled on `components/DeleteConfirm.tsx`:

- Title: "Possible duplicate"
- Body: shows the matching entry, e.g. "₹20,000 was already recorded on 27 Jul 2026. Add anyway?"
- Buttons: **Add Anyway** (confirm/override) and **Go Back** (cancel)

### 4. Submit-time checks — `app/project/[id]/ProjectDetailClient.tsx`

Each of the 6 submit handlers (`submitOwner`, `submitOwnerDirect`, `submitSub`, `submitExpense`, `submitMisc`, `submitCommissionPayout`):

1. Before the API call, run the detection rule against that category's existing rows, excluding the row being edited (if any).
2. No match → submit directly (current behavior).
3. Match → store the pending submission in a `pendingDuplicate` state and show `DuplicateConfirm`.
   - **Add Anyway** → runs the original submit logic with the stored data.
   - **Go Back** → clears `pendingDuplicate`; the form keeps its values (no `formKey` bump, `editing` untouched) so the user can correct amount/date.

## Non-goals

- No server-side validation or blocking — the warning is always overridable.
- No description/fuzzy matching.
- No changes to PDF report, Excel export, CSV import, or summary cards.

## Testing

- `npx tsc --noEmit` after each task; `npm run build` at the end.
- Manual verification on the dev server:
  - Two same-amount entries in one category ≤ 3 days apart → both rows show amber tint + badge (desktop and mobile).
  - Two same-amount entries 6+ days apart → no highlight.
  - Same amount in different categories → no highlight.
  - Submitting a matching entry → dialog appears; "Add Anyway" saves; "Go Back" keeps form values.
  - Editing an entry without changing amount/date → no self-flag.
