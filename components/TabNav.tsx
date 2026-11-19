import { cn } from '@/lib/utils';

interface TabNavProps {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
  /** Optional per-tab entry counts, shown as a small badge. */
  counts?: Record<string, number>;
}

export function TabNav({ tabs, active, onChange, counts }: TabNavProps) {
  return (
    <nav className="flex gap-2 overflow-x-auto scrollbar-none snap-x snap-mandatory">
      {tabs.map((tab) => {
        const count = counts?.[tab];
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={cn(
              'snap-start shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all',
              active === tab
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                : 'bg-white/60 text-slate-600 ring-1 ring-white/80 hover:bg-white/80 hover:text-slate-800'
            )}
          >
            {tab}
            {count !== undefined && (
              <span
                className={cn(
                  'ml-1.5 inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                  active === tab ? 'bg-white/25 text-white' : 'bg-slate-200/80 text-slate-600'
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
