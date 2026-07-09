# Construction Expense Tracker — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the existing Express + JSON construction expense tracker as a standalone Next.js 14 + TypeScript + Prisma + SQLite + TailwindCSS app with full CRUD, Excel export, and a polished UI.

**Architecture:** Next.js App Router with API routes for all data operations. Prisma ORM talks to a local SQLite file. Client components fetch via `fetch` and render with TailwindCSS. The Excel export API route uses `xlsx` to generate a workbook with exactly three sheets.

**Tech Stack:** Next.js 14, React 18, TypeScript, Prisma 5, SQLite, TailwindCSS 3, `xlsx` 0.18.5.

## Global Constraints

- Use Next.js App Router (`app/` directory).
- All data access goes through Prisma Client; no raw SQL.
- Use SQLite as the database (`file:./dev.db`).
- Use `xlsx` for Excel export; workbook must have sheets named exactly `Haris`, `Joseph`, and `Expense`.
- All API routes return JSON with `{ error: string }` on failure.
- Currency displayed as `₹` but stored as plain numbers.
- No external state library; use React hooks + `fetch`.
- Preserve legacy data by migrating from `data/projects.json`.

---

## File Structure

```
expense-tracker/
├── .legacy-backup/                 # existing Express app files (Task 1)
│   ├── data/
│   ├── public/
│   ├── server.js
│   ├── package.json
│   ├── README.md
│   └── PROJECT_SPEC.md
├── app/
│   ├── api/
│   │   ├── export/
│   │   │   └── route.ts
│   │   └── projects/
│   │       ├── route.ts
│   │       └── [id]/
│   │           ├── route.ts
│   │           ├── owner-payments/
│   │           │   ├── route.ts
│   │           │   └── [pid]/
│   │           │       └── route.ts
│   │           ├── subcontractor-payments/
│   │           │   ├── route.ts
│   │           │   └── [pid]/
│   │           │       └── route.ts
│   │           └── material-expenses/
│   │               ├── route.ts
│   │               └── [eid]/
│   │                   └── route.ts
│   ├── project/
│   │   └── [id]/
│   │       └── page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   └── Card.tsx
│   ├── StatCard.tsx
│   ├── ProjectCard.tsx
│   ├── DataTable.tsx
│   ├── PaymentForm.tsx
│   ├── ExpenseForm.tsx
│   ├── TabNav.tsx
│   ├── DeleteConfirm.tsx
│   └── ProjectForm.tsx
├── lib/
│   ├── prisma.ts
│   └── utils.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       └── ...
├── scripts/
│   └── migrate-legacy.ts
├── public/
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── next.config.js
└── .env
```

---

### Task 1: Back Up Existing Express App

**Files:**
- Create: `.legacy-backup/` directory and move existing app files into it.

**Interfaces:**
- Produces: a clean `expense-tracker/` root ready for Next.js initialization; `data/projects.json` remains available for migration.

- [ ] **Step 1: Move existing files to backup directory and remove node_modules**

Run:
```bash
cd /Users/abdullaharris/expense-tracker
mkdir -p .legacy-backup
mv data public server.js import-legacy.js package.json package-lock.json README.md PROJECT_SPEC.md HARIS_*.xlsx .legacy-backup/ 2>/dev/null || true
rm -rf node_modules
ls -la
```

Expected: Root directory is nearly empty except `.legacy-backup/`, `.DS_Store`, and `docs/`.

- [ ] **Step 2: Copy legacy data back for migration**

Run:
```bash
cp -r .legacy-backup/data ./data
ls data/
```

Expected: `data/projects.json` exists.

---

### Task 2: Initialize Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `postcss.config.js`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `public/`

**Interfaces:**
- Produces: runnable Next.js 14 TypeScript app with TailwindCSS.

- [ ] **Step 1: Initialize Next.js with TypeScript and Tailwind**

Run:
```bash
cd /Users/abdullaharris/expense-tracker
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm --no-turbopack
```

When prompted, confirm overwrite if any stale files exist.

- [ ] **Step 2: Verify the dev server starts**

Run:
```bash
npm run dev
```

Expected: Server starts on `http://localhost:3000` and shows the default Next.js landing page.

Stop the server with `Ctrl+C` after verifying.

---

### Task 3: Install Dependencies

