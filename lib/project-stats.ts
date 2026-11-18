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
 *   full build spend. Credit (unpaid) bills are included here.
 * - Commission paid = sum of recorded commission payouts.
 * - Liabilities = unpaid (credit) material and miscellaneous bills — money
 *   the contractor still owes vendors. These count toward project cost but
 *   have not left the contractor's hands yet.
 * - Balance in hand = received minus PAID contractor cost minus commission
 *   paid. This is a cash figure: owner-direct money never passes through
 *   the contractor, and credit bills have not been paid out yet, so neither
 *   is subtracted from the balance.
 */

export interface AmountRow {
  amount: number;
  /** Defaults to true for rows that predate the paid/credit distinction. */
  paid?: boolean;
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
  liabilities: number;
  balanceInHand: number;
}

const sumAmounts = (rows: AmountRow[]): number =>
  rows.reduce((s, r) => s + r.amount, 0);

const sumUnpaid = (rows: AmountRow[]): number =>
  rows.reduce((s, r) => (r.paid === false ? s + r.amount : s), 0);

export function computeProjectStats(p: ProjectStatsInput): ProjectStats {
  const received = sumAmounts(p.owner_payments);
  const directCost = sumAmounts(p.owner_direct_payments);
  const subCost = sumAmounts(p.subcontractor_payments);
  const matCost = sumAmounts(p.material_expenses);
  const miscCost = sumAmounts(p.miscellaneous_expenses);
  const commissionPaid = sumAmounts(p.commission_payouts);

  const contractorCost = subCost + matCost + miscCost;
  const totalProjectCost = contractorCost + directCost;

  const liabilities = sumUnpaid(p.material_expenses) + sumUnpaid(p.miscellaneous_expenses);

  return {
    received,
    directCost,
    subCost,
    matCost,
    miscCost,
    contractorCost,
    totalProjectCost,
    commissionPaid,
    liabilities,
    balanceInHand: received - (contractorCost - liabilities) - commissionPaid,
  };
}

/** Flat summary shape consumed by the dashboard page and the project list API. */
export interface ProjectSummary {
  id: string;
  name: string;
  estimated_value: number;
  commission_rate: number;
  archived: boolean;
  created_at: string;
  total_received: number;
  total_expenses: number;
  total_project_cost: number;
  profit_loss: number;
  commission_paid: number;
  liabilities: number;
}

export interface SummarySource extends ProjectStatsInput {
  id: string;
  name: string;
  estimated_value: number;
  commission_rate: number;
  archived: boolean;
  created_at: Date;
}

export function toProjectSummary(p: SummarySource): ProjectSummary {
  const s = computeProjectStats(p);
  return {
    id: p.id,
    name: p.name,
    estimated_value: p.estimated_value,
    commission_rate: p.commission_rate,
    archived: p.archived,
    created_at: p.created_at.toISOString(),
    total_received: s.received,
    // "Construction Cost" = the project's full build spend, incl. owner-direct.
    total_expenses: s.totalProjectCost,
    total_project_cost: s.totalProjectCost,
    profit_loss: s.balanceInHand,
    commission_paid: s.commissionPaid,
    liabilities: s.liabilities,
  };
}
