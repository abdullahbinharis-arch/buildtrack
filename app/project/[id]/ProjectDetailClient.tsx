'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { TabNav } from '@/components/TabNav';
import { PaymentForm, PaymentFormData } from '@/components/PaymentForm';
import { ExpenseForm, ExpenseFormData } from '@/components/ExpenseForm';
import { ProjectForm } from '@/components/ProjectForm';
import { DataTable } from '@/components/DataTable';
import { DeleteConfirm } from '@/components/DeleteConfirm';
import { Toast } from '@/components/ui/Toast';
import { Card, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { CATEGORY_STYLES, categoryBadgeClass, type CategoryKey } from '@/lib/category-styles';
import { findDuplicateIds, findDuplicateMatch } from '@/lib/find-duplicates';
import { DuplicateConfirm } from '@/components/DuplicateConfirm';
import { apiFetch } from '@/lib/fetch-client';
import { generateProjectReport } from '@/lib/generate-report';
import { computeProjectStats } from '@/lib/project-stats';
import {
  ArrowLeft,
  HardHat,
  Trash2,
  Pencil,
  Upload,
  Download,
  FileText,
  ChevronDown,
  Wallet,
  Users,
  Package,
  Receipt,
  Percent,
  Archive,
  ArchiveRestore,
  CheckCircle2,
  CalendarDays,
  X,
} from 'lucide-react';

const TABS = ['All Transactions', 'Payment Received', 'Owner Direct Payments', 'Subcontractor Payments', 'Material Expenses', 'Misc Expenses', 'Commission Payout'];

export interface ProjectWithRecords {
  id: string;
  name: string;
  estimated_value: number;
  commission_rate: number;
  archived: boolean;
  owner_payments: OwnerPaymentRow[];
  owner_direct_payments: OwnerDirectPaymentRow[];
  subcontractor_payments: SubcontractorPaymentRow[];
  material_expenses: MaterialExpenseRow[];
  miscellaneous_expenses: MiscellaneousExpenseRow[];
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
  paid?: boolean;
}

interface CommissionPayoutRow {
  id: string;
  date: string;
  amount: number;
  description: string | null;
}

interface MiscellaneousExpenseRow {
  id: string;
  date: string;
  amount: number;
  description: string | null;
  paid?: boolean;
}

interface ProjectDetailClientProps {
  initialProject: ProjectWithRecords;
}

export default function ProjectDetailClient({ initialProject }: ProjectDetailClientProps) {
  const router = useRouter();
  const [project, setProject] = useState<ProjectWithRecords>(initialProject);
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [editing, setEditing] = useState<OwnerPaymentRow | OwnerDirectPaymentRow | SubcontractorPaymentRow | MaterialExpenseRow | MiscellaneousExpenseRow | CommissionPayoutRow | null>(null);
  const [deleting, setDeleting] = useState<{ type: 'project' | 'owner' | 'owner_direct' | 'sub' | 'expense' | 'misc' | 'commission_payout'; id: string } | null>(null);
  const [editingProject, setEditingProject] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formKey, setFormKey] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [asOfDate, setAsOfDate] = useState<string>('');
  const [projectList, setProjectList] = useState<{ id: string; name: string }[]>([]);
  const [showProjectSwitcher, setShowProjectSwitcher] = useState(false);
  const projectSwitcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch('/api/projects').then((res) => res.json()).then((data) => {
      if (Array.isArray(data)) setProjectList(data);
    }).catch(() => {});
  }, []);

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

  /* When an "as of" date is chosen, stats are computed only from transactions
     dated on or before that day (inclusive). Tables still show everything. */
  const stats = useMemo(() => {
    if (!asOfDate) return computeProjectStats(project);
    const cutoff = new Date(asOfDate + 'T23:59:59.999');
    const upTo = <T extends { date: string }>(rows: T[]) =>
      rows.filter((r) => new Date(r.date) <= cutoff);
    return computeProjectStats({
      owner_payments: upTo(project.owner_payments),
      owner_direct_payments: upTo(project.owner_direct_payments),
      subcontractor_payments: upTo(project.subcontractor_payments),
      material_expenses: upTo(project.material_expenses),
      miscellaneous_expenses: upTo(project.miscellaneous_expenses),
      commission_payouts: upTo(project.commission_payouts),
    });
  }, [project, asOfDate]);
  const received = stats.received;
  // "Construction Cost" card shows the project's full build spend (incl. owner-direct)
  const constructionCost = stats.totalProjectCost;
  const commissionPaid = stats.commissionPaid;
  const liabilities = stats.liabilities;
  const balanceInHand = stats.balanceInHand;

  const handleToggleArchive = async () => {
    await apiFetch(`/api/projects/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: !project.archived }),
    });
    setToast(project.archived ? 'Project unarchived' : 'Project archived');
    fetchProject();
  };

  const handleMarkPaid = async (kind: 'expense' | 'misc', row: MaterialExpenseRow | MiscellaneousExpenseRow) => {
    const endpoint = kind === 'expense'
      ? `/api/projects/${project.id}/material-expenses/${row.id}`
      : `/api/projects/${project.id}/misc-expenses/${row.id}`;
    await apiFetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: row.amount, date: row.date, description: row.description, paid: true }),
    });
    setToast('Marked as paid');
    fetchProject();
  };

  /* Amber "Credit" pill shown on unpaid bill rows. */
  const CreditBadge = () => (
    <span className="ml-2 inline-flex items-center rounded-full bg-amber-100/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-white/60">
      Credit
    </span>
  );

  const lastUpdated = useMemo(() => {
    const allDates = [
      ...project.owner_payments.map((r) => r.date),
      ...project.owner_direct_payments.map((r) => r.date),
      ...project.subcontractor_payments.map((r) => r.date),
      ...project.material_expenses.map((r) => r.date),
      ...project.miscellaneous_expenses.map((r) => r.date),
      ...project.commission_payouts.map((r) => r.date),
    ];
    if (allDates.length === 0) return null;
    return allDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  }, [project]);

  /* IDs of rows that look like possible duplicates (same category + amount, ≤3 days apart) */
  const dupIds = useMemo(() => {
    const ids = new Set<string>();
    const groups = [
      project.owner_payments,
      project.owner_direct_payments,
      project.subcontractor_payments,
      project.material_expenses,
      project.miscellaneous_expenses,
      project.commission_payouts,
    ];
    groups.forEach((g) => findDuplicateIds(g).forEach((id) => ids.add(id)));
    return ids;
  }, [project]);

  const DuplicateBadge = () => (
    <span className="ml-2 inline-flex items-center rounded-full bg-amber-100/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-white/60">
      Possible duplicate
    </span>
  );

  const AmountCell = ({ category, row }: { category: CategoryKey; row: { id: string; amount: number } }) => {
    const style = CATEGORY_STYLES[category];
    return (
      <span className={`font-semibold ${style.amountClass}`}>
        {style.sign} {formatCurrency(row.amount)}
        {dupIds.has(row.id) && <DuplicateBadge />}
      </span>
    );
  };

  const rowAccent = (category: CategoryKey) => (row: { id: string }) =>
    cn(CATEGORY_STYLES[category].rowClass, dupIds.has(row.id) && 'bg-amber-50/70');

  const cardTint = (row: { id: string }) => (dupIds.has(row.id) ? 'bg-amber-50/80' : '');

  const handleUpdateProject = async (data: { name: string; estimated_value: number; commission_rate: number }) => {
    await apiFetch(`/api/projects/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setEditingProject(false);
    setToast('Project updated');
    fetchProject();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await apiFetch(`/api/projects/${project.id}/import`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setImportResult({ created: data.created, total: data.total });
        fetchProject();
      } else {
        alert(`Import failed: ${data.error}`);
      }
    } catch {
      alert('Import failed — check console');
    } finally {
      setImporting(false);
      // Reset file input so the same file can be re-uploaded
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownloadReport = () => {
    const doc = generateProjectReport(project);
    doc.save(`${project.name.replace(/\s+/g, '_')}_Report.pdf`);
  };

  const handleExportExcel = async () => {
    const res = await apiFetch('/api/export');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BuildTrack_Backup_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDeleteProject = async () => {
    await apiFetch(`/api/projects/${project.id}`, { method: 'DELETE' });
    router.push('/');
  };

  const [pendingDuplicate, setPendingDuplicate] = useState<{
    message: string;
    proceed: () => void;
  } | null>(null);

  /* Entry-time duplicate check: warns before saving a same-amount entry dated within 3 days of an existing one (same category). */
  const checkDuplicateAndSubmit = (
    rows: { id: string; date: string; amount: number }[],
    data: { date: string; amount: number },
    doSubmit: () => Promise<void>
  ): Promise<void> => {
    const match = findDuplicateMatch(rows, data, editing?.id);
    if (!match) {
      return doSubmit();
    }
    setPendingDuplicate({
      message: `${formatCurrency(data.amount)} was already recorded on ${formatDate(match.date)}. Add anyway?`,
      proceed: () => void doSubmit(),
    });
    return Promise.resolve();
  };

  const submitOwner = async (data: PaymentFormData) => {
    await checkDuplicateAndSubmit(project.owner_payments, data, async () => {
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
      setFormKey((k) => k + 1);
      setToast(editing ? 'Updated successfully' : 'Added successfully');
      fetchProject();
    });
  };

  const submitOwnerDirect = async (data: ExpenseFormData) => {
    await checkDuplicateAndSubmit(project.owner_direct_payments, data, async () => {
      const url = editing
        ? `/api/projects/${project.id}/owner-direct-payments/${editing.id}`
        : `/api/projects/${project.id}/owner-direct-payments`;
      await apiFetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setEditing(null);
      setFormKey((k) => k + 1);
      setToast(editing ? 'Updated successfully' : 'Added successfully');
      fetchProject();
    });
  };

  const submitSub = async (data: PaymentFormData) => {
    if (!('type' in data)) return;
    await checkDuplicateAndSubmit(project.subcontractor_payments, data, async () => {
      const url = editing
        ? `/api/projects/${project.id}/subcontractor-payments/${editing.id}`
        : `/api/projects/${project.id}/subcontractor-payments`;
      await apiFetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setEditing(null);
      setFormKey((k) => k + 1);
      setToast(editing ? 'Updated successfully' : 'Added successfully');
      fetchProject();
    });
  };

  const submitExpense = async (data: ExpenseFormData) => {
    await checkDuplicateAndSubmit(project.material_expenses, data, async () => {
      const url = editing
        ? `/api/projects/${project.id}/material-expenses/${editing.id}`
        : `/api/projects/${project.id}/material-expenses`;
      await apiFetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setEditing(null);
      setFormKey((k) => k + 1);
      setToast(editing ? 'Updated successfully' : 'Added successfully');
      fetchProject();
    });
  };

  const submitMisc = async (data: ExpenseFormData) => {
    await checkDuplicateAndSubmit(project.miscellaneous_expenses, data, async () => {
      const url = editing
        ? `/api/projects/${project.id}/misc-expenses/${editing.id}`
        : `/api/projects/${project.id}/misc-expenses`;
      await apiFetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setEditing(null);
      setFormKey((k) => k + 1);
      setToast(editing ? 'Updated successfully' : 'Added successfully');
      fetchProject();
    });
  };

  const submitCommissionPayout = async (data: ExpenseFormData) => {
    await checkDuplicateAndSubmit(project.commission_payouts, data, async () => {
      const url = editing
        ? `/api/projects/${project.id}/commission-payouts/${editing.id}`
        : `/api/projects/${project.id}/commission-payouts`;
      await apiFetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setEditing(null);
      setFormKey((k) => k + 1);
      setToast(editing ? 'Updated successfully' : 'Added successfully');
      fetchProject();
    });
  };

  const deleteRow = async (endpoint: string) => {
    try {
      const res = await apiFetch(endpoint, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to delete');
        return;
      }
      setDeleting(null);
      setToast('Deleted successfully');
      fetchProject();
    } catch {
      alert('Failed to delete — check your connection');
    }
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
    tone?: 'neutral' | 'success' | 'danger' | 'info' | 'warning';
    valueTone?: 'neutral' | 'success' | 'danger' | 'info' | 'warning';
    icon: React.ElementType;
  }) => {
    const toneClasses = {
      neutral: 'bg-slate-100/80 text-slate-700',
      success: 'bg-emerald-100/80 text-emerald-700',
      danger: 'bg-rose-100/80 text-rose-700',
      info: 'bg-brand-100/80 text-brand-700',
      warning: 'bg-amber-100/80 text-amber-700',
    };
    const valueClasses = {
      neutral: 'text-slate-900',
      success: 'text-emerald-600',
      danger: 'text-rose-600',
      info: 'text-brand-600',
      warning: 'text-amber-600',
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

  const TabTotal = ({ category, value }: { category: CategoryKey; value: number }) => (
    <div className="flex shrink-0 items-baseline gap-2 rounded-xl bg-white/50 px-3 py-2 ring-1 ring-white/70 backdrop-blur-sm">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Total</span>
      <span className={`text-lg font-bold ${CATEGORY_STYLES[category].amountClass}`}>{formatCurrency(value)}</span>
    </div>
  );

  const dateCell = (row: { date: string }) => formatDate(row.date);

  const allTransactions = [
    ...project.owner_payments.map((r) => ({ ...r, category: 'Owner Payment', description: null })),
    ...project.owner_direct_payments.map((r) => ({ ...r, category: 'Owner Direct' })),
    ...project.subcontractor_payments.map((r) => ({ ...r, category: 'Subcontractor' })),
    ...project.material_expenses.map((r) => ({ ...r, category: 'Material' })),
    ...project.miscellaneous_expenses.map((r) => ({ ...r, category: 'Misc' })),
    ...project.commission_payouts.map((r) => ({ ...r, category: 'Commission Payout' })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const editFromAll = (row: typeof allTransactions[number]) => {
    switch (row.category) {
      case 'Owner Payment':
        setActiveTab('Payment Received');
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
      case 'Misc':
        setActiveTab('Misc Expenses');
        setEditing(row as MiscellaneousExpenseRow);
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
        setActiveTab('Payment Received');
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
      case 'Misc':
        setActiveTab('Misc Expenses');
        setDeleting({ type: 'misc', id: row.id });
        break;
      case 'Commission Payout':
        setActiveTab('Commission Payout');
        setDeleting({ type: 'commission_payout', id: row.id });
        break;
    }
  };

  return (
    <>
      <div className="mb-3 flex items-center gap-1" ref={projectSwitcherRef}>
        <button
          onClick={() => router.push('/')}
          className="flex min-h-[44px] items-center gap-1.5 pl-0 text-sm font-medium text-slate-500 transition-colors hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <span className="text-slate-300">|</span>
        <div className="relative">
          <button
            onClick={() => setShowProjectSwitcher(!showProjectSwitcher)}
            className="flex min-h-[44px] items-center gap-1 rounded-lg px-2 text-sm font-medium text-slate-600 transition-colors hover:text-brand-600"
          >
            <HardHat className="h-4 w-4" />
            <span className="max-w-[120px] truncate sm:max-w-[200px]">{project.name}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>
          {showProjectSwitcher && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowProjectSwitcher(false)} />
              <div className="absolute left-0 z-40 mt-1 w-56 rounded-xl border border-white/80 bg-white p-1.5 shadow-xl shadow-slate-900/10 ring-1 ring-white/70 backdrop-blur-xl">
                <div className="mb-0.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Switch Project</div>
                {projectList.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setShowProjectSwitcher(false);
                      if (p.id !== project.id) router.push(`/project/${p.id}`);
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      p.id === project.id
                        ? 'bg-brand-50 text-brand-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <HardHat className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{p.name}</span>
                    {p.id === project.id && <span className="ml-auto text-[10px] text-brand-500">Current</span>}
                  </button>
                ))}
                <div className="mt-1 border-t border-white/70 pt-1">
                  <button
                    onClick={() => { setShowProjectSwitcher(false); router.push('/'); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-500 transition-colors hover:bg-slate-100"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Dashboard
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

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
                {project.archived ? (
                  <Badge variant="neutral">Archived</Badge>
                ) : (
                  <Badge variant="info">Active</Badge>
                )}
              </div>
              <p className="text-xs text-slate-500">Construction site financial overview</p>
              {lastUpdated && (
                <p className="mt-0.5 text-xs text-slate-400">
                  Last activity: {formatDate(lastUpdated)}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setEditingProject(true)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/80 bg-white/50 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-white/70 backdrop-blur-sm transition-colors hover:bg-white/70 sm:text-sm"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
            <button
              onClick={handleToggleArchive}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/80 bg-white/50 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-white/70 backdrop-blur-sm transition-colors hover:bg-white/70 sm:text-sm"
            >
              {project.archived ? (
                <>
                  <ArchiveRestore className="h-4 w-4" />
                  Unarchive
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4" />
                  Archive
                </>
              )}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/80 bg-white/50 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-white/70 backdrop-blur-sm transition-colors hover:bg-white/70 disabled:opacity-50 sm:text-sm"
            >
              <Upload className="h-4 w-4" />
              {importing ? 'Importing…' : 'Import CSV'}
            </button>
            <button
              onClick={handleDownloadReport}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/80 bg-white/50 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-white/70 backdrop-blur-sm transition-colors hover:bg-white/70 sm:text-sm"
            >
              <FileText className="h-4 w-4" />
              Report
            </button>
            <button
              onClick={handleExportExcel}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/80 bg-white/50 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-white/70 backdrop-blur-sm transition-colors hover:bg-white/70 sm:text-sm"
            >
              <Download className="h-4 w-4" />
              Excel
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleImport}
              className="hidden"
            />
            <button
              onClick={() => setDeleting({ type: 'project', id: project.id })}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl border border-rose-200/80 bg-rose-50/50 px-3.5 py-2 text-xs font-semibold text-rose-700 shadow-sm ring-1 ring-white/70 backdrop-blur-sm transition-colors hover:bg-rose-50/80 sm:text-sm"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
            {/* As-of date filter — recomputes the summary cards using only transactions up to the chosen date */}
            <div
              className={`flex min-h-[44px] items-center gap-2 rounded-xl px-3 py-1.5 shadow-sm ring-1 backdrop-blur-sm transition-colors ${
                asOfDate
                  ? 'border border-brand-200/80 bg-brand-50/70 ring-brand-200/60'
                  : 'border border-white/80 bg-white/50 ring-white/70 hover:bg-white/70'
              }`}
            >
              <CalendarDays className={`h-4 w-4 shrink-0 ${asOfDate ? 'text-brand-600' : 'text-slate-400'}`} />
              <label htmlFor="as-of-date" className={`text-xs font-semibold sm:text-sm ${asOfDate ? 'text-brand-700' : 'text-slate-500'}`}>
                As of
              </label>
              <input
                id="as-of-date"
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                className="min-h-[32px] rounded-lg border border-white/80 bg-white/70 px-2 py-1 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
              {asOfDate && (
                <button
                  onClick={() => setAsOfDate('')}
                  aria-label="Clear as-of date"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-brand-500 transition-colors hover:bg-brand-100/80 hover:text-brand-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {asOfDate && (
          <div className="mt-3 flex justify-end">
            <span className="rounded-full bg-brand-600 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm shadow-brand-500/25">
              Showing figures as of {formatDate(asOfDate)}
            </span>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <SummaryCard label="Owner Direct" value={formatCurrency(stats.directCost)} icon={Receipt} />
          <SummaryCard label="Owner Payments Received" value={formatCurrency(received)} tone="success" icon={Wallet} />
          <SummaryCard label="Construction Cost" value={formatCurrency(constructionCost)} tone="danger" icon={Users} />
          <SummaryCard label="Commission Paid" value={formatCurrency(commissionPaid)} tone={commissionPaid > 0 ? 'info' : 'neutral'} icon={Percent} />
          <SummaryCard label="Liabilities" value={formatCurrency(liabilities)} tone={liabilities > 0 ? 'warning' : 'neutral'} valueTone={liabilities > 0 ? 'warning' : 'neutral'} icon={FileText} />
          <SummaryCard label="Balance in Hand" value={formatCurrency(Math.abs(balanceInHand))} tone={balanceInHand >= 0 ? 'success' : 'danger'} valueTone={balanceInHand >= 0 ? 'success' : 'danger'} icon={Package} />
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
      </div>

      {/* Import result banner */}
      {importResult && (
        <div className="mt-4 rounded-xl bg-emerald-50/90 px-4 py-3 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200/60 backdrop-blur-sm">
          Imported {importResult.created} of {importResult.total} transactions successfully.
          <button onClick={() => setImportResult(null)} className="ml-3 text-emerald-600 underline hover:text-emerald-800">Dismiss</button>
        </div>
      )}

      {/* Tabs */}
      <Card className="mt-6 overflow-hidden p-0">
        <div className="bg-white/40 px-3 pt-3 pb-1 sm:px-4">
          <TabNav
            tabs={TABS}
            active={activeTab}
            onChange={setActiveTab}
            counts={{
              'All Transactions': allTransactions.length,
              'Payment Received': project.owner_payments.length,
              'Owner Direct Payments': project.owner_direct_payments.length,
              'Subcontractor Payments': project.subcontractor_payments.length,
              'Material Expenses': project.material_expenses.length,
              'Misc Expenses': project.miscellaneous_expenses.length,
              'Commission Payout': project.commission_payouts.length,
            }}
          />
        </div>

        <div className="p-4 sm:p-5">
          {activeTab === 'Payment Received' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payment Received</CardTitle>
                  <CardDescription className="hidden sm:block">Money received from the project owner</CardDescription>
                </div>
                <TabTotal category="Owner Payment" value={received} />
              </div>
              <PaymentForm
                key={editing?.id || 'owner-new-' + formKey}
                initial={editing as OwnerPaymentRow | undefined}
                onSubmit={submitOwner}
                onCancel={editing ? () => setEditing(null) : undefined}
              />
              <DataTable
                columns={[
                  { key: 'date', label: 'Date', render: dateCell },
                  { key: 'amount', label: 'Amount', render: (r) => <AmountCell category="Owner Payment" row={r} /> },
                ]}
                rows={project.owner_payments}
                onEdit={(r) => setEditing(r)}
                onDelete={(r) => setDeleting({ type: 'owner', id: r.id })}
                getRowClassName={rowAccent('Owner Payment')}
                getCardClassName={cardTint}
                renderCard={(row) => (
                  <>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className={categoryBadgeClass('Owner Payment')}>
                        Owner Payment
                      </span>
                      <span className="text-xs text-slate-500">{formatDate(row.date)}</span>
                    </div>
                    <p className={`text-lg font-bold ${CATEGORY_STYLES['Owner Payment'].amountClass}`}>
                      {CATEGORY_STYLES['Owner Payment'].sign} {formatCurrency(row.amount)}
                      {dupIds.has(row.id) && <DuplicateBadge />}
                    </p>
                  </>
                )}
                getCardDate={(row) => row.date}
              />
            </div>
          )}

          {activeTab === 'Owner Direct Payments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Owner Direct Payments</CardTitle>
                  <CardDescription className="hidden sm:block">Payments made directly by the owner to vendors</CardDescription>
                </div>
                <TabTotal category="Owner Direct" value={stats.directCost} />
              </div>
              <ExpenseForm
                key={editing?.id || 'owner-direct-new-' + formKey}
                initial={editing as OwnerDirectPaymentRow | undefined}
                onSubmit={submitOwnerDirect}
                onCancel={editing ? () => setEditing(null) : undefined}
              />
              <DataTable
                columns={[
                  { key: 'date', label: 'Date', render: dateCell },
                  { key: 'description', label: 'Description' },
                  { key: 'amount', label: 'Amount', render: (r) => <AmountCell category="Owner Direct" row={r} /> },
                ]}
                rows={project.owner_direct_payments}
                onEdit={(r) => setEditing(r)}
                onDelete={(r) => setDeleting({ type: 'owner_direct', id: r.id })}
                getRowClassName={rowAccent('Owner Direct')}
                getCardClassName={cardTint}
                renderCard={(row) => (
                  <>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className={categoryBadgeClass('Owner Direct')}>
                        Owner Direct
                      </span>
                      <span className="text-xs text-slate-500">{formatDate(row.date)}</span>
                    </div>
                    {row.description && (
                      <p className="mb-1 truncate text-sm text-slate-600">{row.description}</p>
                    )}
                    <p className={`text-lg font-bold ${CATEGORY_STYLES['Owner Direct'].amountClass}`}>
                      {CATEGORY_STYLES['Owner Direct'].sign} {formatCurrency(row.amount)}
                      {dupIds.has(row.id) && <DuplicateBadge />}
                    </p>
                  </>
                )}
                getCardDate={(row) => row.date}
              />
            </div>
          )}

          {activeTab === 'Subcontractor Payments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Subcontractor Payments</CardTitle>
                  <CardDescription className="hidden sm:block">Payments made to subcontractors and labour</CardDescription>
                </div>
                <TabTotal category="Subcontractor" value={stats.subCost} />
              </div>
              <PaymentForm
                key={editing?.id || 'sub-new-' + formKey}
                initial={editing as SubcontractorPaymentRow | undefined}
                showType
                onSubmit={submitSub}
                onCancel={editing ? () => setEditing(null) : undefined}
              />
              <DataTable
                columns={[
                  { key: 'date', label: 'Date', render: dateCell },
                  {
                    key: 'type',
                    label: 'Type',
                    render: (r) => (
                      <span className={categoryBadgeClass('Subcontractor')}>
                        {r.type}
                      </span>
                    ),
                  },
                  { key: 'description', label: 'Description' },
                  { key: 'amount', label: 'Amount', render: (r) => <AmountCell category="Subcontractor" row={r} /> },
                ]}
                rows={project.subcontractor_payments}
                onEdit={(r) => setEditing(r)}
                onDelete={(r) => setDeleting({ type: 'sub', id: r.id })}
                getRowClassName={rowAccent('Subcontractor')}
                getCardClassName={cardTint}
                renderCard={(row) => (
                  <>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className={categoryBadgeClass('Subcontractor')}>
                        {row.type}
                      </span>
                      <span className="text-xs text-slate-500">{formatDate(row.date)}</span>
                    </div>
                    {row.description && (
                      <p className="mb-1 truncate text-sm text-slate-600">{row.description}</p>
                    )}
                    <p className={`text-lg font-bold ${CATEGORY_STYLES.Subcontractor.amountClass}`}>
                      {CATEGORY_STYLES.Subcontractor.sign} {formatCurrency(row.amount)}
                      {dupIds.has(row.id) && <DuplicateBadge />}
                    </p>
                  </>
                )}
                getCardDate={(row) => row.date}
              />
            </div>
          )}

          {activeTab === 'Material Expenses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Material Expenses</CardTitle>
                  <CardDescription className="hidden sm:block">Direct material and operational costs</CardDescription>
                </div>
                <TabTotal category="Material" value={stats.matCost} />
              </div>
              <ExpenseForm
                key={editing?.id || 'exp-new-' + formKey}
                initial={editing as MaterialExpenseRow | undefined}
                showPaidToggle
                onSubmit={submitExpense}
                onCancel={editing ? () => setEditing(null) : undefined}
              />
              <DataTable
                columns={[
                  { key: 'date', label: 'Date', render: dateCell },
                  { key: 'description', label: 'Description' },
                  {
                    key: 'amount',
                    label: 'Amount',
                    render: (r) => (
                      <>
                        <AmountCell category="Material" row={r} />
                        {r.paid === false && <CreditBadge />}
                      </>
                    ),
                  },
                  {
                    key: 'id',
                    label: '',
                    render: (r) =>
                      r.paid === false ? (
                        <button
                          onClick={() => handleMarkPaid('expense', r)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-50/80 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200/60 transition-colors hover:bg-emerald-100/80"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Mark paid
                        </button>
                      ) : null,
                  },
                ]}
                rows={project.material_expenses}
                onEdit={(r) => setEditing(r)}
                onDelete={(r) => setDeleting({ type: 'expense', id: r.id })}
                getRowClassName={rowAccent('Material')}
                getCardClassName={cardTint}
                renderCard={(row) => (
                  <>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className={categoryBadgeClass('Material')}>
                        Material
                      </span>
                      <span className="text-xs text-slate-500">{formatDate(row.date)}</span>
                    </div>
                    {row.description && (
                      <p className="mb-1 truncate text-sm text-slate-600">{row.description}</p>
                    )}
                    <p className={`text-lg font-bold ${CATEGORY_STYLES.Material.amountClass}`}>
                      {CATEGORY_STYLES.Material.sign} {formatCurrency(row.amount)}
                      {dupIds.has(row.id) && <DuplicateBadge />}
                      {row.paid === false && <CreditBadge />}
                    </p>
                    {row.paid === false && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMarkPaid('expense', row); }}
                        className="mt-2 inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200/60 transition-colors hover:bg-emerald-100/80"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Mark paid
                      </button>
                    )}
                  </>
                )}
                getCardDate={(row) => row.date}
              />
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
                  {
                    key: 'category',
                    label: 'Category',
                    render: (r) => (
                      <span className={categoryBadgeClass(r.category as CategoryKey)}>
                        {r.category}
                      </span>
                    ),
                  },
                  { key: 'description', label: 'Description' },
                  {
                    key: 'amount',
                    label: 'Amount',
                    render: (r) => (
                      <>
                        <AmountCell category={r.category as CategoryKey} row={r} />
                        {'paid' in r && r.paid === false && <CreditBadge />}
                      </>
                    ),
                  },
                ]}
                rows={allTransactions}
                onEdit={editFromAll}
                onDelete={deleteFromAll}
                getRowClassName={(r) => rowAccent(r.category as CategoryKey)(r)}
                getCardClassName={cardTint}
                renderCard={(row) => {
                  const style = CATEGORY_STYLES[row.category as CategoryKey];
                  return (
                    <>
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className={categoryBadgeClass(row.category as CategoryKey)}>
                          {row.category}
                        </span>
                        <span className="text-xs text-slate-500">{formatDate(row.date)}</span>
                      </div>
                      {row.description && (
                        <p className="mb-1 truncate text-sm text-slate-600">{row.description}</p>
                      )}
                      <p className={`text-lg font-bold ${style.amountClass}`}>
                        {formatCurrency(row.amount)}
                        {dupIds.has(row.id) && <DuplicateBadge />}
                        {'paid' in row && row.paid === false && <CreditBadge />}
                      </p>
                    </>
                  );
                }}
                getCardDate={(row) => row.date}
              />
            </div>
          )}

          {activeTab === 'Misc Expenses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Misc Expenses</CardTitle>
                  <CardDescription className="hidden sm:block">Other project-related costs and expenses</CardDescription>
                </div>
                <TabTotal category="Misc" value={stats.miscCost} />
              </div>
              <ExpenseForm
                key={editing?.id || 'misc-new-' + formKey}
                initial={editing as MiscellaneousExpenseRow | undefined}
                showPaidToggle
                onSubmit={submitMisc}
                onCancel={editing ? () => setEditing(null) : undefined}
              />
              <DataTable
                columns={[
                  { key: 'date', label: 'Date', render: dateCell },
                  { key: 'description', label: 'Description' },
                  {
                    key: 'amount',
                    label: 'Amount',
                    render: (r) => (
                      <>
                        <AmountCell category="Misc" row={r} />
                        {r.paid === false && <CreditBadge />}
                      </>
                    ),
                  },
                  {
                    key: 'id',
                    label: '',
                    render: (r) =>
                      r.paid === false ? (
                        <button
                          onClick={() => handleMarkPaid('misc', r)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-50/80 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200/60 transition-colors hover:bg-emerald-100/80"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Mark paid
                        </button>
                      ) : null,
                  },
                ]}
                rows={project.miscellaneous_expenses}
                onEdit={(r) => setEditing(r)}
                onDelete={(r) => setDeleting({ type: 'misc', id: r.id })}
                getRowClassName={rowAccent('Misc')}
                getCardClassName={cardTint}
                renderCard={(row) => (
                  <>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className={categoryBadgeClass('Misc')}>
                        Misc
                      </span>
                      <span className="text-xs text-slate-500">{formatDate(row.date)}</span>
                    </div>
                    {row.description && (
                      <p className="mb-1 truncate text-sm text-slate-600">{row.description}</p>
                    )}
                    <p className={`text-lg font-bold ${CATEGORY_STYLES.Misc.amountClass}`}>
                      {CATEGORY_STYLES.Misc.sign} {formatCurrency(row.amount)}
                      {dupIds.has(row.id) && <DuplicateBadge />}
                      {row.paid === false && <CreditBadge />}
                    </p>
                    {row.paid === false && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMarkPaid('misc', row); }}
                        className="mt-2 inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200/60 transition-colors hover:bg-emerald-100/80"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Mark paid
                      </button>
                    )}
                  </>
                )}
                getCardDate={(row) => row.date}
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
                <TabTotal category="Commission Payout" value={commissionPaid} />
              </div>
              <ExpenseForm
                key={editing?.id || 'commission-new-' + formKey}
                initial={editing as CommissionPayoutRow | undefined}
                hideDescription
                onSubmit={submitCommissionPayout}
                onCancel={editing ? () => setEditing(null) : undefined}
              />
              <DataTable
                columns={[
                  { key: 'date', label: 'Date', render: dateCell },
                  { key: 'amount', label: 'Amount', render: (r) => <AmountCell category="Commission Payout" row={r} /> },
                ]}
                rows={project.commission_payouts}
                onEdit={(r) => setEditing(r)}
                onDelete={(r) => setDeleting({ type: 'commission_payout', id: r.id })}
                getRowClassName={rowAccent('Commission Payout')}
                getCardClassName={cardTint}
                renderCard={(row) => (
                  <>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className={categoryBadgeClass('Commission Payout')}>
                        Commission
                      </span>
                      <span className="text-xs text-slate-500">{formatDate(row.date)}</span>
                    </div>
                    <p className={`text-lg font-bold ${CATEGORY_STYLES['Commission Payout'].amountClass}`}>
                      {CATEGORY_STYLES['Commission Payout'].sign} {formatCurrency(row.amount)}
                      {dupIds.has(row.id) && <DuplicateBadge />}
                    </p>
                  </>
                )}
                getCardDate={(row) => row.date}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Delete confirmations — rendered outside backdrop-filter elements to avoid Chrome fixed-positioning bug */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      {pendingDuplicate && (
        <DuplicateConfirm
          title={pendingDuplicate.message}
          onConfirm={() => {
            const proceed = pendingDuplicate.proceed;
            setPendingDuplicate(null);
            proceed();
          }}
          onCancel={() => setPendingDuplicate(null)}
        />
      )}
      {deleting?.type === 'project' && (
        <DeleteConfirm
          title="Are you sure you want to delete this project and all its records?"
          requireTyping={project.name}
          onConfirm={handleDeleteProject}
          onCancel={() => setDeleting(null)}
        />
      )}
      {deleting?.type === 'owner' && (
        <DeleteConfirm
          title="Delete this owner payment?"
          onConfirm={() => deleteRow(`/api/projects/${project.id}/owner-payments/${deleting.id}`)}
          onCancel={() => setDeleting(null)}
        />
      )}
      {deleting?.type === 'owner_direct' && (
        <DeleteConfirm
          title="Delete this owner direct payment?"
          onConfirm={() => deleteRow(`/api/projects/${project.id}/owner-direct-payments/${deleting.id}`)}
          onCancel={() => setDeleting(null)}
        />
      )}
      {deleting?.type === 'sub' && (
        <DeleteConfirm
          title="Delete this subcontractor payment?"
          onConfirm={() => deleteRow(`/api/projects/${project.id}/subcontractor-payments/${deleting.id}`)}
          onCancel={() => setDeleting(null)}
        />
      )}
      {deleting?.type === 'expense' && (
        <DeleteConfirm
          title="Delete this material expense?"
          onConfirm={() => deleteRow(`/api/projects/${project.id}/material-expenses/${deleting.id}`)}
          onCancel={() => setDeleting(null)}
        />
      )}
      {deleting?.type === 'misc' && (
        <DeleteConfirm
          title="Delete this miscellaneous expense?"
          onConfirm={() => deleteRow(`/api/projects/${project.id}/misc-expenses/${deleting.id}`)}
          onCancel={() => setDeleting(null)}
        />
      )}
      {deleting?.type === 'commission_payout' && (
        <DeleteConfirm
          title="Delete this commission payout?"
          onConfirm={() => deleteRow(`/api/projects/${project.id}/commission-payouts/${deleting.id}`)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
