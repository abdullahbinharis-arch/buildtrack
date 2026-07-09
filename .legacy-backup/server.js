const express = require('express');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Paths
const DATA_DIR = path.join(__dirname, 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backup');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Multer for file uploads
const upload = multer({ dest: path.join(DATA_DIR, 'uploads') });

// ─── DATA HELPERS ─────────────────────────────────────────────

function loadProjects() {
  if (!fs.existsSync(PROJECTS_FILE)) return [];
  const raw = fs.readFileSync(PROJECTS_FILE, 'utf8');
  return raw ? JSON.parse(raw) : [];
}

function saveProjects(projects) {
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
  autoBackup(projects);
}

function autoBackup(projects) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupPath = path.join(BACKUP_DIR, `${timestamp}_backup.xlsx`);
  exportToExcel(projects, backupPath);
  console.log(`[AUTO BACKUP] Saved to ${backupPath}`);
}

function exportToExcel(projects, filePath) {
  const wb = XLSX.utils.book_new();

  projects.forEach(project => {
    // Project Summary Sheet
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
      ['Total Project Cost', project.subcontractor_payments.reduce((s, p) => s + p.amount, 0) + project.site_expenses.reduce((s, e) => s + e.amount, 0)],
      ['Profit/Loss', project.owner_payments.reduce((s, p) => s + p.amount, 0) - (project.subcontractor_payments.reduce((s, p) => s + p.amount, 0) + project.site_expenses.reduce((s, e) => s + e.amount, 0))],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, `${project.name.slice(0, 25)}_Summary`);

    // Owner Payments
    if (project.owner_payments.length > 0) {
      const ownerData = [['Sl. No.', 'Date', 'Amount', 'Notes']];
      project.owner_payments.forEach((p, i) => {
        ownerData.push([i + 1, p.date, p.amount, p.notes || '']);
      });
      const ownerWs = XLSX.utils.aoa_to_sheet(ownerData);
      XLSX.utils.book_append_sheet(wb, ownerWs, `${project.name.slice(0, 20)}_Owner`);
    }

    // Subcontractor Payments
    if (project.subcontractor_payments.length > 0) {
      const subData = [['Sl. No.', 'Date', 'Subcontractor', 'Type', 'Amount', 'Notes']];
      project.subcontractor_payments.forEach((p, i) => {
        subData.push([i + 1, p.date, p.subcontractor_name, p.type, p.amount, p.notes || '']);
      });
      const subWs = XLSX.utils.aoa_to_sheet(subData);
      XLSX.utils.book_append_sheet(wb, subWs, `${project.name.slice(0, 18)}_Sub`);
    }

    // Site Expenses
    if (project.site_expenses.length > 0) {
      const expData = [['Sl. No.', 'Date', 'Description', 'Category', 'Vendor', 'Amount']];
      project.site_expenses.forEach((e, i) => {
        expData.push([i + 1, e.date, e.description, e.category, e.vendor || '', e.amount]);
      });
      const expWs = XLSX.utils.aoa_to_sheet(expData);
      XLSX.utils.book_append_sheet(wb, expWs, `${project.name.slice(0, 18)}_Exp`);
    }
  });

  XLSX.writeFile(wb, filePath);
}

// ─── PROJECT ROUTES ───────────────────────────────────────────

// List all projects
app.get('/api/projects', (req, res) => {
  const projects = loadProjects();
  // Send summary only (no full transaction arrays for list view)
  const summary = projects.map(p => ({
    id: p.id,
    name: p.name,
    location: p.location,
    contract_value: p.contract_value,
    status: p.status,
    start_date: p.start_date,
    total_owner_payments: p.owner_payments.reduce((s, x) => s + x.amount, 0),
    total_subcontractor_payments: p.subcontractor_payments.reduce((s, x) => s + x.amount, 0),
    total_site_expenses: p.site_expenses.reduce((s, x) => s + x.amount, 0),
    total_cost: p.subcontractor_payments.reduce((s, x) => s + x.amount, 0) + p.site_expenses.reduce((s, x) => s + x.amount, 0),
    profit_loss: p.owner_payments.reduce((s, x) => s + x.amount, 0) - (p.subcontractor_payments.reduce((s, x) => s + x.amount, 0) + p.site_expenses.reduce((s, x) => s + x.amount, 0))
  }));
  res.json(summary);
});

