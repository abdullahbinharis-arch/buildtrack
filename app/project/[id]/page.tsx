'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TabNav } from '@/components/TabNav';
import { PaymentForm, PaymentFormData } from '@/components/PaymentForm';
import { ExpenseForm, ExpenseFormData } from '@/components/ExpenseForm';
import { DataTable } from '@/components/DataTable';
import { DeleteConfirm } from '@/components/DeleteConfirm';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  HardHat,
  Trash2,
  Wallet,
  Users,
  Package,
  Receipt,
} from 'lucide-react';

const TABS = ['Owner Payments', 'Subcontractor Payments', 'Material Expenses'];

interface ProjectWithRecords {
  id: string;
  name: string;
  estimated_value: number;
  owner_payments: OwnerPaymentRow[];
  subcontractor_payments: SubcontractorPaymentRow[];
  material_expenses: MaterialExpenseRow[];
}

interface OwnerPaymentRow {
  id: string;
  date: string | Date;
  amount: number;
}

interface SubcontractorPaymentRow {
  id: string;
  date: string | Date;
  amount: number;
  type: 'Labour' | 'Labour+Material';
  description: string | null;
}

interface MaterialExpenseRow {
  id: string;
  date: string | Date;
  amount: number;
  description: string | null;
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<ProjectWithRecords | null>(null);
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [editing, setEditing] = useState<OwnerPaymentRow | SubcontractorPaymentRow | MaterialExpenseRow | null>(null);
  const [deleting, setDeleting] = useState<{ type: 'project' | 'owner' | 'sub' | 'expense'; id: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProject = useCallback(async () => {
    const res = await fetch(`/api/projects/${id}`);
    const data = await res.json();
    setProject(data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-rose-50/30">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-rose-50/30">
        <p className="text-slate-500">Project not found.</p>
      </div>
    );
  }

  const received = project.owner_payments.reduce((s: number, p) => s + p.amount, 0);
  const subCost = project.subcontractor_payments.reduce((s: number, p) => s + p.amount, 0);
  const matCost = project.material_expenses.reduce((s: number, p) => s + p.amount, 0);
  const totalCost = subCost + matCost;
  const profit = received - totalCost;

  const handleDeleteProject = async () => {
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    router.push('/');
  };

  const submitOwner = async (data: PaymentFormData) => {
    const base = { amount: data.amount, date: data.date };
    const url = editing
      ? `/api/projects/${id}/owner-payments/${editing.id}`
      : `/api/projects/${id}/owner-payments`;
    await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(base),
    });
    setEditing(null);
    fetchProject();
  };

  const submitSub = async (data: PaymentFormData) => {
    if (!('type' in data)) return;
    const url = editing
      ? `/api/projects/${id}/subcontractor-payments/${editing.id}`
      : `/api/projects/${id}/subcontractor-payments`;
    await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setEditing(null);
    fetchProject();
  };

  const submitExpense = async (data: ExpenseFormData) => {
    const url = editing
      ? `/api/projects/${id}/material-expenses/${editing.id}`
      : `/api/projects/${id}/material-expenses`;
    await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setEditing(null);
    fetchProject();
  };

  const deleteRow = async (endpoint: string) => {
    await fetch(endpoint, { method: 'DELETE' });
    setDeleting(null);
    fetchProject();
  };

