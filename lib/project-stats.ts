/**
 * Single source of truth for all project financial calculations.
 *
 * Every view (dashboard page, project list API, project detail, PDF report)
 * must derive its numbers from these functions so they can never drift apart.
 *
 * Definitions:
 * - Contractor cost = subcontractor + material + miscellaneous payments —
 *   the money the contractor actually pays out. Owner-direct payments are
 *   excluded because the owner paid those vendors directly.
 * - Total project cost (shown as "Construction Cost" on the dashboard and
 *   detail cards) = contractor cost + owner-direct payments — the project's
 *   full build spend.
 * - Commission paid = sum of recorded commission payouts.
 * - Balance in hand = received minus contractor cost minus commission paid.
 *   This is a cash figure: owner-direct money never passes through the
 *   contractor, so it is not subtracted from (or added to) the balance.
 */

export interface AmountRow {
  amount: number;
}

export interface ProjectStatsInput {
  owner_payments: AmountRow[];
  owner_direct_payments: AmountRow[];
  subcontractor_payments: AmountRow[];
  material_expenses: AmountRow[];
  miscellaneous_expenses: AmountRow[];
  commission_payouts: AmountRow[];
}

export interface ProjectStats {
  received: number;
  directCost: number;
  subCost: number;
  matCost: number;
  miscCost: number;
  contractorCost: number;
  totalProjectCost: number;
  commissionPaid: number;
  balanceInHand: number;
}

const sumAmounts = (rows: AmountRow[]): number =>
  rows.reduce((s, r) => s + r.amount, 0);

export function computeProjectStats(p: ProjectStatsInput): ProjectStats {
  const received = sumAmounts(p.owner_payments);
  const directCost = sumAmounts(p.owner_direct_payments);
  const subCost = sumAmounts(p.subcontractor_payments);
  const matCost = sumAmounts(p.material_expenses);
  const miscCost = sumAmounts(p.miscellaneous_expenses);
  const commissionPaid = sumAmounts(p.commission_payouts);

  const contractorCost = subCost + matCost + miscCost;
  const totalProjectCost = contractorCost + directCost;

  return {
    received,
    directCost,
    subCost,
    matCost,
    miscCost,
    contractorCost,
    totalProjectCost,
    commissionPaid,
    balanceInHand: received - contractorCost - commissionPaid,
  };
}

/** Flat summary shape consumed by the dashboard page and the project list API. */
export interface ProjectSummary {
  id: string;
  name: string;
  estimated_value: number;
  commission_rate: number;
  created_at: string;
  total_received: number;
  total_expenses: number;
  total_project_cost: number;
  profit_loss: number;
  commission_paid: number;
}

export interface SummarySource extends ProjectStatsInput {
  id: string;
  name: string;
  estimated_value: number;
  commission_rate: number;
  created_at: Date;
}

export function toProjectSummary(p: SummarySource): ProjectSummary {
  const s = computeProjectStats(p);
  return {
    id: p.id,
    name: p.name,
    estimated_value: p.estimated_value,
    commission_rate: p.commission_rate,
    created_at: p.created_at.toISOString(),
    total_received: s.received,
    // "Construction Cost" = the project's full build spend, incl. owner-direct.
    total_expenses: s.totalProjectCost,
    total_project_cost: s.totalProjectCost,
    profit_loss: s.balanceInHand,
    commission_paid: s.commissionPaid,
  };
}
