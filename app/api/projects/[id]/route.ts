import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      owner_payments: { orderBy: { date: 'desc' } },
      subcontractor_payments: { orderBy: { date: 'desc' } },
      material_expenses: { orderBy: { date: 'desc' } },
    },
  });
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  return NextResponse.json(project);
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json();
    const project = await prisma.project.update({
      where: { id: params.id },
      data: {
        name: body.name,
        estimated_value: body.estimated_value,
      },
    });
    return NextResponse.json(project);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await prisma.project.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
