import Link from 'next/link';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { ArrowUpRight, HardHat } from 'lucide-react';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    estimated_value: number;
    total_received: number;
    total_expenses: number;
    profit_loss: number;
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  const profit = project.profit_loss >= 0;
  const hasContract = project.estimated_value > 0;
  const denominator = hasContract ? project.estimated_value : project.total_received;
  const ratio = denominator
    ? Math.round((project.total_expenses / denominator) * 100)
    : 0;
  const progressLabel = hasContract ? 'Cost vs contract' : 'Cost vs received';

  return (
    <Link href={`/project/${project.id}`}>
      <Card hover className="group relative h-full overflow-hidden p-5">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-300/15 blur-[60px] transition-opacity group-hover:opacity-80" />
        <div className="relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100/80 text-brand-600 ring-1 ring-white/70 backdrop-blur-sm">
                <HardHat className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{project.name}</h3>
                <p className="text-xs text-slate-500">Construction site</p>
              </div>
            </div>
            <Badge variant="info">Active</Badge>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl bg-white/50 p-3 ring-1 ring-white/70 backdrop-blur-sm">
              <p className="text-xs text-slate-500">Contract</p>
              <p className="mt-0.5 font-semibold text-slate-900">{formatCurrency(project.estimated_value)}</p>
            </div>
            <div className="rounded-xl bg-white/50 p-3 ring-1 ring-white/70 backdrop-blur-sm">
              <p className="text-xs text-slate-500">Received</p>
              <p className="mt-0.5 font-semibold text-emerald-600">{formatCurrency(project.total_received)}</p>
            </div>
            <div className="rounded-xl bg-white/50 p-3 ring-1 ring-white/70 backdrop-blur-sm">
              <p className="text-xs text-slate-500">Cost</p>
              <p className="mt-0.5 font-semibold text-rose-600">{formatCurrency(project.total_expenses)}</p>
            </div>
            <div className="rounded-xl bg-white/50 p-3 ring-1 ring-white/70 backdrop-blur-sm">
              <p className="text-xs text-slate-500">Profit</p>
              <p className={`mt-0.5 font-semibold ${profit ? 'text-emerald-600' : 'text-rose-600'}`}>
                {profit ? '+' : ''}{formatCurrency(project.profit_loss)}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex justify-between text-xs text-slate-500">
              <span>{progressLabel}</span>
              <span>{ratio}%</span>
            </div>
            <div className="mt-1.5 h-2 w-full rounded-full bg-slate-100/80 ring-1 ring-white/60">
              <div
                className="h-2 rounded-full bg-brand-500 transition-all duration-500"
                style={{ width: `${Math.min(ratio, 100)}%` }}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-brand-600 opacity-0 transition-opacity group-hover:opacity-100">
            View project
            <ArrowUpRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </Card>
    </Link>
  );
}
