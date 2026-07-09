import Link from 'next/link';
import { Card } from './ui/Card';

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

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const profit = project.profit_loss >= 0;
  const ratio = project.estimated_value
    ? Math.round((project.total_expenses / project.estimated_value) * 100)
    : 0;

  return (
    <Link href={`/project/${project.id}`}>
      <Card className="h-full p-5 transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{project.name}</h3>
          <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">Active</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500">Contract</p>
            <p className="font-medium text-slate-900">{fmt(project.estimated_value)}</p>
          </div>
          <div>
            <p className="text-slate-500">Received</p>
            <p className="font-medium text-emerald-600">{fmt(project.total_received)}</p>
          </div>
          <div>
            <p className="text-slate-500">Cost</p>
            <p className="font-medium text-rose-600">{fmt(project.total_expenses)}</p>
          </div>
          <div>
            <p className="text-slate-500">Profit</p>
            <p className={`font-medium ${profit ? 'text-emerald-600' : 'text-rose-600'}`}>
              {profit ? '+' : ''}{fmt(project.profit_loss)}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Cost vs contract</span>
            <span>{ratio}%</span>
          </div>
          <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-blue-500"
              style={{ width: `${Math.min(ratio, 100)}%` }}
            />
          </div>
        </div>
      </Card>
    </Link>
  );
}
