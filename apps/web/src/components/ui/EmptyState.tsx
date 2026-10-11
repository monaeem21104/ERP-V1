import React from 'react';
import { PackageOpen } from 'lucide-react';
import { cn } from './Button';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = 'No records found',
  description = 'There are no records to display at this time.',
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50', className)}>
      <div className="rounded-full bg-zinc-100 p-3 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500 mb-3">
        {icon || <PackageOpen className="h-6 w-6" />}
      </div>
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
