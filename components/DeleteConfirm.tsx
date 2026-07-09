import { Button } from './ui/Button';

interface DeleteConfirmProps {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirm({ title, onConfirm, onCancel }: DeleteConfirmProps) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
      <p className="text-sm text-rose-800">{title}</p>
      <div className="mt-3 flex gap-2">
        <Button variant="danger" onClick={onConfirm} className="text-xs">
          Delete
        </Button>
        <Button variant="secondary" onClick={onCancel} className="text-xs">
          Cancel
        </Button>
      </div>
    </div>
  );
}
