export interface DuplicateCheckRow {
  id: string;
  date: string;
  amount: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Returns the IDs of all rows that have at least one partner with the same
 * amount whose date is within `windowDays` (absolute difference).
 */
export function findDuplicateIds(rows: DuplicateCheckRow[], windowDays = 3): Set<string> {
  const flagged = new Set<string>();
  const byAmount = new Map<number, DuplicateCheckRow[]>();
  for (const row of rows) {
    const group = byAmount.get(row.amount);
    if (group) group.push(row);
    else byAmount.set(row.amount, [row]);
  }
  const windowMs = windowDays * DAY_MS;
  byAmount.forEach((group) => {
    if (group.length < 2) return;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const diff = Math.abs(
          new Date(group[i].date).getTime() - new Date(group[j].date).getTime()
        );
        if (diff <= windowMs) {
          flagged.add(group[i].id);
          flagged.add(group[j].id);
        }
      }
    }
  });
  return flagged;
}

/**
 * Returns the first row matching `candidate` (same amount, date within
 * `windowDays`), excluding the row with `excludeId` (used when editing).
 */
export function findDuplicateMatch(
  rows: DuplicateCheckRow[],
  candidate: { date: string; amount: number },
  excludeId?: string,
  windowDays = 3
): DuplicateCheckRow | null {
  const windowMs = windowDays * DAY_MS;
  const candidateTime = new Date(candidate.date).getTime();
  return (
    rows.find(
      (row) =>
        row.id !== excludeId &&
        row.amount === candidate.amount &&
        Math.abs(new Date(row.date).getTime() - candidateTime) <= windowMs
    ) ?? null
  );
}
