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
    <div className="table-wrapper overflow-x-auto">
      <table className="data-table min-w-full">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="rounded-tl-2xl first:rounded-tl-2xl last:rounded-tr-2xl">
                {c.label}
              </th>
            ))}
            {(onEdit || onDelete) && <th className="rounded-tr-2xl text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((c) => (
                <td key={c.key}>
                  {c.render ? c.render(row) : (row[c.key as keyof T] as React.ReactNode)}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="text-right">
                  <div className="flex justify-end gap-2">
                    {onEdit && (
                      <Button variant="ghost" onClick={() => onEdit(row)} className="h-8 px-2 py-1 text-xs">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button variant="danger" onClick={() => onDelete(row)} className="h-8 px-2 py-1 text-xs">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
