import { cn } from '@/lib/utils';

type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  className,
}: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    default: 'bg-brand-100/70 text-brand-700',
    success: 'bg-emerald-100/70 text-emerald-700',
    warning: 'bg-amber-100/70 text-amber-700',
    danger: 'bg-red-100/70 text-red-700',
    info: 'bg-blue-100/70 text-blue-700',
    neutral: 'bg-slate-100/70 text-slate-600',
  };

  return (
    <span
      className={cn(
        'glass-badge',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
