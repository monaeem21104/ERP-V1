import React from 'react';
import { cn } from './Button';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left rtl:text-right">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'flex min-h-[80px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100',
            error && 'border-rose-500 focus:border-rose-500',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