**Files:**
- Modify: `package.json`

**Interfaces:**
- Produces: Prisma, xlsx, and ts-node available.

- [ ] **Step 1: Install runtime and dev dependencies**

Run:
```bash
cd /Users/abdullaharris/expense-tracker
npm install prisma @prisma/client xlsx
npm install -D ts-node
```

Expected: `package.json` lists `prisma`, `@prisma/client`, `xlsx`, and `ts-node` under dependencies/devDependencies.

- [ ] **Step 2: Add helper scripts to package.json**

Modify `package.json`:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:seed": "ts-node scripts/migrate-legacy.ts",
    "postinstall": "prisma generate"
  }
}
```

---

### Task 4: Configure Prisma Schema

**Files:**
- Create: `prisma/schema.prisma`
- Create: `.env`

**Interfaces:**
- Produces: Prisma schema matching the spec.

- [ ] **Step 1: Write Prisma schema**

Create `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Project {
  id              String   @id @default(uuid())
  name            String
  estimated_value Float
  created_at      DateTime @default(now())

  owner_payments         OwnerPayment[]
  subcontractor_payments SubcontractorPayment[]
  material_expenses      MaterialExpense[]
}

model OwnerPayment {
  id         String   @id @default(uuid())
  project_id String
  amount     Float
  date       DateTime
  project    Project  @relation(fields: [project_id], references: [id], onDelete: Cascade)
}

model SubcontractorPayment {
  id          String   @id @default(uuid())
  project_id  String
  amount      Float
  type        String
  date        DateTime
  description String?
  project     Project  @relation(fields: [project_id], references: [id], onDelete: Cascade)
}

model MaterialExpense {
  id          String   @id @default(uuid())
  project_id  String
  amount      Float
  date        DateTime
  description String?
  project     Project  @relation(fields: [project_id], references: [id], onDelete: Cascade)
}
```

- [ ] **Step 2: Set environment variable**

Create `.env`:
```env
DATABASE_URL="file:./prisma/dev.db"
```

- [ ] **Step 3: Generate Prisma client and run initial migration**

Run:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

Expected: `prisma/dev.db` is created and migrations directory appears.

---

### Task 5: Create Prisma Client Singleton

**Files:**
- Create: `lib/prisma.ts`

**Interfaces:**
- Produces: `prisma` singleton used by all API routes.

- [ ] **Step 1: Write the singleton**

Create `lib/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

---

### Task 6: Build Project API Routes

**Files:**
- Create: `app/api/projects/route.ts`
- Create: `app/api/projects/[id]/route.ts`

**Interfaces:**
- Consumes: `prisma` from `lib/prisma.ts`
- Produces: `GET /api/projects`, `POST /api/projects`, `GET/PUT/DELETE /api/projects/[id]`

- [ ] **Step 1: Implement list and create**

Create `app/api/projects/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const projects = await prisma.project.findMany({
    include: {
      owner_payments: true,
      subcontractor_payments: true,
      material_expenses: true,
    },
    orderBy: { created_at: 'desc' },
  });

  const summary = projects.map((p) => {
    const received = p.owner_payments.reduce((s, x) => s + x.amount, 0);
    const subCost = p.subcontractor_payments.reduce((s, x) => s + x.amount, 0);
    const matCost = p.material_expenses.reduce((s, x) => s + x.amount, 0);
    const totalCost = subCost + matCost;
    return {
      id: p.id,
      name: p.name,
      estimated_value: p.estimated_value,
      created_at: p.created_at,
      total_received: received,
      total_expenses: totalCost,
      profit_loss: received - totalCost,
    };
  });

  return NextResponse.json(summary);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || typeof body.estimated_value !== 'number') {
      return NextResponse.json({ error: 'Invalid project data' }, { status: 400 });
    }
    const project = await prisma.project.create({
      data: {
        name: body.name,
        estimated_value: body.estimated_value,
      },
    });
    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Implement single project read/update/delete**

Create `app/api/projects/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      owner_payments: { orderBy: { date: 'desc' } },
      subcontractor_payments: { orderBy: { date: 'desc' } },
      material_expenses: { orderBy: { date: 'desc' } },
    },
  });
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  return NextResponse.json(project);
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json();
    const project = await prisma.project.update({
      where: { id: params.id },
      data: {
        name: body.name,
        estimated_value: body.estimated_value,
      },
    });
    return NextResponse.json(project);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await prisma.project.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
