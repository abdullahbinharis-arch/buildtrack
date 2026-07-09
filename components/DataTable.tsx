import { Button } from './ui/Button';

type DataTableRow = { id: string } & Record<string, unknown>;

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
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-4 py-3 text-left font-semibold text-slate-700">
                {c.label}
              </th>
            ))}
            {(onEdit || onDelete) && <th className="px-4 py-3 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50">
              {columns.map((c) => (
                <td key={c.key} className="px-4 py-3 text-slate-700">
                  {c.render ? c.render(row) : (row[c.key] as React.ReactNode)}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    {onEdit && (
                      <Button variant="ghost" onClick={() => onEdit(row)} className="px-2 py-1 text-xs">
                        Edit
                      </Button>
                    )}
                    {onDelete && (
                      <Button variant="danger" onClick={() => onDelete(row)} className="px-2 py-1 text-xs">
                        Delete
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
