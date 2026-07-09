const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backup');

// Ensure dirs exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

// Excel date serial to JS Date (Excel's epoch starts 1900-01-01, but 1900 is a leap year bug)
function excelDateToJSDate(serial) {
  const excelEpoch = new Date(Date.UTC(1899, 11, 30));
  return new Date(excelEpoch.getTime() + serial * 24 * 60 * 60 * 1000);
}

function formatDate(d) {
  if (!d) return new Date().toISOString().split('T')[0];
  if (typeof d === 'number') {
    const date = excelDateToJSDate(d);
    return date.toISOString().split('T')[0];
  }
  if (d instanceof Date) return d.toISOString().split('T')[0];
  return d;
}

function loadProjects() {
  if (!fs.existsSync(PROJECTS_FILE)) return [];
  const raw = fs.readFileSync(PROJECTS_FILE, 'utf8');
  return raw ? JSON.parse(raw) : [];
}

function saveProjects(projects) {
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
}

function autoBackup(projects) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const wb = XLSX.utils.book_new();
  projects.forEach(project => {
    const summaryData = [
      ['Project Name', project.name],
      ['Location', project.location],
      ['Contract Value', project.contract_value],
      ['Status', project.status],
      ['Start Date', project.start_date],
      ['', ''],
      ['Total Owner Payments', project.owner_payments.reduce((s, p) => s + p.amount, 0)],
      ['Total Subcontractor Payments', project.subcontractor_payments.reduce((s, p) => s + p.amount, 0)],
      ['Total Site Expenses', project.site_expenses.reduce((s, e) => s + e.amount, 0)],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, `${project.name.slice(0, 25)}_Summary`);
  });
  const backupPath = path.join(BACKUP_DIR, `${timestamp}_backup.xlsx`);
  XLSX.writeFile(wb, backupPath);
  console.log(`[AUTO BACKUP] ${backupPath}`);
}

// ─── MAIN IMPORT LOGIC ──────────────────────────────────────

const excelPath = process.argv[2] || path.join(__dirname, 'HARIS_ JOSEPH _KALOOR SITE_EXPENSE.xlsx');

if (!fs.existsSync(excelPath)) {
  console.error(`❌ Excel file not found: ${excelPath}`);
  console.log('Usage: node import-legacy.js [path/to/excel.xlsx]');
  process.exit(1);
}

console.log(`📖 Reading: ${excelPath}`);
const wb = XLSX.readFile(excelPath);
console.log(`   Sheets found: ${wb.SheetNames.join(', ')}`);

const projects = loadProjects();

