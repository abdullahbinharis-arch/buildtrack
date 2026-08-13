import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toProjectSummary } from '@/lib/project-stats';

export async function GET() {
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

  return NextResponse.json(projects.map(toProjectSummary));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || typeof body.estimated_value !== 'number') {
      return NextResponse.json({ error: 'Invalid project data' }, { status: 400 });
    }
    const commission_rate = typeof body.commission_rate === 'number' ? body.commission_rate : 10;
    const project = await prisma.project.create({
      data: {
        name: body.name,
        estimated_value: body.estimated_value,
        commission_rate,
      },
    });
    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
