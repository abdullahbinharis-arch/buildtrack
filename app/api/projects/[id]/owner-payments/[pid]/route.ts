import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params { params: { id: string; pid: string } }

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json();
    const payment = await prisma.ownerPayment.update({
      where: { id: params.pid },
      data: {
        amount: body.amount,
        date: new Date(body.date),
      },
    });
    return NextResponse.json(payment);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await prisma.ownerPayment.delete({ where: { id: params.pid } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
