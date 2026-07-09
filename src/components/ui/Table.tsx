import {cn} from '@/lib/utils';
import {type ReactNode} from 'react';

export interface Column {
  key: string;
  label: string;
  className?: string;
}

interface TableProps {
  columns: Column[];
  data: Record<string, ReactNode>[];
  onRowClick?: (row: Record<string, ReactNode>, index: number) => void;
  emptyMessage?: string;
  mobileCard?: boolean;
  className?: string;
}

export function Table({
  columns,
  data,
  onRowClick,
  emptyMessage = 'Aucune donnée',
  mobileCard = false,
  className,
}: TableProps) {
  if (data.length === 0) {
    return (
      <div className={cn('py-12 text-center text-muted font-mono italic', className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      {/* ── Desktop table view ── */}
      <table className={cn('w-full', mobileCard && 'hidden sm:table')}>
        <thead>
          <tr className="bg-neutral-50 dark:bg-neutral-100 border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'text-muted uppercase text-[10px] tracking-wider font-bold px-4 py-3 text-left',
                  col.className,
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((row, i) => (
            <tr
              key={i}
              onClick={() => onRowClick?.(row, i)}
              className={cn(
                'transition-colors',
                onRowClick && 'cursor-pointer hover:bg-neutral-50/50 dark:hover:bg-neutral-200/50',
              )}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn('px-4 py-3 text-sm', col.className)}>
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Mobile card view ── */}
      {mobileCard && (
        <div className="sm:hidden space-y-3">
          {data.map((row, i) => (
            <div
              key={i}
              onClick={() => onRowClick?.(row, i)}
              className={cn(
                'rounded-xl border border-border bg-surface p-4 space-y-2',
                onRowClick && 'cursor-pointer',
                'transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-200/50',
              )}
            >
              {columns.map((col) => (
                <div key={col.key} className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-muted">
                    {col.label}
                  </span>
                  <span className="text-sm text-right">{row[col.key]}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
