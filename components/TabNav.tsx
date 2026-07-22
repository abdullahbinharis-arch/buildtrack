import { cn } from '@/lib/utils';

interface TabNavProps {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}

export function TabNav({ tabs, active, onChange }: TabNavProps) {
  return (
    <nav className="flex gap-2 overflow-x-auto scrollbar-none snap-x snap-mandatory">
      {tabs.map((tab) => (
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
        </button>
      ))}
    </nav>
  );
}
