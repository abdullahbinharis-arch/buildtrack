'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TabNav } from '@/components/TabNav';
import { PaymentForm, PaymentFormData } from '@/components/PaymentForm';
import { ExpenseForm, ExpenseFormData } from '@/components/ExpenseForm';
import { ProjectForm } from '@/components/ProjectForm';
import { DataTable } from '@/components/DataTable';
import { DeleteConfirm } from '@/components/DeleteConfirm';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { apiFetch } from '@/lib/fetch-client';
import {
  ArrowLeft,
  HardHat,
  Trash2,
  Pencil,
  Wallet,
  Users,
  Package,
  Receipt,
  Percent,
} from 'lucide-react';

const TABS = ['All Transactions', 'Owner Payments', 'Owner Direct Payments', 'Subcontractor Payments', 'Material Expenses', 'Commission Payout'];

export interface ProjectWithRecords {
  id: string;
  name: string;
  estimated_value: number;
  commission_rate: number;
  owner_payments: OwnerPaymentRow[];
  owner_direct_payments: OwnerDirectPaymentRow[];
  subcontractor_payments: SubcontractorPaymentRow[];
  material_expenses: MaterialExpenseRow[];
  commission_payouts: CommissionPayoutRow[];
}

interface OwnerPaymentRow {
  id: string;
  date: string;
  amount: number;
}

interface OwnerDirectPaymentRow {
  id: string;
  date: string;
  amount: number;
  description: string | null;
}

interface SubcontractorPaymentRow {
  id: string;
  date: string;
  amount: number;
  type: 'Labour' | 'Labour+Material';
  description: string | null;
}

interface MaterialExpenseRow {
  id: string;
  date: string;
  amount: number;
  description: string | null;
}

interface CommissionPayoutRow {
  id: string;
  date: string;
  amount: number;
  description: string | null;
}

interface ProjectDetailClientProps {
  initialProject: ProjectWithRecords;
}

