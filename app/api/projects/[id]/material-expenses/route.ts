import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const expenses = await prisma.materialExpense.findMany({
    where: { project_id: params.id },
    orderBy: { date: 'desc' },
  });
  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json();
    if (typeof body.amount !== 'number' || !body.date) {
      return NextResponse.json({ error: 'Invalid expense data' }, { status: 400 });
    }
    const expense = await prisma.materialExpense.create({
      data: {
        project_id: params.id,
        amount: body.amount,
        date: new Date(body.date),
        description: body.description || null,
      },
    });
    return NextResponse.json(expense, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