```

- [ ] **Step 3: Test project API**

Run dev server:
```bash
npm run dev
```

In another terminal:
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Site","estimated_value":100000}'
curl http://localhost:3000/api/projects
```

Expected: POST returns the created project; GET returns a list containing it.

---

### Task 7: Build Owner Payment API Routes

**Files:**
- Create: `app/api/projects/[id]/owner-payments/route.ts`
- Create: `app/api/projects/[id]/owner-payments/[pid]/route.ts`

**Interfaces:**
- Consumes: `prisma`
- Produces: CRUD endpoints for owner payments.

- [ ] **Step 1: Implement list and create**

Create `app/api/projects/[id]/owner-payments/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const payments = await prisma.ownerPayment.findMany({
    where: { project_id: params.id },
    orderBy: { date: 'desc' },
  });
  return NextResponse.json(payments);
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json();
    if (typeof body.amount !== 'number' || !body.date) {
      return NextResponse.json({ error: 'Invalid payment data' }, { status: 400 });
    }
    const payment = await prisma.ownerPayment.create({
      data: {
        project_id: params.id,
        amount: body.amount,
        date: new Date(body.date),
      },
    });
    return NextResponse.json(payment, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Implement update and delete**

Create `app/api/projects/[id]/owner-payments/[pid]/route.ts`:
```typescript
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
```

- [ ] **Step 3: Test owner payments**

With dev server running:
```bash
PROJECT_ID=$(curl -s http://localhost:3000/api/projects | jq -r '.[0].id')
curl -X POST "http://localhost:3000/api/projects/$PROJECT_ID/owner-payments" \
  -H "Content-Type: application/json" \
  -d '{"amount":50000,"date":"2026-07-01"}'
curl "http://localhost:3000/api/projects/$PROJECT_ID/owner-payments"
```

Expected: POST creates payment; GET lists it.

---

### Task 8: Build Subcontractor Payment API Routes

**Files:**
- Create: `app/api/projects/[id]/subcontractor-payments/route.ts`
- Create: `app/api/projects/[id]/subcontractor-payments/[pid]/route.ts`

**Interfaces:**
- Consumes: `prisma`
- Produces: CRUD endpoints for subcontractor payments with `type` validation.

- [ ] **Step 1: Implement list and create**

Create `app/api/projects/[id]/subcontractor-payments/route.ts`:
```typescript
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
```

- [ ] **Step 2: Implement update and delete**

Create `app/api/projects/[id]/subcontractor-payments/[pid]/route.ts`:
```typescript
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
```

- [ ] **Step 3: Test subcontractor payments**

```bash
PROJECT_ID=$(curl -s http://localhost:3000/api/projects | jq -r '.[0].id')
curl -X POST "http://localhost:3000/api/projects/$PROJECT_ID/subcontractor-payments" \
  -H "Content-Type: application/json" \
  -d '{"amount":25000,"type":"Labour","date":"2026-07-02","description":"Foundation"}'
```

Expected: Payment created with type `Labour`.

---

### Task 9: Build Material Expense API Routes

**Files:**
- Create: `app/api/projects/[id]/material-expenses/route.ts`
- Create: `app/api/projects/[id]/material-expenses/[eid]/route.ts`

**Interfaces:**
- Consumes: `prisma`
- Produces: CRUD endpoints for material expenses.

- [ ] **Step 1: Implement list and create**

Create `app/api/projects/[id]/material-expenses/route.ts`:
```typescript
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
```

- [ ] **Step 2: Implement update and delete**

Create `app/api/projects/[id]/material-expenses/[eid]/route.ts`:
```typescript
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
```

- [ ] **Step 3: Test material expenses**

```bash
PROJECT_ID=$(curl -s http://localhost:3000/api/projects | jq -r '.[0].id')
curl -X POST "http://localhost:3000/api/projects/$PROJECT_ID/material-expenses" \
  -H "Content-Type: application/json" \
  -d '{"amount":15000,"date":"2026-07-03","description":"Cement"}'
```

Expected: Expense created.

---

### Task 10: Build Excel Export API Route

**Files:**
- Create: `app/api/export/route.ts`

**Interfaces:**
- Consumes: `prisma`, `xlsx`
- Produces: `GET /api/export` downloads workbook with sheets `Haris`, `Joseph`, `Expense`.

- [ ] **Step 1: Implement export route**

Create `app/api/export/route.ts`:
```typescript
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

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(haris), 'Haris');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(joseph), 'Joseph');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(expense), 'Expense');

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
```

- [ ] **Step 2: Test export**

```bash
curl -O -J http://localhost:3000/api/export
ls *.xlsx
```

Expected: File downloads and contains Haris/Joseph/Expense sheets.

---

### Task 11: Create UI Primitive Components

**Files:**
- Create: `components/ui/Button.tsx`
- Create: `components/ui/Input.tsx`
- Create: `components/ui/Select.tsx`
- Create: `components/ui/Card.tsx`

**Interfaces:**
- Produces: reusable styled components.

- [ ] **Step 1: Button component**

Create `components/ui/Button.tsx`:
```typescript
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

