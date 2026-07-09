import { cn } from '@/lib/utils';

interface TabNavProps {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}

export function TabNav({ tabs, active, onChange }: TabNavProps) {
  return (
    <div className="border-b border-white/60">
      <nav className="-mb-px flex space-x-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={cn(
              'rounded-t-xl border-b-2 px-4 py-3 text-sm font-semibold transition-all',
              active === tab
                ? 'border-brand-500 bg-white/50 text-brand-700 backdrop-blur-sm ring-1 ring-white/70 ring-b-0'
                : 'border-transparent text-slate-500 hover:bg-white/40 hover:text-slate-700'
            )}
          >
            {tab}
          </button>
        ))}
      </nav>
    </div>
  );
}
