import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params { params: { id: string } }

const VALID_TYPES = ['Labour', 'Labour+Material'];

export async function GET(_req: NextRequest, { params }: Params) {
  const payments = await prisma.subcontractorPayment.findMany({
    where: { project_id: params.id },
    orderBy: { date: 'desc' },
  });
  return NextResponse.json(payments);
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json();
    if (typeof body.amount !== 'number' || !body.date || !VALID_TYPES.includes(body.type)) {
      return NextResponse.json({ error: 'Invalid payment data' }, { status: 400 });
    }
    const payment = await prisma.subcontractorPayment.create({
      data: {
        project_id: params.id,
        amount: body.amount,
        type: body.type,
        date: new Date(body.date),
        description: body.description || null,
      },
    });
    return NextResponse.json(payment, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