  const SummaryCard = ({
    label,
    value,
    tone,
    icon: Icon,
  }: {
    label: string;
    value: string;
    tone?: 'neutral' | 'success' | 'danger' | 'info';
    icon: React.ElementType;
  }) => {
    const toneClasses = {
      neutral: 'bg-slate-100/80 text-slate-700',
      success: 'bg-emerald-100/80 text-emerald-700',
      danger: 'bg-rose-100/80 text-rose-700',
      info: 'bg-brand-100/80 text-brand-700',
    };
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-white/50 p-4 ring-1 ring-white/70 backdrop-blur-md transition-colors hover:bg-white/70">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-white/70 backdrop-blur-sm ${toneClasses[tone || 'neutral']}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-lg font-bold text-slate-900">{value}</p>
        </div>
      </div>
    );
  };

  const dateCell = (row: { date: string | Date }) => formatDate(row.date);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/30 to-rose-50/30">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-20 top-0 h-96 w-96 rounded-full bg-violet-300/25 blur-[120px]" />
        <div className="absolute right-0 top-24 h-[28rem] w-[28rem] rounded-full bg-rose-300/20 blur-[130px]" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-emerald-300/20 blur-[120px]" />
      </div>

      <main className="page-container animate-fade-in">
        <Button variant="ghost" onClick={() => router.push('/')} className="mb-4 gap-1.5 pl-0">
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Button>

        {/* Project header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/95 via-slate-50/95 to-white/95 p-6 shadow-xl shadow-slate-900/5 ring-1 ring-white/80 backdrop-blur-2xl">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-300/20 blur-[80px]" />
          <div className="absolute -bottom-12 -left-12 h-56 w-56 rounded-full bg-blue-300/20 blur-[80px]" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-500/25">
                <HardHat className="h-6 w-6" />
              </div>
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{project.name}</h1>
                  <Badge variant="info">Active</Badge>
                </div>
                <p className="text-xs text-slate-500">Construction site financial overview</p>
              </div>
            </div>
            <Button variant="danger" onClick={() => setDeleting({ type: 'project', id: project.id })} className="gap-1.5">
              <Trash2 className="h-4 w-4" />
              Delete Project
            </Button>
          </div>

          <div className="relative mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard label="Contract" value={formatCurrency(project.estimated_value)} icon={Receipt} />
            <SummaryCard label="Received" value={formatCurrency(received)} tone="success" icon={Wallet} />
            <SummaryCard label="Total Cost" value={formatCurrency(totalCost)} tone="danger" icon={Users} />
            <SummaryCard label="Profit" value={`${profit >= 0 ? '+' : ''}${formatCurrency(profit)}`} tone={profit >= 0 ? 'success' : 'danger'} icon={Package} />
          </div>

          {deleting?.type === 'project' && (
            <div className="relative mt-5">
              <DeleteConfirm
                title="Are you sure you want to delete this project and all its records?"
                onConfirm={handleDeleteProject}
                onCancel={() => setDeleting(null)}
              />
            </div>
          )}
        </div>

        {/* Tabs */}
        <Card className="mt-6 overflow-hidden p-0">
          <div className="border-b border-white/60 bg-white/40 px-4 pt-2">
            <TabNav tabs={TABS} active={activeTab} onChange={setActiveTab} />
          </div>

          <div className="p-5">
            {activeTab === 'Owner Payments' && (
              <div className="space-y-4">
                <CardHeader>
                  <div>
                    <CardTitle>Owner Payments</CardTitle>
                    <CardDescription>Money received from the project owner</CardDescription>
                  </div>
                </CardHeader>
                <PaymentForm
                  key={editing?.id || 'owner-new'}
                  initial={editing as OwnerPaymentRow | undefined}
                  onSubmit={submitOwner}
                  onCancel={editing ? () => setEditing(null) : undefined}
                />
                <DataTable
                  columns={[
                    { key: 'date', label: 'Date', render: dateCell },
                    { key: 'amount', label: 'Amount', render: (r) => formatCurrency(r.amount) },
                  ]}
                  rows={project.owner_payments}
                  onEdit={(r) => setEditing(r)}
                  onDelete={(r) => setDeleting({ type: 'owner', id: r.id })}
                />
                {deleting?.type === 'owner' && (
                  <DeleteConfirm
                    title="Delete this owner payment?"
                    onConfirm={() => deleteRow(`/api/projects/${id}/owner-payments/${deleting.id}`)}
                    onCancel={() => setDeleting(null)}
                  />
                )}
              </div>
            )}

            {activeTab === 'Subcontractor Payments' && (
              <div className="space-y-4">
                <CardHeader>
                  <div>
                    <CardTitle>Subcontractor Payments</CardTitle>
                    <CardDescription>Payments made to subcontractors and labour</CardDescription>
                  </div>
                </CardHeader>
                <PaymentForm
                  key={editing?.id || 'sub-new'}
                  initial={editing as SubcontractorPaymentRow | undefined}
                  showType
                  onSubmit={submitSub}
                  onCancel={editing ? () => setEditing(null) : undefined}
                />
                <DataTable
                  columns={[
                    { key: 'date', label: 'Date', render: dateCell },
                    { key: 'type', label: 'Type' },
                    { key: 'description', label: 'Description' },
                    { key: 'amount', label: 'Amount', render: (r) => formatCurrency(r.amount) },
                  ]}
                  rows={project.subcontractor_payments}
                  onEdit={(r) => setEditing(r)}
                  onDelete={(r) => setDeleting({ type: 'sub', id: r.id })}
                />
                {deleting?.type === 'sub' && (
                  <DeleteConfirm
                    title="Delete this subcontractor payment?"
                    onConfirm={() => deleteRow(`/api/projects/${id}/subcontractor-payments/${deleting.id}`)}
                    onCancel={() => setDeleting(null)}
                  />
                )}
              </div>
            )}

            {activeTab === 'Material Expenses' && (
              <div className="space-y-4">
                <CardHeader>
                  <div>
                    <CardTitle>Material Expenses</CardTitle>
                    <CardDescription>Direct material and operational costs</CardDescription>
                  </div>
                </CardHeader>
                <ExpenseForm
                  key={editing?.id || 'exp-new'}
                  initial={editing as MaterialExpenseRow | undefined}
                  onSubmit={submitExpense}
                  onCancel={editing ? () => setEditing(null) : undefined}
                />
                <DataTable
                  columns={[
                    { key: 'date', label: 'Date', render: dateCell },
                    { key: 'description', label: 'Description' },
                    { key: 'amount', label: 'Amount', render: (r) => formatCurrency(r.amount) },
                  ]}
                  rows={project.material_expenses}
                  onEdit={(r) => setEditing(r)}
                  onDelete={(r) => setDeleting({ type: 'expense', id: r.id })}
                />
                {deleting?.type === 'expense' && (
                  <DeleteConfirm
                    title="Delete this material expense?"
                    onConfirm={() => deleteRow(`/api/projects/${id}/material-expenses/${deleting.id}`)}
                    onCancel={() => setDeleting(null)}
                  />
                )}
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
