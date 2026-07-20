import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params { params: { id: string; cid: string } }

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json();
    const payout = await prisma.commissionPayout.update({
      where: { id: params.cid },
      data: {
        amount: body.amount,
        date: new Date(body.date),
        description: body.description || null,
      },
    });
    return NextResponse.json(payout);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await prisma.commissionPayout.delete({ where: { id: params.cid } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
