import React from 'react';
import { cn } from './Button';

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl border border-zinc-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-base font-semibold text-zinc-900 dark:text-zinc-100', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-xs text-zinc-500 dark:text-zinc-400 mt-0.5', className)} {...props}>
      {children}
    </p>
  );
}
