import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-medium transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none select-none';
    
    const variants = {
      primary: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-sm',
      secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 focus:ring-zinc-600',
      outline: 'border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100',
      danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-sm',
      ghost: 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 focus:ring-zinc-400',
      success: 'bg-emerald-700 text-white hover:bg-emerald-800 focus:ring-emerald-600 shadow-sm',
    };

    const sizes = {
      sm: 'text-xs px-2.5 py-1.5 gap-1.5 h-8',
      md: 'text-sm px-4 py-2 gap-2 h-9',
      lg: 'text-base px-5 py-2.5 gap-2.5 h-11',
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
