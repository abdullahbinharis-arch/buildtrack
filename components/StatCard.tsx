import { Card } from './ui/Card';

interface StatCardProps {
  title: string;
  value: string;
  tone?: 'neutral' | 'success' | 'danger' | 'info';
}

export function StatCard({ title, value, tone = 'neutral' }: StatCardProps) {
  const tones = {
    neutral: 'text-slate-900',
    success: 'text-emerald-600',
    danger: 'text-rose-600',
    info: 'text-blue-600',
  };
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className={`mt-2 text-2xl font-bold ${tones[tone]}`}>{value}</p>
    </Card>
  );
}
