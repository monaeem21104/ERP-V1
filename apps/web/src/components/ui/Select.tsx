import React from 'react';
import { cn } from './Button';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, children, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left rtl:text-right">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100',
            error && 'border-rose-500 focus:border-rose-500',
            className
          )}
          {...props}
        >
          {options ? options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          )) : children}
        </select>
        {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
