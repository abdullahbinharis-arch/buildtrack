import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

const DATA_FILE = path.join(__dirname, '..', 'data', 'projects.json');

async function main() {
  if (!fs.existsSync(DATA_FILE)) {
    console.log('No legacy data file found at data/projects.json');
    return;
  }

  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  const projects = JSON.parse(raw || '[]');

  for (const legacy of projects) {
    const estimated = Number(legacy.estimated_value ?? legacy.contract_value ?? 0);
    const project = await prisma.project.create({
      data: {
        name: legacy.name || 'Untitled Project',
        estimated_value: estimated,
        created_at: legacy.created_at ? new Date(legacy.created_at) : new Date(),
      },
    });

    const ownerPayments = (legacy.owner_payments || []).map((p: any) => ({
      project_id: project.id,
      amount: Number(p.amount || 0),
      date: p.date ? new Date(p.date) : new Date(),
    }));

    const subPayments = (legacy.subcontractor_payments || []).map((p: any) => ({
      project_id: project.id,
      amount: Number(p.amount || 0),
      type: ['Labour', 'Labour+Material'].includes(p.type) ? p.type : 'Labour',
      date: p.date ? new Date(p.date) : new Date(),
      description: [p.subcontractor_name, p.notes, p.description]
        .filter(Boolean)
        .join(' — ') || null,
    }));

    const expenses = (legacy.site_expenses || []).map((e: any) => ({
      project_id: project.id,
      amount: Number(e.amount || 0),
      date: e.date ? new Date(e.date) : new Date(),
      description: [e.description, e.category, e.vendor]
        .filter(Boolean)
        .join(' — ') || null,
    }));

    if (ownerPayments.length) {
      await prisma.ownerPayment.createMany({ data: ownerPayments });
    }
    if (subPayments.length) {
      await prisma.subcontractorPayment.createMany({ data: subPayments });
    }
    if (expenses.length) {
      await prisma.materialExpense.createMany({ data: expenses });
    }

    console.log(`Migrated project: ${project.name}`);
  }

  console.log('Migration complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
