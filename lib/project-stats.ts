/**
 * Single source of truth for all project financial calculations.
 *
 * Every view (dashboard page, project list API, project detail, PDF report)
 * must derive its numbers from these functions so they can never drift apart.
 *
 * Definitions:
 * - Construction cost = subcontractor + material + miscellaneous payments.
 *   Owner-direct payments are excluded: the owner paid those directly to
 *   vendors, so they never pass through the contractor's cash flow.
 * - Total project cost = construction cost + owner-direct payments (informational).
 * - Commission paid = sum of recorded commission payouts.
 * - Balance in hand = received minus construction cost minus commission paid.
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
  constructionCost: number;
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

  const constructionCost = subCost + matCost + miscCost;
  const totalProjectCost = constructionCost + directCost;

  return {
    received,
    directCost,
    subCost,
    matCost,
    miscCost,
    constructionCost,
    totalProjectCost,
    commissionPaid,
    balanceInHand: received - constructionCost - commissionPaid,
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
    total_expenses: s.constructionCost,
    total_project_cost: s.totalProjectCost,
    profit_loss: s.balanceInHand,
    commission_paid: s.commissionPaid,
  };
}
