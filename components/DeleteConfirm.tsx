import { Button } from './ui/Button';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmProps {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirm({ title, onConfirm, onCancel }: DeleteConfirmProps) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-red-100/70 bg-red-50/60 p-4 backdrop-blur-sm ring-1 ring-white/70">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100/80 text-red-600 ring-1 ring-white/70">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-red-800">{title}</p>
        <div className="mt-3 flex gap-2">
          <Button variant="danger" onClick={onConfirm} className="text-xs">
            Delete
          </Button>
          <Button variant="outline" onClick={onCancel} className="text-xs">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