export default function ProjectDetailClient({ initialProject }: ProjectDetailClientProps) {
  const router = useRouter();
  const [project, setProject] = useState<ProjectWithRecords>(initialProject);
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [editing, setEditing] = useState<OwnerPaymentRow | OwnerDirectPaymentRow | SubcontractorPaymentRow | MaterialExpenseRow | CommissionPayoutRow | null>(null);
  const [deleting, setDeleting] = useState<{ type: 'project' | 'owner' | 'owner_direct' | 'sub' | 'expense' | 'commission_payout'; id: string } | null>(null);
  const [editingProject, setEditingProject] = useState(false);

  useEffect(() => {
    const hasKey = sessionStorage.getItem('buildtrack_key');
    if (!hasKey) {
      apiFetch(`/api/projects/${project.id}`).then((res) => {
        if (res.status === 401) router.push('/login');
      });
    }
  }, []);

  const fetchProject = async () => {
    const res = await apiFetch(`/api/projects/${project.id}`);
    const data = await res.json();
    setProject(data);
  };

  const received = project.owner_payments.reduce((s, p) => s + p.amount, 0);
  const directCost = project.owner_direct_payments.reduce((s, p) => s + p.amount, 0);
  const subCost = project.subcontractor_payments.reduce((s, p) => s + p.amount, 0);
  const matCost = project.material_expenses.reduce((s, p) => s + p.amount, 0);
  const totalCost = subCost + matCost + directCost;
  const profit = received - totalCost;
  const commissionReceivable = (totalCost * project.commission_rate) / 100;
  const commissionPaid = project.commission_payouts.reduce((s, p) => s + p.amount, 0);
  const commissionPayable = commissionReceivable - commissionPaid;

  const handleUpdateProject = async (data: { name: string; estimated_value: number; commission_rate: number }) => {
    await apiFetch(`/api/projects/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setEditingProject(false);
    fetchProject();
  };

  const handleDeleteProject = async () => {
    await apiFetch(`/api/projects/${project.id}`, { method: 'DELETE' });
    router.push('/');
  };

  const submitOwner = async (data: PaymentFormData) => {
    const base = { amount: data.amount, date: data.date };
    const url = editing
      ? `/api/projects/${project.id}/owner-payments/${editing.id}`
      : `/api/projects/${project.id}/owner-payments`;
    await apiFetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(base),
    });
    setEditing(null);
    fetchProject();
  };

  const submitOwnerDirect = async (data: ExpenseFormData) => {
    const url = editing
      ? `/api/projects/${project.id}/owner-direct-payments/${editing.id}`
      : `/api/projects/${project.id}/owner-direct-payments`;
    await apiFetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setEditing(null);
    fetchProject();
  };

  const submitSub = async (data: PaymentFormData) => {
    if (!('type' in data)) return;
    const url = editing
      ? `/api/projects/${project.id}/subcontractor-payments/${editing.id}`
      : `/api/projects/${project.id}/subcontractor-payments`;
    await apiFetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setEditing(null);
    fetchProject();
  };

  const submitExpense = async (data: ExpenseFormData) => {
    const url = editing
      ? `/api/projects/${project.id}/material-expenses/${editing.id}`
      : `/api/projects/${project.id}/material-expenses`;
    await apiFetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setEditing(null);
    fetchProject();
  };

  const submitCommissionPayout = async (data: ExpenseFormData) => {
    const url = editing
      ? `/api/projects/${project.id}/commission-payouts/${editing.id}`
      : `/api/projects/${project.id}/commission-payouts`;
    await apiFetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setEditing(null);
    fetchProject();
  };

  const deleteRow = async (endpoint: string) => {
    await apiFetch(endpoint, { method: 'DELETE' });
    setDeleting(null);
    fetchProject();
  };

  const SummaryCard = ({
    label,
    value,
    tone,
    valueTone,
    icon: Icon,
  }: {
    label: string;
    value: string;
    tone?: 'neutral' | 'success' | 'danger' | 'info';
    valueTone?: 'neutral' | 'success' | 'danger' | 'info';
    icon: React.ElementType;
  }) => {
    const toneClasses = {
      neutral: 'bg-slate-100/80 text-slate-700',
      success: 'bg-emerald-100/80 text-emerald-700',
      danger: 'bg-rose-100/80 text-rose-700',
      info: 'bg-brand-100/80 text-brand-700',
    };
    const valueClasses = {
      neutral: 'text-slate-900',
      success: 'text-emerald-600',
      danger: 'text-rose-600',
      info: 'text-brand-600',
    };
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-white/50 p-4 ring-1 ring-white/70 backdrop-blur-md transition-colors hover:bg-white/70">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-white/70 backdrop-blur-sm ${toneClasses[tone || 'neutral']}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className={`text-lg font-bold ${valueClasses[valueTone || 'neutral']}`}>{value}</p>
        </div>
      </div>
    );
  };

  const dateCell = (row: { date: string }) => formatDate(row.date);

  const allTransactions = [
    ...project.owner_payments.map((r) => ({ ...r, category: 'Owner Payment', description: null })),
    ...project.owner_direct_payments.map((r) => ({ ...r, category: 'Owner Direct' })),
    ...project.subcontractor_payments.map((r) => ({ ...r, category: 'Subcontractor' })),
    ...project.material_expenses.map((r) => ({ ...r, category: 'Material' })),
    ...project.commission_payouts.map((r) => ({ ...r, category: 'Commission Payout' })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const editFromAll = (row: typeof allTransactions[number]) => {
    switch (row.category) {
      case 'Owner Payment':
        setActiveTab('Owner Payments');
        setEditing(row as OwnerPaymentRow);
        break;
      case 'Owner Direct':
        setActiveTab('Owner Direct Payments');
        setEditing(row as OwnerDirectPaymentRow);
        break;
      case 'Subcontractor':
        setActiveTab('Subcontractor Payments');
        setEditing(row as unknown as SubcontractorPaymentRow);
        break;
      case 'Material':
        setActiveTab('Material Expenses');
        setEditing(row as MaterialExpenseRow);
        break;
      case 'Commission Payout':
        setActiveTab('Commission Payout');
        setEditing(row as CommissionPayoutRow);
        break;
    }
  };

  const deleteFromAll = (row: typeof allTransactions[number]) => {
    switch (row.category) {
      case 'Owner Payment':
        setActiveTab('Owner Payments');
        setDeleting({ type: 'owner', id: row.id });
        break;
      case 'Owner Direct':
        setActiveTab('Owner Direct Payments');
        setDeleting({ type: 'owner_direct', id: row.id });
        break;
      case 'Subcontractor':
        setActiveTab('Subcontractor Payments');
        setDeleting({ type: 'sub', id: row.id });
        break;
      case 'Material':
        setActiveTab('Material Expenses');
        setDeleting({ type: 'expense', id: row.id });
        break;
      case 'Commission Payout':
        setActiveTab('Commission Payout');
        setDeleting({ type: 'commission_payout', id: row.id });
        break;
    }
  };

  return (
    <>
      <button
        onClick={() => router.push('/')}
        className="mb-3 flex min-h-[44px] items-center gap-1.5 pl-0 text-sm font-medium text-slate-500 transition-colors hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Project header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/95 via-slate-50/95 to-white/95 p-4 shadow-xl shadow-slate-900/5 ring-1 ring-white/80 backdrop-blur-2xl sm:rounded-3xl sm:p-6">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-300/20 blur-[80px]" />
        <div className="absolute -bottom-12 -left-12 h-56 w-56 rounded-full bg-blue-300/20 blur-[80px]" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-500/25 sm:h-12 sm:w-12 sm:rounded-2xl">
              <HardHat className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-3xl">{project.name}</h1>
                <Badge variant="info">Active</Badge>
              </div>
              <p className="text-xs text-slate-500">Construction site financial overview</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setEditingProject(true)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/80 bg-white/50 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-white/70 backdrop-blur-sm transition-colors hover:bg-white/70 sm:text-sm"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
            <button
              onClick={() => setDeleting({ type: 'project', id: project.id })}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl border border-rose-200/80 bg-rose-50/50 px-3.5 py-2 text-xs font-semibold text-rose-700 shadow-sm ring-1 ring-white/70 backdrop-blur-sm transition-colors hover:bg-rose-50/80 sm:text-sm"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-3 lg:grid-cols-5">
          {project.estimated_value > 0 && (
            <SummaryCard label="Contract" value={formatCurrency(project.estimated_value)} icon={Receipt} />
          )}
          <SummaryCard label="Received" value={formatCurrency(received)} tone="success" icon={Wallet} />
          <SummaryCard label="Total Cost" value={formatCurrency(totalCost)} tone="danger" icon={Users} />
          <SummaryCard label="Balance" value={formatCurrency(Math.abs(profit))} tone={profit >= 0 ? 'success' : 'danger'} valueTone={profit >= 0 ? 'success' : 'danger'} icon={Package} />
          <SummaryCard label={`Commission (${project.commission_rate}%)`} value={formatCurrency(Math.abs(commissionPayable))} tone={commissionPayable >= 0 ? 'success' : 'danger'} valueTone={commissionPayable >= 0 ? 'success' : 'danger'} icon={Percent} />
        </div>

        {editingProject && (
          <div className="relative mt-5">
            <ProjectForm
              initial={{
                name: project.name,
                estimated_value: project.estimated_value,
                commission_rate: project.commission_rate,
              }}
              submitLabel="Save Changes"
              onSubmit={handleUpdateProject}
              onCancel={() => setEditingProject(false)}
            />
          </div>
        )}

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
        <div className="border-b border-white/60 bg-white/40 px-3 pt-2 sm:px-4">
          <TabNav tabs={TABS} active={activeTab} onChange={setActiveTab} />
        </div>

        <div className="p-4 sm:p-5">
          {activeTab === 'Owner Payments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Owner Payments</CardTitle>
                  <CardDescription className="hidden sm:block">Money received from the project owner</CardDescription>
                </div>
              </div>
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
                  onConfirm={() => deleteRow(`/api/projects/${project.id}/owner-payments/${deleting.id}`)}
                  onCancel={() => setDeleting(null)}
                />
              )}
            </div>
          )}

          {activeTab === 'Owner Direct Payments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Owner Direct Payments</CardTitle>
                  <CardDescription className="hidden sm:block">Payments made directly by the owner to vendors</CardDescription>
                </div>
              </div>
              <ExpenseForm
                key={editing?.id || 'owner-direct-new'}
                initial={editing as OwnerDirectPaymentRow | undefined}
                onSubmit={submitOwnerDirect}
                onCancel={editing ? () => setEditing(null) : undefined}
              />
              <DataTable
                columns={[
                  { key: 'date', label: 'Date', render: dateCell },
                  { key: 'description', label: 'Description' },
                  { key: 'amount', label: 'Amount', render: (r) => formatCurrency(r.amount) },
                ]}
                rows={project.owner_direct_payments}
                onEdit={(r) => setEditing(r)}
                onDelete={(r) => setDeleting({ type: 'owner_direct', id: r.id })}
              />
              {deleting?.type === 'owner_direct' && (
                <DeleteConfirm
                  title="Delete this owner direct payment?"
                  onConfirm={() => deleteRow(`/api/projects/${project.id}/owner-direct-payments/${deleting.id}`)}
                  onCancel={() => setDeleting(null)}
                />
              )}
            </div>
          )}

          {activeTab === 'Subcontractor Payments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Subcontractor Payments</CardTitle>
                  <CardDescription className="hidden sm:block">Payments made to subcontractors and labour</CardDescription>
                </div>
              </div>
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
                  onConfirm={() => deleteRow(`/api/projects/${project.id}/subcontractor-payments/${deleting.id}`)}
                  onCancel={() => setDeleting(null)}
                />
              )}
            </div>
          )}

          {activeTab === 'Material Expenses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Material Expenses</CardTitle>
                  <CardDescription className="hidden sm:block">Direct material and operational costs</CardDescription>
                </div>
              </div>
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
                  onConfirm={() => deleteRow(`/api/projects/${project.id}/material-expenses/${deleting.id}`)}
                  onCancel={() => setDeleting(null)}
                />
              )}
            </div>
          )}

          {activeTab === 'All Transactions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Transactions</CardTitle>
                  <CardDescription className="hidden sm:block">Combined view of every payment, expense, and commission payout</CardDescription>
                </div>
              </div>
              <DataTable
                columns={[
                  { key: 'date', label: 'Date', render: dateCell },
                  { key: 'category', label: 'Category' },
                  { key: 'description', label: 'Description' },
                  { key: 'amount', label: 'Amount', render: (r) => formatCurrency(r.amount) },
                ]}
                rows={allTransactions}
                onEdit={editFromAll}
                onDelete={deleteFromAll}
              />
            </div>
          )}

          {activeTab === 'Commission Payout' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Commission Payout</CardTitle>
                  <CardDescription className="hidden sm:block">Record commission amounts paid out for this project</CardDescription>
                </div>
              </div>
              <ExpenseForm
                key={editing?.id || 'commission-new'}
                initial={editing as CommissionPayoutRow | undefined}
                hideDescription
                onSubmit={submitCommissionPayout}
                onCancel={editing ? () => setEditing(null) : undefined}
              />
              <DataTable
                columns={[
                  { key: 'date', label: 'Date', render: dateCell },
                  { key: 'amount', label: 'Amount', render: (r) => formatCurrency(r.amount) },
                ]}
                rows={project.commission_payouts}
                onEdit={(r) => setEditing(r)}
                onDelete={(r) => setDeleting({ type: 'commission_payout', id: r.id })}
              />
              {deleting?.type === 'commission_payout' && (
                <DeleteConfirm
                  title="Delete this commission payout?"
                  onConfirm={() => deleteRow(`/api/projects/${project.id}/commission-payouts/${deleting.id}`)}
                  onCancel={() => setDeleting(null)}
                />
              )}
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
