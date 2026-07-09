import { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { HardHat } from 'lucide-react';

interface ProjectFormProps {
  onSubmit: (data: { name: string; estimated_value: number }) => void;
  onCancel?: () => void;
}

export function ProjectForm({ onSubmit, onCancel }: ProjectFormProps) {
  const [name, setName] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, estimated_value: Number(estimatedValue) });
    setName('');
    setEstimatedValue('');
  };

  return (
    <form onSubmit={handleSubmit} className="glass-strong space-y-4 p-6">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100/80 text-brand-600 ring-1 ring-white/70">
          <HardHat className="h-4 w-4" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">New Project</h3>
      </div>
      <div className="form-grid">
        <Input label="Project name" placeholder="e.g., Kaloor Site" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input type="number" label="Estimated value" placeholder="Contract value" value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} required />
      </div>
      <div className="flex gap-2">
        <Button type="submit">Create</Button>
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}
