'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TabNav } from '@/components/TabNav';
import { PaymentForm, PaymentFormData } from '@/components/PaymentForm';
import { ExpenseForm, ExpenseFormData } from '@/components/ExpenseForm';
import { DataTable } from '@/components/DataTable';
import { DeleteConfirm } from '@/components/DeleteConfirm';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const TABS = ['Owner Payments', 'Subcontractor Payments', 'Material Expenses'];

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

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
  }, [id, fetchProject]);

  if (loading) return <div className="p-10 text-slate-500">Loading…</div>;
  if (!project) return <div className="p-10 text-slate-500">Project not found.</div>;

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

  const dateCell = (row: { date: string | Date }) => new Date(row.date).toLocaleDateString('en-IN');

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Button variant="ghost" onClick={() => router.push('/')} className="mb-2 px-0">
              ← Back
            </Button>
            <h1 className="text-3xl font-bold text-slate-900">{project.name}</h1>
          </div>
          <Button variant="danger" onClick={() => setDeleting({ type: 'project', id: project.id })}>
            Delete Project
          </Button>
        </div>

        <Card className="mt-6 grid grid-cols-2 gap-4 p-5 md:grid-cols-4">
          <div>
            <p className="text-xs uppercase text-slate-500">Contract</p>
            <p className="text-lg font-semibold">{fmt(project.estimated_value)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Received</p>
            <p className="text-lg font-semibold text-emerald-600">{fmt(received)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Total Cost</p>
            <p className="text-lg font-semibold text-rose-600">{fmt(totalCost)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Profit</p>
            <p className={`text-lg font-semibold ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {fmt(profit)}
            </p>
          </div>
        </Card>

        {deleting?.type === 'project' && (
          <div className="mt-4">
            <DeleteConfirm
              title="Are you sure you want to delete this project and all its records?"
              onConfirm={handleDeleteProject}
              onCancel={() => setDeleting(null)}
            />
          </div>
        )}

        <div className="mt-8">
          <TabNav tabs={TABS} active={activeTab} onChange={setActiveTab} />
        </div>

        <div className="mt-6">
          {activeTab === 'Owner Payments' && (
            <div className="space-y-4">
              <PaymentForm
                key={editing?.id || 'owner-new'}
                initial={editing as OwnerPaymentRow | undefined}
                onSubmit={submitOwner}
                onCancel={editing ? () => setEditing(null) : undefined}
              />
              <DataTable
                columns={[
                  { key: 'date', label: 'Date', render: dateCell },
                  { key: 'amount', label: 'Amount', render: (r) => fmt(r.amount) },
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
                  { key: 'amount', label: 'Amount', render: (r) => fmt(r.amount) },
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
                  { key: 'amount', label: 'Amount', render: (r) => fmt(r.amount) },
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
      </div>
    </main>
  );
}
