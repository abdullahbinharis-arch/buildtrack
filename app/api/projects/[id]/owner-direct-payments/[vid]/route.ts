import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params { params: { id: string; vid: string } }

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json();
    const payment = await prisma.ownerDirectPayment.update({
      where: { id: params.vid },
      data: {
        amount: body.amount,
        date: new Date(body.date),
        description: body.description || null,
      },
    });
    return NextResponse.json(payment);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await prisma.ownerDirectPayment.delete({ where: { id: params.vid } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
