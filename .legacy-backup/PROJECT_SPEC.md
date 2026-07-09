# Construction Expense Tracker — Project Specification

## Overview
A standalone web application for tracking construction project finances. Built for a real estate contracting business where the owner (Haris) receives payments from the client, pays subcontractors (like Joseph) for labour/materials, and bears direct material expenses.

## Core Requirements

### 1. Multi-Project Support
- Each project is independent with its own ledger
- Project fields: `name`, `location`, `contract_value` (agreed total), `start_date`, `status` (active/completed)
- Dashboard shows all projects with quick financial summary

### 2. Financial Tracking (3 Ledgers per Project)

#### A. Owner Payments (Haris Sheet Equivalent)
- Track payments RECEIVED from the project owner/client
- Fields: `date`, `amount`, `notes` (optional)
- Running total of amount received

#### B. Subcontractor Payments (Joseph Sheet Equivalent)
- Track payments MADE to subcontractors
- Fields: `date`, `subcontractor_name`, `amount`, `type` (Labour / Labour+Material), `notes`
- Running total of subcontractor payouts

#### C. Site Expenses (Material & Direct Costs)
- Track direct material and operational expenses borne by the contractor
- Fields: `date`, `description`, `amount`, `category` (Materials / Tools / Transport / Food / Labour / Other), `vendor` (optional)
- Running total of site expenses

### 3. Financial Calculations
- **Total Project Cost** = Subcontractor Payments + Site Expenses
- **Profit/Loss** = Owner Payments Received − Total Project Cost
- **Remaining Contract Value** = Contract Value − Owner Payments Received
- **Budget Status** = On Track / Over Budget (based on contract value vs total cost)

### 4. Data Persistence Strategy (CRITICAL)
- **Primary**: JSON file storage (`data/projects.json`) — lightweight, no DB setup
- **Automatic Excel Backup**: On every create/update/delete, the app auto-exports ALL data to `data/backup/YYYY-MM-DD_HH-MM-SS_backup.xlsx`
- **Manual Export**: One-click export to Excel from the UI
- **Import**: Script to import existing Excel data into the system
- **Why**: User explicitly stated Excel backup is vital for data recovery if web app data is lost

### 5. Tech Stack
- **Backend**: Node.js + Express (no build step, runs with `npm start`)
- **Frontend**: Vanilla HTML/CSS/JS (no frameworks, no build step)
- **Storage**: JSON files on disk
- **Excel**: `xlsx` npm package for read/write
- **Port**: 3000 (configurable via env)

### 6. Pages / Views

#### Dashboard (`/`)
- List of all projects with cards
- Each card shows: Project Name, Location, Contract Value, Amount Received, Total Cost, Profit/Loss, Status
- "Add New Project" button
- Quick stats: Total Active Projects, Total Revenue, Total Expenses, Net Profit

#### Project Detail (`/project/:id`)
- Project header with name, location, contract value, status
- 3 tabs: Owner Payments | Subcontractor Payments | Site Expenses
- Each tab: Table view + Add/Edit/Delete + Running total
- Summary sidebar: Financial breakdown with visual indicators

#### Data Management
- Export to Excel button (downloads .xlsx)
- Import from Excel (for migrating legacy data)
- Auto-backup indicator (last backup time)

### 7. API Endpoints

```
GET    /api/projects                    → List all projects
POST   /api/projects                    → Create new project
GET    /api/projects/:id                → Get single project
PUT    /api/projects/:id                → Update project
DELETE /api/projects/:id                → Delete project

GET    /api/projects/:id/owner-payments          → List owner payments
POST   /api/projects/:id/owner-payments          → Add owner payment
PUT    /api/projects/:id/owner-payments/:pid     → Update payment
DELETE /api/projects/:id/owner-payments/:pid     → Delete payment

GET    /api/projects/:id/subcontractor-payments  → List subcontractor payments
POST   /api/projects/:id/subcontractor-payments  → Add payment
PUT    /api/projects/:id/subcontractor-payments/:pid
DELETE /api/projects/:id/subcontractor-payments/:pid

GET    /api/projects/:id/site-expenses           → List site expenses
POST   /api/projects/:id/site-expenses           → Add expense
PUT    /api/projects/:id/site-expenses/:eid      → Update expense
DELETE /api/projects/:id/site-expenses/:eid      → Delete expense

GET    /api/export/:id                    → Export single project to Excel
GET    /api/export/all                    → Export all projects to Excel
POST   /api/import                        → Import from Excel file
```

### 8. Data Models

```json
// Project
{
  "id": "uuid",
  "name": "Kaloor Site",
  "location": "Kaloor, Kochi",
  "contract_value": 1500000,
  "start_date": "2026-03-15",
  "status": "active",
  "created_at": "2026-07-09T10:00:00Z",
  "owner_payments": [...],
  "subcontractor_payments": [...],
  "site_expenses": [...]
}

// Owner Payment
{
  "id": "uuid",
  "date": "2026-04-30",
  "amount": 50000,
  "notes": "First installment"
}

// Subcontractor Payment
{
  "id": "uuid",
  "date": "2026-03-29",
  "subcontractor_name": "Joseph",
  "amount": 38000,
  "type": "Labour",
  "notes": "Foundation work"
}

// Site Expense
{
  "id": "uuid",
  "date": "2026-04-13",
  "description": "CEMENT",
  "amount": 11000,
  "category": "Materials",
  "vendor": "Kuriyil Stores"
}
```

### 9. Legacy Data Import
- Script: `import-legacy.js`
- Reads the existing Excel workbook with 3 sheets (HARIS, JOSEPH, KALOOR SITE EXPENSE)
- Creates a new project named after the sheet (e.g., "Kaloor Site")
- Maps all rows into the new data structure
- Saves to `data/projects.json`
- Creates an immediate Excel backup

### 10. Styling Guidelines
- Clean, professional look (construction/contracting vibe)
- Color coding: Green (profit), Red (loss/over-budget), Blue (active), Gray (completed)
- Responsive design (works on mobile and desktop)
- Card-based layout for projects
- Tables for transaction lists with zebra striping

### 11. File Structure
```
construction-expense-tracker/
├── data/
│   ├── projects.json          # Main data store
│   └── backup/                # Auto-generated Excel backups
├── public/
│   ├── index.html             # Main app shell
│   ├── app.js                 # Frontend logic
│   └── style.css              # Styles
├── server.js                  # Express backend
├── import-legacy.js           # Legacy Excel import script
├── package.json
├── README.md
└── .gitignore
```

### 12. Deployment Notes
- Local: `npm install && npm start` → opens on http://localhost:3000
- Online: Can be deployed to any Node.js hosting (Render, Railway, VPS, etc.)
- Data folder should be persisted (volume mount) when deploying online

### 13. Future Enhancements (Out of Scope for v1)
- User authentication (multi-user access)
- PDF invoice generation
- Photo attachments for receipts
- WhatsApp/SMS payment reminders
- Multi-currency support
- GST/Tax calculation
