import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const projects = await prisma.project.findMany({
    include: {
      owner_payments: true,
      subcontractor_payments: true,
      material_expenses: true,
    },
    orderBy: { created_at: 'desc' },
  });

  const summary = projects.map((p) => {
    const received = p.owner_payments.reduce((s, x) => s + x.amount, 0);
    const subCost = p.subcontractor_payments.reduce((s, x) => s + x.amount, 0);
    const matCost = p.material_expenses.reduce((s, x) => s + x.amount, 0);
    const totalCost = subCost + matCost;
    return {
      id: p.id,
      name: p.name,
      estimated_value: p.estimated_value,
      created_at: p.created_at,
      total_received: received,
      total_expenses: totalCost,
      profit_loss: received - totalCost,
    };
  });

  return NextResponse.json(summary);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || typeof body.estimated_value !== 'number') {
      return NextResponse.json({ error: 'Invalid project data' }, { status: 400 });
    }
    const project = await prisma.project.create({
      data: {
        name: body.name,
        estimated_value: body.estimated_value,
      },
    });
    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
