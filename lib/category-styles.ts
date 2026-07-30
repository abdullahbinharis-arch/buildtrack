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
