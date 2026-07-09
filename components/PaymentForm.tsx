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
    <form onSubmit={handleSubmit} className="glass-strong space-y-4 p-5">
      <div className="form-grid">
        <Input type="date" label="Date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <Input type="number" label="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        {showType && (
          <Select label="Type" value={type} onChange={(e) => setType(e.target.value as PaymentType)}>
            <option value="Labour">Labour</option>
            <option value="Labour+Material">Labour+Material</option>
          </Select>
        )}
      </div>
      {showType && (
        <Input label="Description" placeholder="Optional description" value={description} onChange={(e) => setDescription(e.target.value)} />
      )}
      <div className="flex gap-2">
        <Button type="submit">{initial ? 'Update' : 'Add'}</Button>
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}
