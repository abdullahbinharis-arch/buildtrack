'use client';

import { useEffect, useMemo, useState } from 'react';
import { StatCard } from '@/components/StatCard';
import { ProjectCard } from '@/components/ProjectCard';
import { ProjectForm } from '@/components/ProjectForm';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { HardHat, Download, Plus, TrendingUp, Wallet, PiggyBank, Building2 } from 'lucide-react';

interface ProjectSummary {
  id: string;
  name: string;
  estimated_value: number;
  created_at: string;
  total_received: number;
  total_expenses: number;
  profit_loss: number;
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

  const totals = useMemo(() => {
    return projects.reduce(
      (acc, p) => {
        acc.revenue += p.total_received;
        acc.expenses += p.total_expenses;
        acc.profit += p.profit_loss;
        return acc;
      },
      { revenue: 0, expenses: 0, profit: 0 }
    );
  }, [projects]);

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-rose-50/30">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/30 to-rose-50/30">
      {/* Background blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-20 top-0 h-96 w-96 rounded-full bg-violet-300/25 blur-[120px]" />
        <div className="absolute right-0 top-24 h-[28rem] w-[28rem] rounded-full bg-rose-300/20 blur-[130px]" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-emerald-300/20 blur-[120px]" />
      </div>

      <main className="page-container animate-fade-in">
        {/* Hero card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/95 via-slate-50/95 to-white/95 p-6 shadow-xl shadow-slate-900/5 ring-1 ring-white/80 backdrop-blur-2xl">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-300/20 blur-[80px]" />
          <div className="absolute -bottom-12 -left-12 h-56 w-56 rounded-full bg-blue-300/20 blur-[80px]" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-500/25">
                <HardHat className="h-6 w-6" />
              </div>
              <div>
                <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-brand-50/80 px-2.5 py-0.5 text-[10px] font-semibold text-brand-700 ring-1 ring-brand-100 backdrop-blur-md">
                  <Building2 className="h-3 w-3 text-brand-500" />
                  Contractor Dashboard
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">BuildTrack</h1>
                <p className="text-xs text-slate-500">Track payments, expenses, and profitability across all sites</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleExport} className="gap-1.5">
                <Download className="h-4 w-4" />
                Download Backup
              </Button>
              <Button onClick={() => setShowForm(true)} className="gap-1.5">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Projects"
            value={projects.length.toString()}
            tone="info"
            icon={<Building2 className="h-5 w-5" />}
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(totals.revenue)}
            tone="success"
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <StatCard
            title="Total Expenses"
            value={formatCurrency(totals.expenses)}
            tone="danger"
            icon={<Wallet className="h-5 w-5" />}
          />
          <StatCard
            title="Net Profit"
            value={`${totals.profit >= 0 ? '+' : ''}${formatCurrency(totals.profit)}`}
            tone={totals.profit >= 0 ? 'success' : 'danger'}
            icon={<PiggyBank className="h-5 w-5" />}
          />
        </div>

        {showForm && (
          <div className="mt-6">
            <ProjectForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
          </div>
        )}

        {/* Projects */}
        <div className="mt-8">
          <h2 className="section-title">Projects</h2>
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>

          {projects.length === 0 && (
            <div className="mt-6 flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/80 bg-white/40 p-10 text-center backdrop-blur-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/60 text-slate-400 ring-1 ring-white/70">
                <HardHat className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900">No projects yet</p>
              <p className="text-xs text-slate-500">Click “New Project” to get started.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
