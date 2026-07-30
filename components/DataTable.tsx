'use client';

import { useMemo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

type DataTableRow = { id: string; date?: string };

interface Column<T extends DataTableRow> {
  key: keyof T & string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T extends DataTableRow = DataTableRow> {
  columns: Column<T>[];
  rows: T[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  /** If provided, renders a card-based list on mobile (< md) instead of the table. The table is still shown on md+. */
  renderCard?: (row: T) => React.ReactNode;
  /** Used for date grouping in card view. Defaults to (row) => row.date */
  getCardDate?: (row: T) => string;
  /** Optional per-row class names applied to each desktop table row (<tr>). */
  getRowClassName?: (row: T) => string;
}

export function DataTable<T extends DataTableRow>({
  columns,
  rows,
  onEdit,
  onDelete,
  renderCard,
  getCardDate,
  getRowClassName,
}: DataTableProps<T>) {
  /* ── Group rows by date for card view ── */
  const groupedRows = useMemo(() => {
    if (!renderCard) return null;
    const map = new Map<string, T[]>();
    rows.forEach((row) => {
      const date = getCardDate ? getCardDate(row) : row.date ?? '';
      const key = date || '';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    });
    // Sort groups by date descending (empty date goes last)
    return Array.from(map.entries())
      .sort(([a], [b]) => {
        if (!a) return 1;
        if (!b) return -1;
        return new Date(b).getTime() - new Date(a).getTime();
      })
      .map(([date, rows]) => ({ date, rows }));
  }, [rows, renderCard, getCardDate]);

  return (
    <>
      {/* ── Mobile card view (only when renderCard is provided) ── */}
      {renderCard && groupedRows && (
        <div className="space-y-6 md:hidden">
          {groupedRows.map((group) => (
            <div key={group.date || 'no-date'}>
              {group.date && (
                <div className="sticky top-0 z-10 -mx-4 px-4 py-2 bg-white/80 backdrop-blur-xl border-b border-white/60">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {formatDate(group.date)}
                  </span>
                </div>
              )}
              <div className="mt-2 space-y-2">
                {group.rows.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-start gap-2 rounded-2xl bg-white/60 p-3 ring-1 ring-white/70 backdrop-blur-md transition-all hover:bg-white/80 min-h-[64px]"
                  >
                    {/* Card content area */}
                    <div className="min-w-0 flex-1">
                      {renderCard(row)}
                    </div>
                    {/* Direct action buttons */}
                    <div className="flex shrink-0 -mr-1 -mt-1">
                      {onEdit && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onEdit(row); }}
                          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-brand-50 hover:text-brand-600 active:bg-brand-100"
                          aria-label="Edit"
                        >
                          <Pencil className="h-5 w-5" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(row); }}
                          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 active:bg-red-100"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/80 bg-white/40 p-8 text-center backdrop-blur-xl">
              <p className="text-sm font-medium text-slate-500">No transactions found</p>
            </div>
          )}
        </div>
      )}

      {/* ── Desktop table view (always on md+, fallback for no renderCard) ── */}
      <div className={cn(renderCard ? 'hidden md:block' : '')}>
        <div className="-mx-5 sm:mx-0">
          <div className="table-wrapper inline-block min-w-full align-middle">
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    {columns.map((c) => (
                      <th key={c.key} className="whitespace-nowrap first:rounded-tl-2xl last:rounded-tr-2xl">
                        {c.label}
                      </th>
                    ))}
                    {(onEdit || onDelete) && <th className="sticky right-0 whitespace-nowrap rounded-tr-2xl bg-white/60 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className={getRowClassName?.(row)}>
                      {columns.map((c) => (
                        <td key={c.key} className="whitespace-nowrap">
                          {c.render ? c.render(row) : (row[c.key as keyof T] as React.ReactNode)}
                        </td>
                      ))}
                      {(onEdit || onDelete) && (
                        <td className="sticky right-0 bg-white/60 text-right">
                          <div className="flex justify-end gap-1">
                            {onEdit && (
                              <button
                                onClick={() => onEdit(row)}
                                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-brand-50 hover:text-brand-600 active:bg-brand-100"
                                aria-label="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            )}
                            {onDelete && (
                              <button
                                onClick={() => onDelete(row)}
                                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 active:bg-red-100"
                                aria-label="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
