'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectCard } from '@/components/ProjectCard';
import { ProjectForm } from '@/components/ProjectForm';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { apiFetch } from '@/lib/fetch-client';
import {
  HardHat, Download, Plus, TrendingUp, Wallet, PiggyBank, Building2, Percent,
} from 'lucide-react';

interface ProjectSummary {
  id: string;
  name: string;
  estimated_value: number;
  commission_rate: number;
  created_at: string;
  total_received: number;
  total_expenses: number;
  profit_loss: number;
  commission_payable: number;
}

interface DashboardClientProps {
  initialProjects: ProjectSummary[];
}

export default function DashboardClient({ initialProjects }: DashboardClientProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectSummary[]>(initialProjects);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    // If API key is set on the server but not in sessionStorage, redirect to login
    const hasKey = sessionStorage.getItem('buildtrack_key');
    // Only redirect if we get a 401 from the API (key might be set server-side)
    if (!hasKey) {
      apiFetch('/api/projects').then((res) => {
        if (res.status === 401) router.push('/login');
      });
    }
  }, [router]);

  const fetchProjects = async () => {
    const res = await apiFetch('/api/projects');
    const data = await res.json();
    setProjects(data);
  };

  const handleCreate = async (payload: { name: string; estimated_value: number; commission_rate: number }) => {
    await apiFetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setShowForm(false);
    fetchProjects();
  };

  const handleExport = async () => {
    const res = await apiFetch('/api/export');
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
        acc.balance += p.profit_loss;
        acc.commission += p.commission_payable;
        return acc;
      },
      { revenue: 0, expenses: 0, balance: 0, commission: 0 }
    );
  }, [projects]);

  return (
    <>
      {/* Hero card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/95 via-slate-50/95 to-white/95 p-6 shadow-xl shadow-slate-900/5 ring-1 ring-white/80 backdrop-blur-2xl">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-300/20 blur-[80px]" />
        <div className="absolute -bottom-12 -left-12 h-56 w-56 rounded-full bg-blue-300/20 blur-[80px]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-500/25 sm:h-12 sm:w-12 sm:rounded-2xl">
              <HardHat className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-3xl">BuildTrack</h1>
              <p className="text-xs text-slate-500">Track payments, expenses, and profitability across all sites</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExport} className="gap-1.5 min-h-[44px] flex-1 sm:flex-none">
              <Download className="h-4 w-4" />
              <span className="sm:hidden">Backup</span>
              <span className="hidden sm:inline">Download Backup</span>
            </Button>
            <Button onClick={() => setShowForm(true)} className="gap-1.5 min-h-[44px] flex-1 sm:flex-none">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>
      </div>

      {/* Stats — matching project detail summary cards */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="flex items-center gap-3 rounded-2xl bg-white/50 p-4 ring-1 ring-white/70 backdrop-blur-md transition-colors hover:bg-white/70">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100/80 text-brand-700 ring-1 ring-white/70 backdrop-blur-sm">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Active Projects</p>
            <p className="text-lg font-bold text-slate-900">{projects.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-white/50 p-4 ring-1 ring-white/70 backdrop-blur-md transition-colors hover:bg-white/70">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-700 ring-1 ring-white/70 backdrop-blur-sm">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Owner Payments Received</p>
            <p className="text-lg font-bold text-emerald-600">{formatCurrency(totals.revenue)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-white/50 p-4 ring-1 ring-white/70 backdrop-blur-md transition-colors hover:bg-white/70">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100/80 text-rose-700 ring-1 ring-white/70 backdrop-blur-sm">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Construction Cost</p>
            <p className="text-lg font-bold text-rose-600">{formatCurrency(totals.expenses)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-white/50 p-4 ring-1 ring-white/70 backdrop-blur-md transition-colors hover:bg-white/70">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-700 ring-1 ring-white/70 backdrop-blur-sm">
            <PiggyBank className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Balance</p>
            <p className={`text-lg font-bold ${totals.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(Math.abs(totals.balance))}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-white/50 p-4 ring-1 ring-white/70 backdrop-blur-md transition-colors hover:bg-white/70">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100/80 text-brand-700 ring-1 ring-white/70 backdrop-blur-sm">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Commission Payable</p>
            <p className="text-lg font-bold text-brand-600">{formatCurrency(totals.commission)}</p>
          </div>
        </div>
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
    </>
  );
}
