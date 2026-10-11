import React from 'react';
import { cn } from './Button';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export function LoadingSpinner({ size = 'md', className, label }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-10 w-10 border-3',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center p-6 gap-3', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-zinc-200 border-t-emerald-600 dark:border-zinc-800 dark:border-t-emerald-500',
          sizes[size]
        )}
      />
      {label && <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{label}</p>}
    </div>
  );
}
