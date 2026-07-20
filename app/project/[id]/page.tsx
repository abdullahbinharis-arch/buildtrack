import { notFound } from 'next/navigation';
import ProjectDetailClient, { type ProjectWithRecords } from './ProjectDetailClient';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

async function getProject(id: string): Promise<ProjectWithRecords | null> {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      owner_payments: { orderBy: { date: 'desc' } },
      owner_direct_payments: { orderBy: { date: 'desc' } },
      subcontractor_payments: { orderBy: { date: 'desc' } },
      material_expenses: { orderBy: { date: 'desc' } },
      commission_payouts: { orderBy: { date: 'desc' } },
    },
  });

  if (!project) return null;

  return {
    ...project,
    owner_payments: project.owner_payments.map((p) => ({
      ...p,
      date: p.date.toISOString(),
    })),
    owner_direct_payments: project.owner_direct_payments.map((p) => ({
      ...p,
      date: p.date.toISOString(),
    })),
    subcontractor_payments: project.subcontractor_payments.map((p) => ({
      ...p,
      date: p.date.toISOString(),
      type: p.type as 'Labour' | 'Labour+Material',
    })),
    material_expenses: project.material_expenses.map((e) => ({
      ...e,
      date: e.date.toISOString(),
    })),
    commission_payouts: project.commission_payouts.map((p) => ({
      ...p,
      date: p.date.toISOString(),
    })),
  };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const project = await getProject(params.id);

  if (!project) {
    notFound();
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/30 to-rose-50/30">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-20 top-0 h-96 w-96 rounded-full bg-violet-300/25 blur-[120px]" />
        <div className="absolute right-0 top-24 h-[28rem] w-[28rem] rounded-full bg-rose-300/20 blur-[130px]" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-emerald-300/20 blur-[120px]" />
      </div>

      <main className="page-container animate-fade-in">
        <ProjectDetailClient initialProject={project} />
      </main>
    </div>
  );
}
