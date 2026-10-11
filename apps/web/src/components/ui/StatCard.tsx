import React from 'react';
import { cn } from './Button';
import { Card } from './Card';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  variant?: 'default' | 'accent' | 'warning' | 'danger';
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
  className,
}: StatCardProps) {
  const iconBgs = {
    default: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
    accent: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
    warning: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
    danger: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400',
  };

  return (
    <Card className={cn('relative overflow-hidden p-5', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {title}
          </p>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {value}
          </p>
        </div>
        {icon && (
          <div className={cn('rounded-xl p-2.5 flex items-center justify-center shadow-xs', iconBgs[variant])}>
            {icon}
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={cn(
                'inline-flex items-center font-medium px-1.5 py-0.5 rounded text-[11px]',
                trend.isPositive
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              )}
            >
              {trend.value}
            </span>
          )}
          {subtitle && <span className="text-zinc-500 dark:text-zinc-400">{subtitle}</span>}
        </div>
      )}
    </Card>
  );
}
