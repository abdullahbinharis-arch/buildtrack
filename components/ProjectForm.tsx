import { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { HardHat } from 'lucide-react';

interface ProjectFormData {
  name: string;
  estimated_value: number;
  commission_rate: number;
}

interface ProjectFormProps {
  onSubmit: (data: ProjectFormData) => void;
  onCancel?: () => void;
  initial?: Partial<ProjectFormData>;
  submitLabel?: string;
}

export function ProjectForm({ onSubmit, onCancel, initial, submitLabel = 'Create' }: ProjectFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [estimatedValue, setEstimatedValue] = useState(
    initial?.estimated_value !== undefined ? String(initial.estimated_value) : ''
  );
  const [commissionRate, setCommissionRate] = useState(
    initial?.commission_rate !== undefined ? String(initial.commission_rate) : '10'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      estimated_value: Number(estimatedValue),
      commission_rate: Number(commissionRate),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="glass-strong space-y-4 p-6">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100/80 text-brand-600 ring-1 ring-white/70">
          <HardHat className="h-4 w-4" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">{initial ? 'Edit Project' : 'New Project'}</h3>
      </div>
      <div className="form-grid">
        <Input label="Project name" placeholder="e.g., Kaloor Site" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input type="number" label="Contract value" placeholder="Contract value" value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} required />
        <Input type="number" step="0.01" label="Commission rate (%)" placeholder="10" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} required />
      </div>
      <div className="flex gap-2">
        <Button type="submit">{submitLabel}</Button>
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}
