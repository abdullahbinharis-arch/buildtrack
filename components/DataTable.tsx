import { Button } from './ui/Button';
import { Pencil, Trash2 } from 'lucide-react';

type DataTableRow = { id: string };

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
}

export function DataTable<T extends DataTableRow>({ columns, rows, onEdit, onDelete }: DataTableProps<T>) {
  return (
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
                <tr key={row.id}>
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
  );
}
