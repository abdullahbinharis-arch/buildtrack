# 🏗️ Construction Expense Tracker

A standalone web application for tracking construction project finances — owner payments, subcontractor payouts, and site expenses. Built with Node.js + Express + Vanilla JS. No build step, no database setup.

## Features

- **Multi-Project Support** — Track multiple construction sites independently
- **3 Financial Ledgers** per project:
  - 💰 Owner Payments (money received from client)
  - 👷 Subcontractor Payments (labour / labour+material payouts)
  - 🧱 Site Expenses (materials, tools, transport, food, etc.)
- **Auto-Calculated Summary** — Total cost, profit/loss, remaining contract value
- **Automatic Excel Backup** — Every save creates a timestamped `.xlsx` backup in `data/backup/`
- **One-Click Export** — Download any project or all projects as Excel
- **Legacy Data Import** — Import your existing Excel workbook into the app
- **Responsive Design** — Works on desktop, tablet, and mobile

## Quick Start (Mac Terminal)

```bash
# 1. Navigate to project folder
cd construction-expense-tracker

# 2. Install dependencies
npm install

# 3. (Optional) Import your existing Excel data
# Place your Excel file in the project root, then:
npm run import
# Or specify a path:
# node import-legacy.js /path/to/your/excel.xlsx

# 4. Start the server
npm start

# 5. Open browser
open http://localhost:3000
```

## Project Structure

```
construction-expense-tracker/
├── data/
│   ├── projects.json          # Main data store (JSON)
│   └── backup/                # Auto-generated Excel backups
├── public/
│   ├── index.html             # App shell
│   ├── app.js                 # Frontend logic
│   └── style.css              # Styles
├── server.js                  # Express backend
├── import-legacy.js           # Legacy Excel import script
├── package.json
└── README.md
```

## Data Persistence

- **Primary storage**: `data/projects.json` (plain JSON, human-readable)
- **Auto-backup**: Every create/update/delete triggers an Excel export to `data/backup/YYYY-MM-DD_HH-MM-SS_backup.xlsx`
- **Manual export**: Click "Export All" or "Export" on any project page
- **No database required** — everything is file-based

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all projects (summary) |
| POST | `/api/projects` | Create new project |
| GET | `/api/projects/:id` | Get full project details |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| GET | `/api/projects/:id/owner-payments` | List owner payments |
| POST | `/api/projects/:id/owner-payments` | Add owner payment |
| PUT | `/api/projects/:id/owner-payments/:pid` | Update payment |
| DELETE | `/api/projects/:id/owner-payments/:pid` | Delete payment |
| GET | `/api/projects/:id/subcontractor-payments` | List subcontractor payments |
| POST | `/api/projects/:id/subcontractor-payments` | Add payment |
| PUT | `/api/projects/:id/subcontractor-payments/:pid` | Update payment |
| DELETE | `/api/projects/:id/subcontractor-payments/:pid` | Delete payment |
| GET | `/api/projects/:id/site-expenses` | List site expenses |
| POST | `/api/projects/:id/site-expenses` | Add expense |
| PUT | `/api/projects/:id/site-expenses/:eid` | Update expense |
| DELETE | `/api/projects/:id/site-expenses/:eid` | Delete expense |
| GET | `/api/export/all` | Export all projects to Excel |
| GET | `/api/export/:id` | Export single project to Excel |

## Deployment

### Local (Mac)
```bash
npm start
```

### Online (Render / Railway / VPS)
1. Push to GitHub
2. Connect to Render/Railway
3. Set `PORT` environment variable (default: 3000)
4. **Important**: Mount a persistent volume to the `data/` directory so your JSON and backups survive redeploys

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: Vanilla HTML/CSS/JS (no build step)
- **Storage**: JSON files on disk
- **Excel**: `xlsx` npm package
- **File Upload**: `multer`
- **UUID**: `uuid` package

## License

MIT
