import { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

export interface ExpenseFormData {
  amount: number;
  date: string;
  description?: string | null;
}

export interface ExpenseFormInput {
  amount?: string | number | null;
  date?: string | Date | null;
  description?: string | null;
}

interface ExpenseFormProps {
  initial?: ExpenseFormInput | null;
  onSubmit: (data: ExpenseFormData) => void;
  onCancel?: () => void;
}

export function ExpenseForm({ initial, onSubmit, onCancel }: ExpenseFormProps) {
  const [amount, setAmount] = useState<string | number>(initial?.amount ?? '');
  const [date, setDate] = useState<string>(
    initial?.date ? new Date(initial.date).toISOString().split('T')[0] : ''
  );
  const [description, setDescription] = useState<string>(initial?.description ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ amount: Number(amount), date, description });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <Input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button type="submit">{initial ? 'Update' : 'Add'}</Button>
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}
