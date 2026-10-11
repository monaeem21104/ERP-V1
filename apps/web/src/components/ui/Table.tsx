import React from 'react';
import { cn } from './Button';

export function Table({ className, children, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
      <table className={cn('w-full text-left rtl:text-right text-sm text-zinc-600 dark:text-zinc-300', className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cn('bg-zinc-50/75 dark:bg-zinc-800/50 text-xs font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-200/80 dark:border-zinc-800', className)} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn('divide-y divide-zinc-100 dark:divide-zinc-800', className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ className, children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn('hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors', className)} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({ className, children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={cn('px-4 py-3.5 whitespace-nowrap', className)} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ className, children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('px-4 py-3 whitespace-nowrap text-zinc-800 dark:text-zinc-200', className)} {...props}>
      {children}
    </td>
  );
}