export function Button({ children, variant = 'primary', className = '', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-500',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Input component**

Create `components/ui/Input.tsx`:
```typescript
import { InputHTMLAttributes, forwardRef } from 'react';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = '', ...props }, ref) {
    return (
      <input
        ref={ref}
        className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
        {...props}
      />
    );
  }
);
```

- [ ] **Step 3: Select component**

Create `components/ui/Select.tsx`:
```typescript
import { SelectHTMLAttributes, forwardRef } from 'react';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = '', children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  }
);
```

- [ ] **Step 4: Card component**

Create `components/ui/Card.tsx`:
```typescript
import { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}
```

---

### Task 12: Create Shared Application Components

**Files:**
- Create: `components/StatCard.tsx`
- Create: `components/ProjectCard.tsx`
- Create: `components/DataTable.tsx`
- Create: `components/PaymentForm.tsx`
- Create: `components/ExpenseForm.tsx`
- Create: `components/TabNav.tsx`
- Create: `components/DeleteConfirm.tsx`
- Create: `components/ProjectForm.tsx`

**Interfaces:**
- Consumes: UI primitives
- Produces: reusable app components used by pages.

- [ ] **Step 1: StatCard**

Create `components/StatCard.tsx`:
```typescript
import { Card } from './ui/Card';

interface StatCardProps {
  title: string;
  value: string;
  tone?: 'neutral' | 'success' | 'danger' | 'info';
}

export function StatCard({ title, value, tone = 'neutral' }: StatCardProps) {
  const tones = {
    neutral: 'text-slate-900',
    success: 'text-emerald-600',
    danger: 'text-rose-600',
    info: 'text-blue-600',
  };
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className={`mt-2 text-2xl font-bold ${tones[tone]}`}>{value}</p>
    </Card>
  );
}
```

- [ ] **Step 2: ProjectCard**

Create `components/ProjectCard.tsx`:
```typescript
import Link from 'next/link';
import { Card } from './ui/Card';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    estimated_value: number;
    total_received: number;
    total_expenses: number;
    profit_loss: number;
  };
}

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const profit = project.profit_loss >= 0;
  const ratio = project.estimated_value
    ? Math.round((project.total_expenses / project.estimated_value) * 100)
    : 0;

  return (
    <Link href={`/project/${project.id}`}>
      <Card className="h-full p-5 transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{project.name}</h3>
          <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">Active</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500">Contract</p>
            <p className="font-medium text-slate-900">{fmt(project.estimated_value)}</p>
          </div>
          <div>
            <p className="text-slate-500">Received</p>
            <p className="font-medium text-emerald-600">{fmt(project.total_received)}</p>
          </div>
          <div>
            <p className="text-slate-500">Cost</p>
            <p className="font-medium text-rose-600">{fmt(project.total_expenses)}</p>
          </div>
          <div>
            <p className="text-slate-500">Profit</p>
            <p className={`font-medium ${profit ? 'text-emerald-600' : 'text-rose-600'}`}>
              {profit ? '+' : ''}{fmt(project.profit_loss)}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Cost vs contract</span>
            <span>{ratio}%</span>
          </div>
          <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-blue-500"
              style={{ width: `${Math.min(ratio, 100)}%` }}
            />
          </div>
        </div>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 3: DataTable**

Create `components/DataTable.tsx`:
```typescript
import { Button } from './ui/Button';

interface Column {
  key: string;
  label: string;
  render?: (row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  rows: any[];
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
}

export function DataTable({ columns, rows, onEdit, onDelete }: DataTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-4 py-3 text-left font-semibold text-slate-700">
                {c.label}
              </th>
            ))}
            {(onEdit || onDelete) && <th className="px-4 py-3 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50">
              {columns.map((c) => (
                <td key={c.key} className="px-4 py-3 text-slate-700">
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    {onEdit && (
                      <Button variant="ghost" onClick={() => onEdit(row)} className="px-2 py-1 text-xs">
                        Edit
                      </Button>
                    )}
                    {onDelete && (
                      <Button variant="danger" onClick={() => onDelete(row)} className="px-2 py-1 text-xs">
                        Delete
                      </Button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 4: PaymentForm**

Create `components/PaymentForm.tsx`:
```typescript
import { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

interface PaymentFormProps {
  initial?: any;
  showType?: boolean;
  onSubmit: (data: any) => void;
  onCancel?: () => void;
}

export function PaymentForm({ initial, showType = false, onSubmit, onCancel }: PaymentFormProps) {
  const [amount, setAmount] = useState(initial?.amount ?? '');
  const [date, setDate] = useState(initial?.date ? new Date(initial.date).toISOString().split('T')[0] : '');
  const [type, setType] = useState(initial?.type ?? 'Labour');
  const [description, setDescription] = useState(initial?.description ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { amount: Number(amount), date };
    if (showType) {
      payload.type = type;
      payload.description = description;
    }
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <Input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        {showType && (
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="Labour">Labour</option>
            <option value="Labour+Material">Labour+Material</option>
          </Select>
        )}
      </div>
      {showType && (
        <Input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
      )}
      <div className="flex gap-2">
        <Button type="submit">{initial ? 'Update' : 'Add'}</Button>
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}
```

- [ ] **Step 5: ExpenseForm**

Create `components/ExpenseForm.tsx`:
```typescript
import { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface ExpenseFormProps {
  initial?: any;
  onSubmit: (data: any) => void;
  onCancel?: () => void;
}

export function ExpenseForm({ initial, onSubmit, onCancel }: ExpenseFormProps) {
  const [amount, setAmount] = useState(initial?.amount ?? '');
  const [date, setDate] = useState(initial?.date ? new Date(initial.date).toISOString().split('T')[0] : '');
  const [description, setDescription] = useState(initial?.description ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ amount: Number(amount), date, description });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <Input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button type="submit">{initial ? 'Update' : 'Add'}</Button>
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}
```

- [ ] **Step 6: TabNav**

Create `components/TabNav.tsx`:
```typescript
interface TabNavProps {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}

export function TabNav({ tabs, active, onChange }: TabNavProps) {
  return (
    <div className="border-b border-slate-200">
      <nav className="-mb-px flex space-x-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={`border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
              active === tab
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>
    </div>
  );
}
```

- [ ] **Step 7: DeleteConfirm**

Create `components/DeleteConfirm.tsx`:
```typescript
import { Button } from './ui/Button';

interface DeleteConfirmProps {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirm({ title, onConfirm, onCancel }: DeleteConfirmProps) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
      <p className="text-sm text-rose-800">{title}</p>
      <div className="mt-3 flex gap-2">
        <Button variant="danger" onClick={onConfirm} className="text-xs">
          Delete
        </Button>
        <Button variant="secondary" onClick={onCancel} className="text-xs">
          Cancel
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: ProjectForm**

Create `components/ProjectForm.tsx`:
```typescript
import { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface ProjectFormProps {
  onSubmit: (data: { name: string; estimated_value: number }) => void;
  onCancel?: () => void;
}

export function ProjectForm({ onSubmit, onCancel }: ProjectFormProps) {
  const [name, setName] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, estimated_value: Number(estimatedValue) });
    setName('');
    setEstimatedValue('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">New Project</h3>
      <Input placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input type="number" placeholder="Estimated value" value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} required />
      <div className="flex gap-2">
        <Button type="submit">Create</Button>
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}
```

---

### Task 13: Build Dashboard Page

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/globals.css` (add minimal base styles if needed)

**Interfaces:**
- Consumes: `StatCard`, `ProjectCard`, `ProjectForm`, `Button`
- Produces: dashboard UI.

- [ ] **Step 1: Implement dashboard**

Replace `app/page.tsx`:
```typescript
'use client';

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/StatCard';
import { ProjectCard } from '@/components/ProjectCard';
import { ProjectForm } from '@/components/ProjectForm';
import { Button } from '@/components/ui/Button';

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    const res = await fetch('/api/projects');
    const data = await res.json();
    setProjects(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (payload: { name: string; estimated_value: number }) => {
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setShowForm(false);
    fetchProjects();
  };

  const handleExport = async () => {
    const res = await fetch('/api/export');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BuildTrack_Backup_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totals = projects.reduce(
    (acc, p) => {
      acc.revenue += p.total_received;
      acc.expenses += p.total_expenses;
      acc.profit += p.profit_loss;
      return acc;
    },
    { revenue: 0, expenses: 0, profit: 0 }
  );

  if (loading) return <div className="p-10 text-slate-500">Loading…</div>;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">BuildTrack</h1>
            <p className="text-slate-500">Construction Expense Tracker</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleExport}>Download Backup</Button>
            <Button onClick={() => setShowForm(true)}>New Project</Button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Active Projects" value={projects.length.toString()} tone="info" />
          <StatCard title="Total Revenue" value={fmt(totals.revenue)} tone="success" />
          <StatCard title="Total Expenses" value={fmt(totals.expenses)} tone="danger" />
          <StatCard
            title="Net Profit"
            value={`${totals.profit >= 0 ? '+' : ''}${fmt(totals.profit)}`}
            tone={totals.profit >= 0 ? 'success' : 'danger'}
          />
        </div>

        {showForm && (
          <div className="mt-8">
            <ProjectForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
          </div>
        )}

        <h2 className="mt-10 text-xl font-semibold text-slate-900">Projects</h2>
        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>

        {projects.length === 0 && (
          <div className="mt-10 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            No projects yet. Click “New Project” to get started.
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Test dashboard**

Run:
```bash
npm run dev
```

Open `http://localhost:3000`. Expected: dashboard loads, stats display, project cards render, New Project form works, Download Backup triggers Excel download.

---

### Task 14: Build Project Detail Page

**Files:**
- Create: `app/project/[id]/page.tsx`

**Interfaces:**
- Consumes: `TabNav`, `PaymentForm`, `ExpenseForm`, `DataTable`, `DeleteConfirm`, `Button`, `Card`
- Produces: project detail UI with tabs.

- [ ] **Step 1: Implement project detail page**

Create `app/project/[id]/page.tsx`:
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TabNav } from '@/components/TabNav';
import { PaymentForm } from '@/components/PaymentForm';
import { ExpenseForm } from '@/components/ExpenseForm';
import { DataTable } from '@/components/DataTable';
import { DeleteConfirm } from '@/components/DeleteConfirm';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const TABS = ['Owner Payments', 'Subcontractor Payments', 'Material Expenses'];

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProject = async () => {
    const res = await fetch(`/api/projects/${id}`);
    const data = await res.json();
    setProject(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  if (loading) return <div className="p-10 text-slate-500">Loading…</div>;
  if (!project) return <div className="p-10 text-slate-500">Project not found.</div>;

  const received = project.owner_payments.reduce((s: number, p: any) => s + p.amount, 0);
  const subCost = project.subcontractor_payments.reduce((s: number, p: any) => s + p.amount, 0);
  const matCost = project.material_expenses.reduce((s: number, p: any) => s + p.amount, 0);
  const totalCost = subCost + matCost;
  const profit = received - totalCost;

  const handleDeleteProject = async () => {
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    router.push('/');
  };

  const submitOwner = async (data: any) => {
    const url = editing
      ? `/api/projects/${id}/owner-payments/${editing.id}`
      : `/api/projects/${id}/owner-payments`;
    await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setEditing(null);
    fetchProject();
  };

  const submitSub = async (data: any) => {
    const url = editing
      ? `/api/projects/${id}/subcontractor-payments/${editing.id}`
      : `/api/projects/${id}/subcontractor-payments`;
    await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setEditing(null);
    fetchProject();
  };

  const submitExpense = async (data: any) => {
    const url = editing
      ? `/api/projects/${id}/material-expenses/${editing.id}`
      : `/api/projects/${id}/material-expenses`;
    await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setEditing(null);
    fetchProject();
  };

  const deleteRow = async (endpoint: string) => {
    await fetch(endpoint, { method: 'DELETE' });
    setDeleting(null);
    fetchProject();
  };

  const dateCell = (row: any) => new Date(row.date).toLocaleDateString('en-IN');

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Button variant="ghost" onClick={() => router.push('/')} className="mb-2 px-0">
              ← Back
            </Button>
            <h1 className="text-3xl font-bold text-slate-900">{project.name}</h1>
          </div>
          <Button variant="danger" onClick={() => setDeleting({ type: 'project' })}>
            Delete Project
          </Button>
        </div>

        <Card className="mt-6 grid grid-cols-2 gap-4 p-5 md:grid-cols-4">
          <div>
            <p className="text-xs uppercase text-slate-500">Contract</p>
            <p className="text-lg font-semibold">{fmt(project.estimated_value)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Received</p>
            <p className="text-lg font-semibold text-emerald-600">{fmt(received)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Total Cost</p>
            <p className="text-lg font-semibold text-rose-600">{fmt(totalCost)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Profit</p>
            <p className={`text-lg font-semibold ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {fmt(profit)}
            </p>
          </div>
        </Card>

        {deleting?.type === 'project' && (
          <div className="mt-4">
            <DeleteConfirm
              title="Are you sure you want to delete this project and all its records?"
              onConfirm={handleDeleteProject}
              onCancel={() => setDeleting(null)}
            />
          </div>
        )}

        <div className="mt-8">
          <TabNav tabs={TABS} active={activeTab} onChange={setActiveTab} />
        </div>

        <div className="mt-6">
          {activeTab === 'Owner Payments' && (
            <div className="space-y-4">
              <PaymentForm
                key={editing?.id || 'owner-new'}
                initial={editing}
                onSubmit={submitOwner}
                onCancel={editing ? () => setEditing(null) : undefined}
              />
              <DataTable
                columns={[
                  { key: 'date', label: 'Date', render: dateCell },
                  { key: 'amount', label: 'Amount', render: (r) => fmt(r.amount) },
                ]}
                rows={project.owner_payments}
                onEdit={(r) => setEditing(r)}
                onDelete={(r) => setDeleting({ type: 'owner', id: r.id })}
              />
              {deleting?.type === 'owner' && (
                <DeleteConfirm
                  title="Delete this owner payment?"
                  onConfirm={() => deleteRow(`/api/projects/${id}/owner-payments/${deleting.id}`)}
                  onCancel={() => setDeleting(null)}
                />
              )}
            </div>
          )}

          {activeTab === 'Subcontractor Payments' && (
            <div className="space-y-4">
              <PaymentForm
                key={editing?.id || 'sub-new'}
                initial={editing}
                showType
                onSubmit={submitSub}
                onCancel={editing ? () => setEditing(null) : undefined}
              />
              <DataTable
                columns={[
                  { key: 'date', label: 'Date', render: dateCell },
                  { key: 'type', label: 'Type' },
                  { key: 'description', label: 'Description' },
                  { key: 'amount', label: 'Amount', render: (r) => fmt(r.amount) },
                ]}
                rows={project.subcontractor_payments}
                onEdit={(r) => setEditing(r)}
                onDelete={(r) => setDeleting({ type: 'sub', id: r.id })}
              />
              {deleting?.type === 'sub' && (
                <DeleteConfirm
                  title="Delete this subcontractor payment?"
                  onConfirm={() => deleteRow(`/api/projects/${id}/subcontractor-payments/${deleting.id}`)}
                  onCancel={() => setDeleting(null)}
                />
              )}
            </div>
          )}

          {activeTab === 'Material Expenses' && (
            <div className="space-y-4">
              <ExpenseForm
                key={editing?.id || 'exp-new'}
                initial={editing}
                onSubmit={submitExpense}
                onCancel={editing ? () => setEditing(null) : undefined}
              />
              <DataTable
                columns={[
                  { key: 'date', label: 'Date', render: dateCell },
                  { key: 'description', label: 'Description' },
                  { key: 'amount', label: 'Amount', render: (r) => fmt(r.amount) },
                ]}
                rows={project.material_expenses}
                onEdit={(r) => setEditing(r)}
                onDelete={(r) => setDeleting({ type: 'expense', id: r.id })}
              />
              {deleting?.type === 'expense' && (
                <DeleteConfirm
                  title="Delete this material expense?"
                  onConfirm={() => deleteRow(`/api/projects/${id}/material-expenses/${deleting.id}`)}
                  onCancel={() => setDeleting(null)}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Test project detail**

Run:
```bash
npm run dev
```

Click a project card on the dashboard. Expected: project detail loads with tabs; add/edit/delete works for all three ledgers; totals update.

---

### Task 15: Create Legacy Data Migration Script

**Files:**
- Create: `scripts/migrate-legacy.ts`

**Interfaces:**
- Consumes: `prisma`, `data/projects.json`
- Produces: SQLite records matching the new schema.

- [ ] **Step 1: Write migration script**

Create `scripts/migrate-legacy.ts`:
```typescript
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

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
```

- [ ] **Step 2: Run migration**

Run:
```bash
npx ts-node scripts/migrate-legacy.ts
```

Expected: Script outputs migrated project names and completes without errors.

- [ ] **Step 3: Verify migrated data**

Run:
```bash
curl http://localhost:3000/api/projects
```

Expected: Projects from legacy data appear with correct totals.

---

### Task 16: Configure Next.js and Clean Up

**Files:**
- Modify: `next.config.js`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Produces: clean global layout and working build.

- [ ] **Step 1: Update next.config.js for static export (optional) or keep dev**

Replace `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = nextConfig;
```

- [ ] **Step 2: Update root layout**

Replace `app/layout.tsx`:
```typescript
export const metadata = {
  title: 'BuildTrack — Construction Expense Tracker',
  description: 'Track payments, expenses, and profitability across all sites',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Clean up globals.css**

Replace `app/globals.css` with minimal base:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Run build**

Run:
```bash
npm run build
```

Expected: Build completes without errors.

---

### Task 17: Final Verification

**Files:**
- None (manual testing).

**Interfaces:**
- Consumes: full app
- Produces: confirmation that all features work.

- [ ] **Step 1: Full manual test**

1. Start dev server: `npm run dev`
2. Open `http://localhost:3000`.
3. Verify migrated projects appear on dashboard.
4. Create a new project.
5. Open the project.
6. Add an owner payment, a subcontractor payment (both Labour and Labour+Material), and a material expense.
7. Verify totals update in the summary bar.
8. Edit and delete each record type.
9. Click **Download Backup** and open the Excel file.
10. Confirm workbook has exactly three sheets named `Haris`, `Joseph`, and `Expense`.
11. Confirm sheet data matches database records.
12. Delete a project and verify it disappears from dashboard.

- [ ] **Step 2: Run lint**

Run:
```bash
npm run lint
```

Expected: No lint errors (warnings acceptable).

---

## Self-Review

### Spec Coverage

| Spec Requirement | Implementing Task |
|------------------|-------------------|
| Prisma schema with Project, OwnerPayment, SubcontractorPayment, MaterialExpense | Task 4 |
| Full CRUD for projects | Task 6 |
| Full CRUD for owner payments | Task 7 |
| Full CRUD for subcontractor payments with type dropdown | Task 8 |
| Full CRUD for material expenses | Task 9 |
| Excel export with Haris/Joseph/Expense sheets | Task 10 |
| Dashboard with stats and project cards | Task 13 |
| Project detail with tabs | Task 14 |
| Polished Tailwind UI | Tasks 11, 12, 13, 14 |
| Legacy data migration | Task 15 |

### Placeholder Scan

No TBD, TODO, or vague steps. Every task includes exact file paths, code, and commands.

### Type Consistency

- Prisma model names used consistently: `ownerPayment`, `subcontractorPayment`, `materialExpense`.
- API route parameter names consistent: `pid` for payments, `eid` for expenses.
- Frontend component props and callbacks match across dashboard and detail pages.

### Gaps Fixed

- Added explicit delete confirmation components to avoid accidental data loss.
- Added legacy field mapping details in migration script.
- Included build and lint verification steps.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-09-construction-expense-tracker-plan.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints.

Which approach would you like?
