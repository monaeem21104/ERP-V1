import React from 'react';
import { cn } from './Button';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left rtl:text-right">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={cn(
            'flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100',
            error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
        {helperText && !error && <p className="text-xs text-zinc-500">{helperText}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
