import { useState } from 'react';
import { Input } from './ui/Input';

export interface ExpenseFormData {
  amount: number;
  date: string;
  description?: string | null;
  paid?: boolean;
}

export interface ExpenseFormInput {
  amount?: string | number | null;
  date?: string | Date | null;
  description?: string | null;
  paid?: boolean | null;
}

interface ExpenseFormProps {
  initial?: ExpenseFormInput | null;
  onSubmit: (data: ExpenseFormData) => void;
  onCancel?: () => void;
  hideDescription?: boolean;
  /** Shows a Paid / Credit (pay later) toggle for bill-style expenses. */
  showPaidToggle?: boolean;
}

export function ExpenseForm({ initial, onSubmit, onCancel, hideDescription, showPaidToggle }: ExpenseFormProps) {
  const [amount, setAmount] = useState<string | number>(initial?.amount ?? '');
  const [date, setDate] = useState<string>(
    initial?.date ? new Date(initial.date).toISOString().split('T')[0] : ''
  );
  const [description, setDescription] = useState<string>(initial?.description ?? '');
  const [paid, setPaid] = useState<boolean>(initial?.paid ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      amount: Number(amount),
      date,
      description: hideDescription ? undefined : description,
      paid: showPaidToggle ? paid : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="glass-strong space-y-4 p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Input type="date" label="Date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <Input type="number" label="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        {!hideDescription && (
          <Input label="Description" placeholder="What was purchased?" value={description} onChange={(e) => setDescription(e.target.value)} />
        )}
      </div>
      {showPaidToggle && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment</span>
          <div className="flex rounded-xl bg-white/50 p-1 ring-1 ring-white/70 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setPaid(true)}
              className={`min-h-[36px] rounded-lg px-4 text-sm font-semibold transition-colors ${
                paid ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Paid
            </button>
            <button
              type="button"
              onClick={() => setPaid(false)}
              className={`min-h-[36px] rounded-lg px-4 text-sm font-semibold transition-colors ${
                !paid ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Credit (pay later)
            </button>
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          className="min-h-[44px] rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-500/20 transition-all hover:bg-brand-700"
        >
          {initial ? 'Update' : 'Add'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] rounded-xl border border-white/80 bg-white/50 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-white/70 backdrop-blur-sm transition-colors hover:bg-white/70"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
