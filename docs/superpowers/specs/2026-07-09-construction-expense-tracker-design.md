# Construction Expense Tracker — Design Specification

## Overview

Rebuild the existing Express + JSON-based "BuildTrack" construction expense tracker as a modern, standalone Next.js web application using Prisma (SQLite), TypeScript, and TailwindCSS. The app will track owner payments, subcontractor payouts, and direct material expenses across multiple construction projects, with a cleaner, professional UI and a one-click Excel backup feature.

## Goals

- Replace the current Express + vanilla JS stack with Next.js App Router + Prisma + SQLite.
- Provide full CRUD for projects, owner payments, subcontractor payments, and material expenses.
- Export all data to an Excel workbook with exactly three sheets: "Haris", "Joseph", and "Expense".
- Deliver a visually polished, responsive UI that replaces the current "ugly" dashboard.
- Preserve existing data by migrating from `data/projects.json` into SQLite.

## Non-Goals

- User authentication or multi-user support.
- Online deployment configuration.
- PDF invoice generation, receipt photo attachments, or notifications.
- GST/tax calculations.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | SQLite |
| ORM | Prisma |
| Styling | TailwindCSS |
| Excel | `xlsx` npm package |
| State / Data Fetching | React hooks + `fetch` |

## Database Schema (Prisma)

```prisma
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
  type        String   // "Labour" or "Labour+Material"
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

## API Routes

All routes return JSON unless noted.

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/projects` | List all projects with summary totals |
| POST | `/api/projects` | Create a new project |
| GET | `/api/projects/[id]` | Get full project details |
| PUT | `/api/projects/[id]` | Update project name / estimated value |
| DELETE | `/api/projects/[id]` | Delete project and all related records |
| GET | `/api/projects/[id]/owner-payments` | List owner payments for a project |
| POST | `/api/projects/[id]/owner-payments` | Add owner payment |
| PUT | `/api/projects/[id]/owner-payments/[pid]` | Update owner payment |
| DELETE | `/api/projects/[id]/owner-payments/[pid]` | Delete owner payment |
| GET | `/api/projects/[id]/subcontractor-payments` | List subcontractor payments |
| POST | `/api/projects/[id]/subcontractor-payments` | Add subcontractor payment |
| PUT | `/api/projects/[id]/subcontractor-payments/[pid]` | Update subcontractor payment |
| DELETE | `/api/projects/[id]/subcontractor-payments/[pid]` | Delete subcontractor payment |
| GET | `/api/projects/[id]/material-expenses` | List material expenses |
| POST | `/api/projects/[id]/material-expenses` | Add material expense |
| PUT | `/api/projects/[id]/material-expenses/[eid]` | Update material expense |
| DELETE | `/api/projects/[id]/material-expenses/[eid]` | Delete material expense |
| GET | `/api/export` | Download `.xlsx` workbook (attachment) |

## Excel Export Format

The `/api/export` route generates a workbook with **exactly three sheets**:

### Sheet 1 — "Haris" (Owner Payments)
| Column | Source |
|--------|--------|
| id | `OwnerPayment.id` |
| project_id | `OwnerPayment.project_id` |
| project_name | `Project.name` |
| date | `OwnerPayment.date` (YYYY-MM-DD) |
| amount | `OwnerPayment.amount` |

### Sheet 2 — "Joseph" (Subcontractor Payments)
| Column | Source |
|--------|--------|
| id | `SubcontractorPayment.id` |
| project_id | `SubcontractorPayment.project_id` |
| project_name | `Project.name` |
| date | `SubcontractorPayment.date` (YYYY-MM-DD) |
| amount | `SubcontractorPayment.amount` |
| type | `SubcontractorPayment.type` |
| description | `SubcontractorPayment.description` |

### Sheet 3 — "Expense" (Material Expenses)
| Column | Source |
|--------|--------|
| id | `MaterialExpense.id` |
| project_id | `MaterialExpense.project_id` |
| project_name | `Project.name` |
| date | `MaterialExpense.date` (YYYY-MM-DD) |
| amount | `MaterialExpense.amount` |
| description | `MaterialExpense.description` |

## Frontend Pages & Components

### Pages

- **`/app/page.tsx`** — Dashboard
  - Global stat cards: Active Projects, Total Revenue, Total Expenses, Net Profit.
  - Grid of project cards showing contract value, received, cost, profit/loss.
  - "New Project" button opening a modal/form.
  - "Download Backup" button triggering `/api/export`.

