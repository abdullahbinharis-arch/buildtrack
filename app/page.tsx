'use client';

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/StatCard';
import { ProjectCard } from '@/components/ProjectCard';
import { ProjectForm } from '@/components/ProjectForm';
import { Button } from '@/components/ui/Button';

interface ProjectSummary {
  id: string;
  name: string;
  estimated_value: number;
  total_received: number;
  total_expenses: number;
  profit_loss: number;
}

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    const res = await fetch('/api/projects');
    const data = await res.json();
    setProjects(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (payload: { name: string; estimated_value: number }) => {
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setShowForm(false);
    fetchProjects();
  };

  const handleExport = async () => {
    const res = await fetch('/api/export');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BuildTrack_Backup_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totals = projects.reduce(
    (acc, p) => {
      acc.revenue += p.total_received;
      acc.expenses += p.total_expenses;
      acc.profit += p.profit_loss;
      return acc;
    },
    { revenue: 0, expenses: 0, profit: 0 }
  );

  if (loading) return <div className="p-10 text-slate-500">Loading…</div>;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">BuildTrack</h1>
            <p className="text-slate-500">Construction Expense Tracker</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleExport}>Download Backup</Button>
            <Button onClick={() => setShowForm(true)}>New Project</Button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Active Projects" value={projects.length.toString()} tone="info" />
          <StatCard title="Total Revenue" value={fmt(totals.revenue)} tone="success" />
          <StatCard title="Total Expenses" value={fmt(totals.expenses)} tone="danger" />
          <StatCard
            title="Net Profit"
            value={`${totals.profit >= 0 ? '+' : ''}${fmt(totals.profit)}`}
            tone={totals.profit >= 0 ? 'success' : 'danger'}
          />
        </div>

        {showForm && (
          <div className="mt-8">
            <ProjectForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
          </div>
        )}

        <h2 className="mt-10 text-xl font-semibold text-slate-900">Projects</h2>
        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>

        {projects.length === 0 && (
          <div className="mt-10 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            No projects yet. Click “New Project” to get started.
          </div>
        )}
      </div>
    </main>
  );
}
