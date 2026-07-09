import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params { params: { id: string; eid: string } }

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json();
    const expense = await prisma.materialExpense.update({
      where: { id: params.eid },
      data: {
        amount: body.amount,
        date: new Date(body.date),
        description: body.description || null,
      },
    });
    return NextResponse.json(expense);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await prisma.materialExpense.delete({ where: { id: params.eid } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
