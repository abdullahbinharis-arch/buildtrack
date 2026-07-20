import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    const ownerPayments = await prisma.ownerPayment.findMany({
      include: { project: true },
      orderBy: { date: 'desc' },
    });
    const subcontractorPayments = await prisma.subcontractorPayment.findMany({
      include: { project: true },
      orderBy: { date: 'desc' },
    });
    const materialExpenses = await prisma.materialExpense.findMany({
      include: { project: true },
      orderBy: { date: 'desc' },
    });
    const ownerDirectPayments = await prisma.ownerDirectPayment.findMany({
      include: { project: true },
      orderBy: { date: 'desc' },
    });
    const commissionPayouts = await prisma.commissionPayout.findMany({
      include: { project: true },
      orderBy: { date: 'desc' },
    });

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    const haris = [
      ['id', 'project_id', 'project_name', 'date', 'amount'],
      ...ownerPayments.map((p) => [
        p.id,
        p.project_id,
        p.project.name,
        formatDate(p.date),
        p.amount,
      ]),
    ];

    const joseph = [
      ['id', 'project_id', 'project_name', 'date', 'amount', 'type', 'description'],
      ...subcontractorPayments.map((p) => [
        p.id,
        p.project_id,
        p.project.name,
        formatDate(p.date),
        p.amount,
        p.type,
        p.description || '',
      ]),
    ];

    const expense = [
      ['id', 'project_id', 'project_name', 'date', 'amount', 'description'],
      ...materialExpenses.map((e) => [
        e.id,
        e.project_id,
        e.project.name,
        formatDate(e.date),
        e.amount,
        e.description || '',
      ]),
    ];

    const ownerDirect = [
      ['id', 'project_id', 'project_name', 'date', 'amount', 'description'],
      ...ownerDirectPayments.map((p) => [
        p.id,
        p.project_id,
        p.project.name,
        formatDate(p.date),
        p.amount,
        p.description || '',
      ]),
    ];

    const commission = [
      ['id', 'project_id', 'project_name', 'date', 'amount', 'description'],
      ...commissionPayouts.map((p) => [
        p.id,
        p.project_id,
        p.project.name,
        formatDate(p.date),
        p.amount,
        p.description || '',
      ]),
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(haris), 'Haris');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(joseph), 'Joseph');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(expense), 'Expense');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ownerDirect), 'Owner Direct');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(commission), 'Commission Payout');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="BuildTrack_Backup_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