// ─── PARSE HARIS (Owner Payments) ─────────────────────────
const harisSheet = wb.Sheets['HARIS'];
if (harisSheet) {
  const harisData = XLSX.utils.sheet_to_json(harisSheet, { header: 1 });
  console.log(`\n📊 HARIS sheet: ${harisData.length} rows`);

  // Find header row and data rows
  let headerRow = -1;
  for (let i = 0; i < harisData.length; i++) {
    if (harisData[i] && harisData[i][0] === 'Sl. No.') {
      headerRow = i;
      break;
    }
  }

  const ownerPayments = [];
  if (headerRow >= 0) {
    for (let i = headerRow + 1; i < harisData.length; i++) {
      const row = harisData[i];
      if (!row || !row[1] || !row[2]) continue;
      const amount = Number(row[2]);
      if (isNaN(amount) || amount <= 0) continue;
      ownerPayments.push({
        id: uuidv4(),
        date: formatDate(row[1]),
        amount: amount,
        notes: ''
      });
    }
  }
  console.log(`   → ${ownerPayments.length} owner payments parsed`);

  // ─── PARSE JOSEPH (Subcontractor Payments) ──────────────
  const josephSheet = wb.Sheets['JOSEPH'];
  const josephData = XLSX.utils.sheet_to_json(josephSheet, { header: 1 });
  let jHeaderRow = -1;
  for (let i = 0; i < josephData.length; i++) {
    if (josephData[i] && josephData[i][0] === 'Sl. No.') {
      jHeaderRow = i;
      break;
    }
  }

  const subcontractorPayments = [];
  if (jHeaderRow >= 0) {
    for (let i = jHeaderRow + 1; i < josephData.length; i++) {
      const row = josephData[i];
      if (!row || !row[1] || !row[2]) continue;
      const amount = Number(row[2]);
      if (isNaN(amount) || amount <= 0) continue;
      subcontractorPayments.push({
        id: uuidv4(),
        date: formatDate(row[1]),
        subcontractor_name: 'Joseph',
        amount: amount,
        type: 'Labour', // Default, user can edit later
        notes: ''
      });
    }
  }
  console.log(`   → ${subcontractorPayments.length} subcontractor payments parsed`);

  // ─── PARSE KALOOR SITE EXPENSE ────────────────────────────
  const expenseSheet = wb.Sheets['KALOOR SITE EXPENSE'];
  const expenseData = XLSX.utils.sheet_to_json(expenseSheet, { header: 1 });
  let eHeaderRow = -1;
  for (let i = 0; i < expenseData.length; i++) {
    if (expenseData[i] && expenseData[i][0] === 'Sl. No.') {
      eHeaderRow = i;
      break;
    }
  }

  const siteExpenses = [];
  if (eHeaderRow >= 0) {
    for (let i = eHeaderRow + 1; i < expenseData.length; i++) {
      const row = expenseData[i];
      if (!row || !row[1] || !row[3]) continue;
      const amount = Number(row[3]);
      if (isNaN(amount) || amount <= 0) continue;
      const desc = String(row[2] || '').trim();
      // Auto-categorize based on description
      let category = 'Other';
      const descLower = desc.toLowerCase();
      if (descLower.includes('cement') || descLower.includes('sand') || descLower.includes('block') || descLower.includes('wire')) category = 'Materials';
      else if (descLower.includes('food')) category = 'Food';
      else if (descLower.includes('transport') || descLower.includes('freight')) category = 'Transport';
      else if (descLower.includes('labour')) category = 'Labour';
      else if (descLower.includes('tank') || descLower.includes('hose') || descLower.includes('brush') || descLower.includes('tarpolin') || descLower.includes('net')) category = 'Tools';

      siteExpenses.push({
        id: uuidv4(),
        date: formatDate(row[1]),
        description: desc,
        amount: amount,
        category: category,
        vendor: ''
      });
    }
  }
  console.log(`   → ${siteExpenses.length} site expenses parsed`);

  // ─── CREATE PROJECT ─────────────────────────────────────
  const project = {
    id: uuidv4(),
    name: 'Kaloor Site',
    location: 'Kaloor, Kochi',
    contract_value: 0, // User can set this later
    start_date: siteExpenses.length > 0 ? siteExpenses[0].date : new Date().toISOString().split('T')[0],
    status: 'active',
    created_at: new Date().toISOString(),
    owner_payments: ownerPayments,
    subcontractor_payments: subcontractorPayments,
    site_expenses: siteExpenses
  };

  projects.push(project);
  saveProjects(projects);
  autoBackup(projects);

  const totalOwner = ownerPayments.reduce((s, p) => s + p.amount, 0);
  const totalSub = subcontractorPayments.reduce((s, p) => s + p.amount, 0);
  const totalExp = siteExpenses.reduce((s, e) => s + e.amount, 0);
  const profit = totalOwner - (totalSub + totalExp);

  console.log(`\n✅ Project "Kaloor Site" created successfully!`);
  console.log(`   ┌────────────────────────────────────────┐`);
  console.log(`   │ Owner Payments:     ₹${String(totalOwner).padStart(10)} │`);
  console.log(`   │ Subcontractor Payout: ₹${String(totalSub).padStart(10)} │`);
  console.log(`   │ Site Expenses:       ₹${String(totalExp).padStart(10)} │`);
  console.log(`   │ Total Cost:          ₹${String(totalSub + totalExp).padStart(10)} │`);
  console.log(`   │ Profit/Loss:         ₹${String(profit).padStart(10)} │`);
  console.log(`   └────────────────────────────────────────┘`);
  console.log(`\n🚀 Next steps:`);
  console.log(`   1. Set contract value: Edit project in the web app`);
  console.log(`   2. Run: npm start`);
  console.log(`   3. Open http://localhost:3000`);
} else {
  console.error('❌ HARIS sheet not found in workbook');
  process.exit(1);
}
