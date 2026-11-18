import test from 'node:test';
import assert from 'node:assert/strict';
import { computeProjectStats, toProjectSummary } from '../lib/project-stats.ts';

/**
 * Fixture mirrors the real "Mehfil Apartment" project the user reported on:
 *   received 425,000 · owner-direct 261,559 · contractor cost 312,653 (sub + mat)
 *   total project cost 574,212 · commission paid 50,000 · commission rate 11%
 */
const mehfil = {
  owner_payments: [{ amount: 425000 }],
  owner_direct_payments: [{ amount: 261559 }],
  subcontractor_payments: [{ amount: 200000 }],
  material_expenses: [{ amount: 112653 }],
  miscellaneous_expenses: [],
  commission_payouts: [{ amount: 50000 }],
  commission_rate: 11,
};

test('computeProjectStats matches Mehfil Apartment — contractor cost and cash balance', () => {
  const s = computeProjectStats(mehfil);
  assert.equal(s.received, 425000);
  assert.equal(s.contractorCost, 312653);
  assert.equal(s.totalProjectCost, 574212);
  assert.equal(s.commissionPaid, 50000);
  // Cash balance = received − contractor cost − commission paid
  assert.equal(s.balanceInHand, 62347);
});

test('displayed Construction Cost (total project cost) includes owner-direct payments', () => {
  const s = computeProjectStats(mehfil);
  assert.equal(s.totalProjectCost, s.contractorCost + s.directCost);
  assert.equal(s.directCost, 261559);
});

test('commission payouts never inflate contractor cost', () => {
  const s = computeProjectStats(mehfil);
  assert.equal(s.contractorCost, s.subCost + s.matCost + s.miscCost);
  assert.notEqual(s.contractorCost, s.totalProjectCost); // owner-direct is the only difference
});

test('balance stays cash-based: owner-direct and unpaid commission are not deducted', () => {
  const s = computeProjectStats(mehfil);
  // Balance uses contractor cost (not total project cost) and only paid commission
  assert.equal(s.balanceInHand, s.received - s.contractorCost - s.commissionPaid);
});

test('balance goes negative when costs and commission exceed received', () => {
  const s = computeProjectStats({ ...mehfil, owner_payments: [{ amount: 100000 }] });
  assert.equal(s.balanceInHand, 100000 - 312653 - 50000);
});

test('toProjectSummary maps stats to the flat API/dashboard shape', () => {
  const summary = toProjectSummary({
    ...mehfil,
    id: 'proj-mehfil',
    name: 'Mehfil Apartment',
    estimated_value: 0,
    commission_rate: 11,
    archived: false,
    created_at: new Date('2026-08-12T00:00:00Z'),
  });
  assert.deepEqual(summary, {
    id: 'proj-mehfil',
    name: 'Mehfil Apartment',
    estimated_value: 0,
    commission_rate: 11,
    archived: false,
    created_at: '2026-08-12T00:00:00.000Z',
    total_received: 425000,
    // Construction Cost card = full build spend incl. owner-direct
    total_expenses: 574212,
    total_project_cost: 574212,
    profit_loss: 62347,
    commission_paid: 50000,
    liabilities: 0,
  });
});

test('credit bills count toward project cost and show as liabilities', () => {
  const s = computeProjectStats({
    ...mehfil,
    material_expenses: [{ amount: 100000 }, { amount: 12653, paid: false }],
    miscellaneous_expenses: [{ amount: 5000, paid: false }],
  });
  // Credit bills stay in the construction cost
  assert.equal(s.contractorCost, 200000 + 112653 + 5000);
  assert.equal(s.liabilities, 12653 + 5000);
});

test('balance is cash-based: unpaid credit bills are not deducted', () => {
  const withCredit = computeProjectStats({
    ...mehfil,
    material_expenses: [{ amount: 112653, paid: false }],
  });
  // Cash out = 200000 subcontractor only; the 112653 bill is still owed
  assert.equal(withCredit.balanceInHand, 425000 - 200000 - 50000);
  // Once paid, the same expense reduces the balance
  const settled = computeProjectStats(mehfil);
  assert.equal(settled.balanceInHand, 425000 - 312653 - 50000);
});

test('rows without a paid flag are treated as paid (legacy data)', () => {
  const s = computeProjectStats(mehfil);
  assert.equal(s.liabilities, 0);
  assert.equal(s.balanceInHand, 62347);
});