- **`/app/project/[id]/page.tsx`** — Project Detail
  - Project header with name, estimated value, and financial summary.
  - Three tabs:
    1. **Owner Payments** — table + add/edit form.
    2. **Subcontractor Payments** — table + add/edit form with `type` dropdown (`Labour` / `Labour+Material`).
    3. **Material Expenses** — table + add/edit form.
  - Each tab shows running total and allows edit/delete.

### Shared Components

- `ProjectCard` — dashboard project summary card.
- `StatCard` — global summary metric.
- `DataTable` — reusable transaction table.
- `PaymentForm` — add/edit form for owner and subcontractor payments.
- `ExpenseForm` — add/edit form for material expenses.
- `TabNav` — tab switcher.
- `DeleteConfirm` — confirmation dialog.
- `ProjectForm` — new project modal form.
- `Button`, `Input`, `Select`, `Card` — Tailwind-styled primitives.

## UI / Design Direction

- Clean, professional construction/contracting aesthetic.
- Color system:
  - Slate/gray neutrals for structure.
  - Emerald for profit and positive status.
  - Rose for loss / over-budget.
  - Blue for active status.
- Card-based dashboard with clear visual hierarchy.
- Sticky financial summary bar on project detail page.
- Responsive layout: single column on mobile, grid on desktop.
- Subtle shadows, rounded corners, and consistent spacing.

## Data Flow

1. Dashboard fetches `/api/projects` on mount and renders cards.
2. Project detail fetches `/api/projects/[id]` and derived transaction endpoints.
3. Forms POST/PUT to API routes; on success, relevant data is re-fetched and UI updates.
4. Delete actions show confirmation, then call DELETE endpoint and refresh.
5. "Download Backup" calls `/api/export` and triggers browser download.

## Error Handling

- API routes return `{ error: string }` with appropriate HTTP status codes (400, 404, 500).
- Client forms validate required fields and numeric amounts before submission.
- Failed fetches display inline error messages or alert-style banners.

## Data Migration

- One-time script `scripts/migrate-legacy.ts` reads `data/projects.json` and inserts projects, owner payments, subcontractor payments, and site expenses into SQLite via Prisma.
- Run with `npx ts-node scripts/migrate-legacy.ts` after initial schema setup.
- Legacy field mapping:
  - **Project:** `name` → `name`; `contract_value` (or `estimated_value`) → `estimated_value`. Legacy fields `location`, `start_date`, and `status` are dropped because the new schema does not store them.
  - **Owner Payment:** `amount`, `date` preserved; `notes` is dropped.
  - **Subcontractor Payment:** `amount`, `type`, `date` preserved; `subcontractor_name` and `notes` are concatenated into `description` if present.
  - **Site Expense:** `amount`, `date`, `description` preserved; `category` and `vendor` are appended to `description` if present.

## Testing Strategy

- Manual end-to-end:
  1. Create a project.
  2. Add owner payment, subcontractor payment, and material expense.
  3. Verify totals update correctly.
  4. Click "Download Backup" and confirm the workbook has Haris/Joseph/Expense sheets with correct data.
  5. Verify edit and delete operations.
- Migration test: run `scripts/migrate-legacy.ts` against existing `data/projects.json` and confirm counts.

## Project Structure

```
expense-tracker/
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
│   ├── ProjectCard.tsx
│   ├── StatCard.tsx
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
│   └── schema.prisma
├── scripts/
│   └── migrate-legacy.ts
├── data/
│   └── projects.json          # legacy data (read-only for migration)
├── public/
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── next.config.js
└── docs/superpowers/specs/2026-07-09-construction-expense-tracker-design.md
```

## Dependencies

```json
{
  "next": "^14",
  "react": "^18",
  "react-dom": "^18",
  "typescript": "^5",
  "prisma": "^5",
  "@prisma/client": "^5",
  "tailwindcss": "^3",
  "xlsx": "^0.18.5"
}
```

## Open Questions / Notes

- Currency will remain INR (₹) as shown in the existing app UI, but stored as raw numbers in the database.
- No user authentication; app is intended for local single-user use.
- Auto-backup on every save is intentionally removed in favor of the explicit "Download Backup" button to keep the design simple and avoid file-system writes from API routes.
