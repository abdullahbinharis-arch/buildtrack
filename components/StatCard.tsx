import { Card } from './ui/Card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  tone?: 'neutral' | 'success' | 'danger' | 'info';
  icon?: React.ReactNode;
}

export function StatCard({ title, value, tone = 'neutral', icon }: StatCardProps) {
  const tones = {
    neutral: 'text-slate-900',
    success: 'text-emerald-600',
    danger: 'text-rose-600',
    info: 'text-brand-600',
  };

  const iconBg = {
    neutral: 'bg-slate-100/80 text-slate-700',
    success: 'bg-emerald-100/80 text-emerald-700',
    danger: 'bg-rose-100/80 text-rose-700',
    info: 'bg-brand-100/80 text-brand-700',
  };

  return (
    <Card className="relative overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
          <p className={`mt-2 text-2xl font-bold ${tones[tone]}`}>{value}</p>
        </div>
        {icon && (
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-white/70 backdrop-blur-sm', iconBg[tone])}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
