import DashboardClient from './DashboardClient';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function getProjects() {
  const projects = await prisma.project.findMany({
    include: {
      owner_payments: true,
      owner_direct_payments: true,
      subcontractor_payments: true,
      material_expenses: true,
      miscellaneous_expenses: true,
      commission_payouts: true,
    },
    orderBy: { created_at: 'desc' },
  });

  return projects.map((p) => {
    const received = p.owner_payments.reduce((s, x) => s + x.amount, 0);
    const directCost = p.owner_direct_payments.reduce((s, x) => s + x.amount, 0);
    const subCost = p.subcontractor_payments.reduce((s, x) => s + x.amount, 0);
    const matCost = p.material_expenses.reduce((s, x) => s + x.amount, 0);
    const miscCost = p.miscellaneous_expenses.reduce((s, x) => s + x.amount, 0);
    const totalCost = subCost + matCost + miscCost + directCost;
    const commissionReceivable = (totalCost * p.commission_rate) / 100;
    const commissionPaid = p.commission_payouts.reduce((s, x) => s + x.amount, 0);
    return {
      id: p.id,
      name: p.name,
      estimated_value: p.estimated_value,
      commission_rate: p.commission_rate,
      created_at: p.created_at.toISOString(),
      total_received: received,
      total_expenses: totalCost,
      profit_loss: received - (subCost + matCost + miscCost),
      commission_payable: commissionReceivable - commissionPaid,
    };
  });
}

export default async function DashboardPage() {
  const projects = await getProjects();

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/30 to-rose-50/30">
      {/* Background blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-20 top-0 h-96 w-96 rounded-full bg-violet-300/25 blur-[120px]" />
        <div className="absolute right-0 top-24 h-[28rem] w-[28rem] rounded-full bg-rose-300/20 blur-[130px]" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-emerald-300/20 blur-[120px]" />
      </div>

      <main className="page-container animate-fade-in">
        <DashboardClient initialProjects={projects} />
      </main>
    </div>
  );
}