// Create project
app.post('/api/projects', (req, res) => {
  const projects = loadProjects();
  const newProject = {
    id: uuidv4(),
    name: req.body.name,
    location: req.body.location || '',
    contract_value: Number(req.body.contract_value) || 0,
    start_date: req.body.start_date || new Date().toISOString().split('T')[0],
    status: req.body.status || 'active',
    created_at: new Date().toISOString(),
    owner_payments: [],
    subcontractor_payments: [],
    site_expenses: []
  };
  projects.push(newProject);
  saveProjects(projects);
  res.status(201).json(newProject);
});

// Get single project (full detail)
app.get('/api/projects/:id', (req, res) => {
  const projects = loadProjects();
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
});

// Update project
app.put('/api/projects/:id', (req, res) => {
  const projects = loadProjects();
  const idx = projects.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Project not found' });
  projects[idx] = { ...projects[idx], ...req.body, id: projects[idx].id };
  saveProjects(projects);
  res.json(projects[idx]);
});

// Delete project
app.delete('/api/projects/:id', (req, res) => {
  let projects = loadProjects();
  projects = projects.filter(p => p.id !== req.params.id);
  saveProjects(projects);
  res.json({ success: true });
});

// ─── OWNER PAYMENTS ───────────────────────────────────────────

app.get('/api/projects/:id/owner-payments', (req, res) => {
  const projects = loadProjects();
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project.owner_payments);
});

app.post('/api/projects/:id/owner-payments', (req, res) => {
  const projects = loadProjects();
  const idx = projects.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Project not found' });
  const payment = { id: uuidv4(), date: req.body.date, amount: Number(req.body.amount), notes: req.body.notes || '' };
  projects[idx].owner_payments.push(payment);
  saveProjects(projects);
  res.status(201).json(payment);
});

app.put('/api/projects/:id/owner-payments/:pid', (req, res) => {
  const projects = loadProjects();
  const pIdx = projects.findIndex(p => p.id === req.params.id);
  if (pIdx === -1) return res.status(404).json({ error: 'Project not found' });
  const payIdx = projects[pIdx].owner_payments.findIndex(x => x.id === req.params.pid);
  if (payIdx === -1) return res.status(404).json({ error: 'Payment not found' });
  projects[pIdx].owner_payments[payIdx] = { ...projects[pIdx].owner_payments[payIdx], ...req.body, id: req.params.pid };
  saveProjects(projects);
  res.json(projects[pIdx].owner_payments[payIdx]);
});

app.delete('/api/projects/:id/owner-payments/:pid', (req, res) => {
  const projects = loadProjects();
  const pIdx = projects.findIndex(p => p.id === req.params.id);
  if (pIdx === -1) return res.status(404).json({ error: 'Project not found' });
  projects[pIdx].owner_payments = projects[pIdx].owner_payments.filter(x => x.id !== req.params.pid);
  saveProjects(projects);
  res.json({ success: true });
});

// ─── SUBCONTRACTOR PAYMENTS ───────────────────────────────────

app.get('/api/projects/:id/subcontractor-payments', (req, res) => {
  const projects = loadProjects();
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project.subcontractor_payments);
});

app.post('/api/projects/:id/subcontractor-payments', (req, res) => {
  const projects = loadProjects();
  const idx = projects.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Project not found' });
  const payment = {
    id: uuidv4(),
    date: req.body.date,
    subcontractor_name: req.body.subcontractor_name,
    amount: Number(req.body.amount),
    type: req.body.type || 'Labour',
    notes: req.body.notes || ''
  };
  projects[idx].subcontractor_payments.push(payment);
  saveProjects(projects);
  res.status(201).json(payment);
});

app.put('/api/projects/:id/subcontractor-payments/:pid', (req, res) => {
  const projects = loadProjects();
  const pIdx = projects.findIndex(p => p.id === req.params.id);
  if (pIdx === -1) return res.status(404).json({ error: 'Project not found' });
  const payIdx = projects[pIdx].subcontractor_payments.findIndex(x => x.id === req.params.pid);
  if (payIdx === -1) return res.status(404).json({ error: 'Payment not found' });
  projects[pIdx].subcontractor_payments[payIdx] = { ...projects[pIdx].subcontractor_payments[payIdx], ...req.body, id: req.params.pid };
  saveProjects(projects);
  res.json(projects[pIdx].subcontractor_payments[payIdx]);
});

