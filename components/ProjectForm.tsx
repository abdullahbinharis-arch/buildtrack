import { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

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
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">New Project</h3>
      <Input placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input type="number" placeholder="Estimated value" value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} required />
      <div className="flex gap-2">
        <Button type="submit">Create</Button>
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}
