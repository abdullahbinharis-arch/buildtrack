import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params { params: { id: string; pid: string } }

const VALID_TYPES = ['Labour', 'Labour+Material'];

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json();
    if (!VALID_TYPES.includes(body.type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
    const payment = await prisma.subcontractorPayment.update({
      where: { id: params.pid },
      data: {
        amount: body.amount,
        type: body.type,
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
    await prisma.subcontractorPayment.delete({ where: { id: params.pid } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
