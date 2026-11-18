'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectCard } from '@/components/ProjectCard';
import { ProjectForm } from '@/components/ProjectForm';
import { formatCurrency } from '@/lib/utils';
import { apiFetch } from '@/lib/fetch-client';
import {
  HardHat, Download, Plus, TrendingUp, Wallet, PiggyBank, Building2, Percent, Receipt,
} from 'lucide-react';

interface ProjectSummary {
  id: string;
  name: string;
  estimated_value: number;
  commission_rate: number;
  archived: boolean;
  created_at: string;
  total_received: number;
  total_expenses: number;
  total_project_cost?: number;
  profit_loss: number;
  commission_paid: number;
  liabilities: number;
}

interface DashboardClientProps {
  initialProjects: ProjectSummary[];
}

export default function DashboardClient({ initialProjects }: DashboardClientProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectSummary[]>(initialProjects);
  const [showForm, setShowForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

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

  const activeProjects = useMemo(() => projects.filter((p) => !p.archived), [projects]);
  const archivedProjects = useMemo(() => projects.filter((p) => p.archived), [projects]);
  const visibleProjects = showArchived ? archivedProjects : activeProjects;

  const totals = useMemo(() => {
    return activeProjects.reduce(
      (acc, p) => {
        acc.revenue += p.total_received;
        acc.expenses += p.total_expenses;
        acc.projectCost += p.total_project_cost ?? p.total_expenses;
        acc.balance += p.profit_loss;
        acc.commission += p.commission_paid;
        acc.liabilities += p.liabilities ?? 0;
        return acc;
      },
      { revenue: 0, expenses: 0, projectCost: 0, balance: 0, commission: 0, liabilities: 0 }
    );
  }, [activeProjects]);

  return (
    <>
      {/* Hero card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/95 via-slate-50/95 to-white/95 px-4 py-4 shadow-xl shadow-slate-900/5 ring-1 ring-white/80 backdrop-blur-2xl sm:rounded-3xl sm:p-6">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-300/20 blur-[80px]" />
        <div className="absolute -bottom-12 -left-12 h-56 w-56 rounded-full bg-blue-300/20 blur-[80px]" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-500/25 sm:h-12 sm:w-12 sm:rounded-2xl">
              <HardHat className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-3xl">BuildTrack</h1>
              <p className="text-[10px] text-slate-500 truncate sm:text-xs">Track payments, expenses, and profitability</p>
            </div>
          </div>
          <div className="flex gap-1.5 sm:gap-2">
            <button
              onClick={handleExport}
              className="flex min-h-[36px] items-center gap-1 rounded-lg border border-white/80 bg-white/50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-white/70 backdrop-blur-sm transition-colors hover:bg-white/70 sm:min-h-[44px] sm:rounded-xl sm:px-4 sm:py-2 sm:text-sm"
            >
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Download Backup</span>
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex min-h-[36px] items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-md shadow-brand-500/20 transition-all hover:bg-brand-700 sm:min-h-[44px] sm:rounded-xl sm:px-4 sm:py-2 sm:text-sm"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">New Project</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats — matching project detail summary cards */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="flex items-center gap-3 rounded-2xl bg-white/50 p-4 ring-1 ring-white/70 backdrop-blur-md transition-colors hover:bg-white/70">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100/80 text-brand-700 ring-1 ring-white/70 backdrop-blur-sm">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Active Projects</p>
            <p className="text-lg font-bold text-slate-900">{activeProjects.length}</p>
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100/80 text-purple-700 ring-1 ring-white/70 backdrop-blur-sm">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Commission Paid</p>
            <p className="text-lg font-bold text-purple-600">{formatCurrency(totals.commission)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-white/50 p-4 ring-1 ring-white/70 backdrop-blur-md transition-colors hover:bg-white/70">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100/80 text-amber-700 ring-1 ring-white/70 backdrop-blur-sm">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Liabilities (Credit)</p>
            <p className="text-lg font-bold text-amber-600">{formatCurrency(totals.liabilities)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-white/50 p-4 ring-1 ring-white/70 backdrop-blur-md transition-colors hover:bg-white/70">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-700 ring-1 ring-white/70 backdrop-blur-sm">
            <PiggyBank className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Balance in Hand</p>
            <p className={`text-lg font-bold ${totals.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(Math.abs(totals.balance))}
              {totals.balance < 0 && ' deficit'}
            </p>
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
        <div className="flex items-center justify-between">
          <h2 className="section-title">Projects</h2>
          {archivedProjects.length > 0 && (
            <div className="flex rounded-xl bg-white/50 p-1 ring-1 ring-white/70 backdrop-blur-sm">
              <button
                onClick={() => setShowArchived(false)}
                className={`min-h-[36px] rounded-lg px-4 text-sm font-semibold transition-colors ${
                  !showArchived ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active ({activeProjects.length})
              </button>
              <button
                onClick={() => setShowArchived(true)}
                className={`min-h-[36px] rounded-lg px-4 text-sm font-semibold transition-colors ${
                  showArchived ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Archived ({archivedProjects.length})
              </button>
            </div>
          )}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visibleProjects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>

        {visibleProjects.length === 0 && (
          <div className="mt-6 flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/80 bg-white/40 p-10 text-center backdrop-blur-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/60 text-slate-400 ring-1 ring-white/70">
              <HardHat className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-900">
              {showArchived ? 'No archived projects' : 'No projects yet'}
            </p>
            <p className="text-xs text-slate-500">
              {showArchived ? 'Completed projects you archive will appear here.' : 'Click “New Project” to get started.'}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
