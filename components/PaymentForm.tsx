import { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

export type PaymentType = 'Labour' | 'Labour+Material';

export interface BasePaymentFormData {
  amount: number;
  date: string;
}

export interface SubcontractorPaymentFormData extends BasePaymentFormData {
  type: PaymentType;
  description: string;
}

export type PaymentFormData = BasePaymentFormData | SubcontractorPaymentFormData;

export interface PaymentFormInput {
  amount?: string | number | null;
  date?: string | Date | null;
  type?: PaymentType;
  description?: string | null;
}

interface PaymentFormProps {
  initial?: PaymentFormInput | null;
  showType?: boolean;
  onSubmit: (data: PaymentFormData) => void;
  onCancel?: () => void;
}

export function PaymentForm({ initial, showType = false, onSubmit, onCancel }: PaymentFormProps) {
  const [amount, setAmount] = useState<string | number>(initial?.amount ?? '');
  const [date, setDate] = useState<string>(
    initial?.date ? new Date(initial.date).toISOString().split('T')[0] : ''
  );
  const [type, setType] = useState<PaymentType>(initial?.type ?? 'Labour');
  const [description, setDescription] = useState<string>(initial?.description ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: PaymentFormData = showType
      ? { amount: Number(amount), date, type: type as PaymentType, description }
      : { amount: Number(amount), date };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <Input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        {showType && (
          <Select value={type} onChange={(e) => setType(e.target.value as PaymentType)}>
            <option value="Labour">Labour</option>
            <option value="Labour+Material">Labour+Material</option>
          </Select>
        )}
      </div>
      {showType && (
        <Input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
      )}
      <div className="flex gap-2">
        <Button type="submit">{initial ? 'Update' : 'Add'}</Button>
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}
