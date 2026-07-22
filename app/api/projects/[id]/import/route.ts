import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params { params: { id: string } }

const VALID_TYPES = ['Owner Payment', 'Owner Direct', 'Subcontractor', 'Material', 'Misc', 'Commission Payout'] as const;
const VALID_TYPES_SET = new Set<string>(VALID_TYPES);
const VALID_SUB_TYPES = ['Labour', 'Labour+Material'];
const VALID_SUB_TYPES_SET = new Set<string>(VALID_SUB_TYPES);

export async function POST(req: NextRequest, { params }: Params) {
  try {
    // Verify project exists
    const project = await prisma.project.findUnique({ where: { id: params.id } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.replace(/\r\n/g, '\n').split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV must have a header row and at least one data row' }, { status: 400 });
    }

    // Parse header
    const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const dateIdx = header.indexOf('date');
    const amountIdx = header.indexOf('amount');
    const typeIdx = header.indexOf('transaction_type');
    const descIdx = header.indexOf('description');
    const subTypeIdx = header.indexOf('sub_type');

    if (dateIdx === -1 || amountIdx === -1 || typeIdx === -1) {
      return NextResponse.json({
        error: 'CSV must have at least "date", "amount", and "transaction_type" columns',
      }, { status: 400 });
    }

    const results: { row: number; status: string; error?: string }[] = [];
    let created = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim());
      const date = cols[dateIdx] || '';
      const amount = parseFloat(cols[amountIdx] || '0');
      const type = cols[typeIdx] || '';
      const description = descIdx !== -1 ? cols[descIdx] || null : null;
      const subType = subTypeIdx !== -1 ? cols[subTypeIdx] || null : null;

      // Validate
      if (!date) { results.push({ row: i + 1, status: 'skipped', error: 'Missing date' }); continue; }
      if (!amount || isNaN(amount) || amount <= 0) { results.push({ row: i + 1, status: 'skipped', error: 'Invalid amount' }); continue; }
      if (!VALID_TYPES_SET.has(type)) { results.push({ row: i + 1, status: 'skipped', error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` }); continue; }

      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) { results.push({ row: i + 1, status: 'skipped', error: 'Invalid date format (use YYYY-MM-DD)' }); continue; }

      try {
        switch (type) {
          case 'Owner Payment':
            await prisma.ownerPayment.create({
              data: { project_id: params.id, amount, date: parsedDate },
            });
            break;
          case 'Owner Direct':
            await prisma.ownerDirectPayment.create({
              data: { project_id: params.id, amount, date: parsedDate, description },
            });
            break;
          case 'Subcontractor':
            if (!subType || !VALID_SUB_TYPES_SET.has(subType)) {
              results.push({ row: i + 1, status: 'skipped', error: `Subcontractor requires sub_type: Labour or Labour+Material` });
              continue;
            }
            await prisma.subcontractorPayment.create({
              data: { project_id: params.id, amount, date: parsedDate, type: subType, description },
            });
            break;
          case 'Material':
            await prisma.materialExpense.create({
              data: { project_id: params.id, amount, date: parsedDate, description },
            });
            break;
          case 'Misc':
            await prisma.miscellaneousExpense.create({
              data: { project_id: params.id, amount, date: parsedDate, description },
            });
            break;
          case 'Commission Payout':
            await prisma.commissionPayout.create({
              data: { project_id: params.id, amount, date: parsedDate, description },
            });
            break;
        }
        created++;
        results.push({ row: i + 1, status: 'created' });
      } catch (err) {
        results.push({ row: i + 1, status: 'error', error: (err as Error).message });
      }
    }

    return NextResponse.json({ created, total: lines.length - 1, results });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