app.delete('/api/projects/:id/subcontractor-payments/:pid', (req, res) => {
  const projects = loadProjects();
  const pIdx = projects.findIndex(p => p.id === req.params.id);
  if (pIdx === -1) return res.status(404).json({ error: 'Project not found' });
  projects[pIdx].subcontractor_payments = projects[pIdx].subcontractor_payments.filter(x => x.id !== req.params.pid);
  saveProjects(projects);
  res.json({ success: true });
});

// ─── SITE EXPENSES ────────────────────────────────────────────

app.get('/api/projects/:id/site-expenses', (req, res) => {
  const projects = loadProjects();
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project.site_expenses);
});

app.post('/api/projects/:id/site-expenses', (req, res) => {
  const projects = loadProjects();
  const idx = projects.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Project not found' });
  const expense = {
    id: uuidv4(),
    date: req.body.date,
    description: req.body.description,
    amount: Number(req.body.amount),
    category: req.body.category || 'Materials',
    vendor: req.body.vendor || ''
  };
  projects[idx].site_expenses.push(expense);
  saveProjects(projects);
  res.status(201).json(expense);
});

app.put('/api/projects/:id/site-expenses/:eid', (req, res) => {
  const projects = loadProjects();
  const pIdx = projects.findIndex(p => p.id === req.params.id);
  if (pIdx === -1) return res.status(404).json({ error: 'Project not found' });
  const expIdx = projects[pIdx].site_expenses.findIndex(x => x.id === req.params.eid);
  if (expIdx === -1) return res.status(404).json({ error: 'Expense not found' });
  projects[pIdx].site_expenses[expIdx] = { ...projects[pIdx].site_expenses[expIdx], ...req.body, id: req.params.eid };
  saveProjects(projects);
  res.json(projects[pIdx].site_expenses[expIdx]);
});

app.delete('/api/projects/:id/site-expenses/:eid', (req, res) => {
  const projects = loadProjects();
  const pIdx = projects.findIndex(p => p.id === req.params.id);
  if (pIdx === -1) return res.status(404).json({ error: 'Project not found' });
  projects[pIdx].site_expenses = projects[pIdx].site_expenses.filter(x => x.id !== req.params.eid);
  saveProjects(projects);
  res.json({ success: true });
});

// ─── EXPORT / IMPORT ──────────────────────────────────────────

app.get('/api/export/all', (req, res) => {
  const projects = loadProjects();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filePath = path.join(DATA_DIR, `export_${timestamp}.xlsx`);
  exportToExcel(projects, filePath);
  res.download(filePath, `Construction_Expense_Export_${timestamp}.xlsx`);
});

app.get('/api/export/:id', (req, res) => {
  const projects = loadProjects();
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filePath = path.join(DATA_DIR, `export_${project.name}_${timestamp}.xlsx`);
  exportToExcel([project], filePath);
  res.download(filePath, `${project.name}_Export_${timestamp}.xlsx`);
});

app.post('/api/import', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const wb = XLSX.readFile(req.file.path);
    // Simple import: expects sheets matching project names with _Summary, _Owner, _Sub, _Exp suffixes
    // For now, return the sheet names so frontend can handle mapping
    const sheetNames = wb.SheetNames;
    fs.unlinkSync(req.file.path);
    res.json({ sheets: sheetNames, message: 'File read. Use import-legacy.js for structured legacy import.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── START SERVER ─────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║  Construction Expense Tracker                            ║
║  Running on http://localhost:${PORT}                       ║
╠══════════════════════════════════════════════════════════╣
║  Quick Start:                                            ║
║  1. npm install                                          ║
║  2. npm start                                            ║
║  3. Open browser to http://localhost:${PORT}               ║
║  4. (Optional) npm run import  ← Import legacy Excel    ║
╚══════════════════════════════════════════════════════════╝
  `);
});
