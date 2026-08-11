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
    commission_rate: number;
    total_received: number;
    total_expenses: number;
    total_project_cost?: number;
    profit_loss: number;
    commission_payable: number;
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  const balance = project.profit_loss;
  const commission = project.commission_payable;

  return (
    <Link href={`/project/${project.id}`} className="block touch-manipulation">
      <Card hover className="group relative h-full overflow-hidden p-4 sm:p-5">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-300/15 blur-[60px] transition-opacity group-hover:opacity-80" />
        <div className="relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100/80 text-brand-600 ring-1 ring-white/70 backdrop-blur-sm sm:h-10 sm:w-10">
                <HardHat className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-slate-900 sm:text-lg">{project.name}</h3>
                <p className="text-xs text-slate-500">Construction site</p>
              </div>
            </div>
            <Badge variant="info">Active</Badge>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-white/50 p-2.5 sm:p-3 ring-1 ring-white/70 backdrop-blur-sm">
              <p className="text-xs text-slate-500">Received</p>
              <p className="mt-0.5 font-semibold text-emerald-600">{formatCurrency(project.total_received)}</p>
            </div>
            <div className="rounded-xl bg-white/50 p-2.5 sm:p-3 ring-1 ring-white/70 backdrop-blur-sm">
              <p className="text-xs text-slate-500">Construction Cost</p>
              <p className="mt-0.5 font-semibold text-rose-600">{formatCurrency(project.total_expenses)}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-xl bg-purple-50/60 p-2.5 sm:p-3 ring-1 ring-purple-100/70 backdrop-blur-sm">
            <p className="text-xs text-slate-500">Commission Paid</p>
            <p className="text-sm font-semibold text-purple-700">{formatCurrency(commission)}</p>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50/60 p-2.5 sm:p-3 ring-1 ring-emerald-100/70 backdrop-blur-sm">
            <p className="text-xs text-slate-500">Balance</p>
            <p className={`text-sm font-semibold ${balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatCurrency(Math.abs(balance))}
              {balance < 0 && ' deficit'}
            </p>
          </div>

          <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-brand-600 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
            View project
            <ArrowUpRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </Card>
    </Link>
  );
}
