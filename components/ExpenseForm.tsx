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
    <form onSubmit={handleSubmit} className="glass-strong space-y-4 p-5">
      <div className="form-grid">
        <Input type="date" label="Date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <Input type="number" label="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        <Input label="Description" placeholder="What was purchased?" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button type="submit">{initial ? 'Update' : 'Add'}</Button>
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}
