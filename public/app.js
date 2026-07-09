const app = {
  projects: [],
  currentProject: null,
  currentTab: 'owner',

  init() {
    this.loadProjects();
    document.getElementById('tx-date').value = new Date().toISOString().split('T')[0];
  },

  async api(method, endpoint, body = null) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`/api${endpoint}`, opts);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async loadProjects() {
    try {
      this.projects = await this.api('GET', '/projects');
      this.renderDashboard();
      this.renderStats();
    } catch (e) {
      this.showToast('Error loading projects: ' + e.message, 'error');
    }
  },

  renderDashboard() {
    const grid = document.getElementById('projects-grid');
    if (this.projects.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 p-12 text-center backdrop-blur-xl">
          <div class="mb-4 text-5xl">🏗️</div>
          <h3 class="text-lg font-bold text-slate-900">No Projects Yet</h3>
          <p class="mx-auto mt-2 max-w-sm text-sm text-slate-500">Create your first project to start tracking expenses and payments.</p>
          <button class="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-brand-500/25 transition hover:bg-brand-700" onclick="app.showNewProjectModal()">+ New Project</button>
        </div>`;
      return;
    }

    grid.innerHTML = this.projects.map(p => {
      const statusClass = p.status === 'active'
        ? 'bg-emerald-50 text-emerald-600 ring-emerald-100'
        : 'bg-slate-100 text-slate-600 ring-slate-200';
      const totalIn = p.total_owner_payments || 0;
      const totalCost = p.total_cost || 0;
      const max = Math.max(totalIn, totalCost, p.contract_value || 0) || 1;
      const progress = Math.min(100, (totalCost / max) * 100);
      const profitClass = p.profit_loss >= 0
        ? 'bg-emerald-50 text-emerald-600'
        : 'bg-rose-50 text-rose-600';
      return `
        <div class="group cursor-pointer rounded-2xl border border-white/70 bg-white/55 p-5 shadow-glass backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/70 hover:shadow-elevated" onclick="app.openProject('${p.id}')">
          <div class="flex items-start justify-between">
            <h3 class="text-lg font-bold text-slate-900">${this.escape(p.name)}</h3>
            <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ring-1 ${statusClass}">${p.status}</span>
          </div>
          <div class="mt-2 flex items-center gap-1 text-sm text-slate-500">📍 ${this.escape(p.location || 'No location')}</div>

          <div class="mt-5 grid grid-cols-3 gap-3">
            <div class="rounded-xl bg-slate-50/80 p-3 text-center">
              <div class="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500">Contract</div>
              <div class="mt-1 text-sm font-bold text-slate-900">₹${this.formatNumber(p.contract_value || 0)}</div>
            </div>
            <div class="rounded-xl bg-emerald-50/60 p-3 text-center">
              <div class="text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-600">Received</div>
              <div class="mt-1 text-sm font-bold text-emerald-700">₹${this.formatNumber(totalIn)}</div>
            </div>
            <div class="rounded-xl bg-rose-50/60 p-3 text-center">
              <div class="text-[0.65rem] font-semibold uppercase tracking-wide text-rose-600">Cost</div>
              <div class="mt-1 text-sm font-bold text-rose-700">₹${this.formatNumber(totalCost)}</div>
            </div>
          </div>

          <div class="mt-5 flex items-center justify-between gap-4">
            <div class="flex-1">
              <div class="mb-1 flex justify-between text-[0.65rem] font-semibold uppercase text-slate-500">
                <span>Cost vs received</span>
                <span>${progress.toFixed(0)}%</span>
              </div>
              <div class="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div class="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all" style="width:${progress}%"></div>
              </div>
            </div>
            <div class="rounded-full px-3 py-1 text-xs font-bold ${profitClass}">
              ${p.profit_loss >= 0 ? 'Profit' : 'Loss'}: ₹${this.formatNumber(Math.abs(p.profit_loss))}
            </div>
          </div>
        </div>`;
    }).join('');
  },

  renderStats() {
    const active = this.projects.filter(p => p.status === 'active').length;
    const revenue = this.projects.reduce((s, p) => s + (p.total_owner_payments || 0), 0);
    const expenses = this.projects.reduce((s, p) => s + (p.total_cost || 0), 0);
    const profit = revenue - expenses;

    document.getElementById('stat-projects').textContent = active;
    document.getElementById('stat-revenue').textContent = '₹' + this.formatNumber(revenue);
    document.getElementById('stat-expenses').textContent = '₹' + this.formatNumber(expenses);
    const profitEl = document.getElementById('stat-profit');
    profitEl.textContent = (profit >= 0 ? '+' : '-') + '₹' + this.formatNumber(Math.abs(profit));
    profitEl.className = 'text-2xl font-bold ' + (profit >= 0 ? 'text-emerald-600' : 'text-rose-600');
  },

  async openProject(id) {
    try {
      this.currentProject = await this.api('GET', `/projects/${id}`);
      this.currentTab = 'owner';
      this.showView('project-view');
      this.renderProjectHeader();
      this.renderFinancialSummary();
      this.renderCostSplitChart();
      this.switchTab('owner');
    } catch (e) {
      this.showToast('Error opening project: ' + e.message, 'error');
    }
  },

  renderProjectHeader() {
    const p = this.currentProject;
    document.getElementById('project-name').textContent = p.name;
    document.getElementById('project-location').textContent = '📍 ' + (p.location || 'No location');
    const statusEl = document.getElementById('project-status');
    statusEl.textContent = p.status;
    statusEl.className = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ring-1 ' +
      (p.status === 'active' ? 'bg-emerald-50 text-emerald-600 ring-emerald-100' : 'bg-slate-100 text-slate-600 ring-slate-200');
  },

  renderFinancialSummary() {
    const p = this.currentProject;
    const ownerTotal = p.owner_payments.reduce((s, x) => s + x.amount, 0);
    const subTotal = p.subcontractor_payments.reduce((s, x) => s + x.amount, 0);
    const expTotal = p.site_expenses.reduce((s, x) => s + x.amount, 0);
    const totalCost = subTotal + expTotal;
    const profit = ownerTotal - totalCost;
    const remaining = (p.contract_value || 0) - ownerTotal;

    document.getElementById('fin-contract').textContent = '₹' + this.formatNumber(p.contract_value || 0);
    document.getElementById('fin-received').textContent = '₹' + this.formatNumber(ownerTotal);
    document.getElementById('fin-sub').textContent = '₹' + this.formatNumber(subTotal);
    document.getElementById('fin-expenses').textContent = '₹' + this.formatNumber(expTotal);
    document.getElementById('fin-total-cost').textContent = '₹' + this.formatNumber(totalCost);
    const profitEl = document.getElementById('fin-profit');
    profitEl.textContent = (profit >= 0 ? '+' : '-') + '₹' + this.formatNumber(Math.abs(profit));
    profitEl.className = 'mt-1 text-lg font-bold ' + (profit >= 0 ? 'text-emerald-600' : 'text-rose-600');
    document.getElementById('fin-remaining').textContent = '₹' + this.formatNumber(Math.max(0, remaining));
  },

  renderCostSplitChart() {
    const p = this.currentProject;
    const subTotal = p.subcontractor_payments.reduce((s, x) => s + x.amount, 0);
    const expTotal = p.site_expenses.reduce((s, x) => s + x.amount, 0);
    const total = subTotal + expTotal;
    const container = document.getElementById('cost-split-chart');
    if (!total) {
      container.innerHTML = '';
      return;
    }
    const subPct = (subTotal / total) * 100;
    const expPct = (expTotal / total) * 100;
    const subDash = `${subPct * 2.513} ${100 * 2.513}`;
    const expDash = `${expPct * 2.513} ${100 * 2.513}`;
    const expOffset = -subPct * 2.513;
    container.innerHTML = `
      <div class="rounded-2xl border border-white/70 bg-white/55 p-5 shadow-glass backdrop-blur-xl">
        <h4 class="mb-4 text-sm font-semibold text-slate-700">Cost Split</h4>
        <div class="flex flex-col items-center gap-5 sm:flex-row">
          <svg class="h-28 w-28 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" stroke-width="14"/>
            <circle cx="60" cy="60" r="50" fill="none" stroke="#f59e0b" stroke-width="14" stroke-dasharray="${subDash}" stroke-linecap="round"/>
            <circle cx="60" cy="60" r="50" fill="none" stroke="#f43f5e" stroke-width="14" stroke-dasharray="${expDash}" stroke-dashoffset="${expOffset}" stroke-linecap="round"/>
          </svg>
          <div class="flex w-full flex-col gap-2 sm:w-auto">
            <div class="flex items-center justify-between gap-6 text-sm">
              <div class="flex items-center gap-2">
                <span class="h-3 w-3 rounded-full bg-amber-500"></span>
                <span class="text-slate-600">Subcontractor</span>
              </div>
              <span class="font-bold text-slate-900">₹${this.formatNumber(subTotal)}</span>
            </div>
            <div class="flex items-center justify-between gap-6 text-sm">
              <div class="flex items-center gap-2">
                <span class="h-3 w-3 rounded-full bg-rose-500"></span>
                <span class="text-slate-600">Site Expenses</span>
              </div>
              <span class="font-bold text-slate-900">₹${this.formatNumber(expTotal)}</span>
            </div>
            <div class="mt-1 border-t border-slate-100 pt-2 text-sm">
              <div class="flex items-center justify-between gap-6">
                <span class="text-slate-500">Total Cost</span>
                <span class="font-bold text-slate-900">₹${this.formatNumber(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  },

  switchTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `tab-${tab}`);
    });
    this.renderCurrentTab();
  },

  renderCurrentTab() {
    const p = this.currentProject;
    if (!p) return;

    if (this.currentTab === 'owner') {
      const tbody = document.getElementById('owner-table-body');
      const items = [...p.owner_payments].sort((a, b) => new Date(a.date) - new Date(b.date));
      tbody.innerHTML = items.length === 0
        ? '<tr><td colspan="4" class="empty-cell">No payments recorded yet</td></tr>'
        : items.map(item => `
          <tr>
            <td>${this.formatDate(item.date)}</td>
            <td class="font-semibold text-slate-900">₹${this.formatNumber(item.amount)}</td>
            <td class="text-slate-600">${this.escape(item.notes || '-')}</td>
            <td class="text-right">
              <button class="text-sm font-medium text-brand-600 hover:text-brand-700" onclick="event.stopPropagation();app.editTransaction('owner','${item.id}')">Edit</button>
              <span class="mx-2 text-slate-300">|</span>
              <button class="text-sm font-medium text-rose-600 hover:text-rose-700" onclick="event.stopPropagation();app.deleteTransaction('owner','${item.id}')">Delete</button>
            </td>
          </tr>
        `).join('');
      document.getElementById('owner-total').textContent = '₹' + this.formatNumber(items.reduce((s, x) => s + x.amount, 0));
    }

    if (this.currentTab === 'subcontractor') {
      const tbody = document.getElementById('subcontractor-table-body');
      const items = [...p.subcontractor_payments].sort((a, b) => new Date(a.date) - new Date(b.date));
      tbody.innerHTML = items.length === 0
        ? '<tr><td colspan="6" class="empty-cell">No subcontractor payments recorded yet</td></tr>'
        : items.map(item => `
          <tr>
            <td>${this.formatDate(item.date)}</td>
            <td class="font-medium text-slate-900">${this.escape(item.subcontractor_name)}</td>
            <td><span class="inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${item.type === 'Labour' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}">${item.type}</span></td>
            <td class="font-semibold text-slate-900">₹${this.formatNumber(item.amount)}</td>
            <td class="text-slate-600">${this.escape(item.notes || '-')}</td>
            <td class="text-right">
              <button class="text-sm font-medium text-brand-600 hover:text-brand-700" onclick="event.stopPropagation();app.editTransaction('subcontractor','${item.id}')">Edit</button>
              <span class="mx-2 text-slate-300">|</span>
              <button class="text-sm font-medium text-rose-600 hover:text-rose-700" onclick="event.stopPropagation();app.deleteTransaction('subcontractor','${item.id}')">Delete</button>
            </td>
          </tr>
        `).join('');
      document.getElementById('subcontractor-total').textContent = '₹' + this.formatNumber(items.reduce((s, x) => s + x.amount, 0));
    }

    if (this.currentTab === 'expenses') {
      const tbody = document.getElementById('expenses-table-body');
      const items = [...p.site_expenses].sort((a, b) => new Date(a.date) - new Date(b.date));
      const catColors = {
        materials: 'bg-emerald-50 text-emerald-600',
        tools: 'bg-indigo-50 text-indigo-600',
        transport: 'bg-pink-50 text-pink-600',
        food: 'bg-orange-50 text-orange-600',
        labour: 'bg-blue-50 text-blue-600',
        other: 'bg-slate-100 text-slate-600',
      };
      tbody.innerHTML = items.length === 0
        ? '<tr><td colspan="6" class="empty-cell">No expenses recorded yet</td></tr>'
        : items.map(item => {
            const cls = catColors[item.category.toLowerCase().replace(/\s+/g, '')] || catColors.other;
            return `
          <tr>
            <td>${this.formatDate(item.date)}</td>
            <td class="font-medium text-slate-900">${this.escape(item.description)}</td>
            <td><span class="inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${cls}">${item.category}</span></td>
            <td class="text-slate-600">${this.escape(item.vendor || '-')}</td>
            <td class="font-semibold text-slate-900">₹${this.formatNumber(item.amount)}</td>
            <td class="text-right">
              <button class="text-sm font-medium text-brand-600 hover:text-brand-700" onclick="event.stopPropagation();app.editTransaction('expenses','${item.id}')">Edit</button>
              <span class="mx-2 text-slate-300">|</span>
              <button class="text-sm font-medium text-rose-600 hover:text-rose-700" onclick="event.stopPropagation();app.deleteTransaction('expenses','${item.id}')">Delete</button>
            </td>
          </tr>`;
          }).join('');
      document.getElementById('expenses-total').textContent = '₹' + this.formatNumber(items.reduce((s, x) => s + x.amount, 0));
    }
  },

  async createProject(e) {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    data.contract_value = Number(data.contract_value) || 0;
    try {
      await this.api('POST', '/projects', data);
      this.closeModal('project');
      form.reset();
      await this.loadProjects();
      this.showToast('Project created successfully!', 'success');
    } catch (err) {
      this.showToast('Error: ' + err.message, 'error');
    }
  },

  async saveTransaction(e) {
    e.preventDefault();
    const form = e.target;
    const type = document.getElementById('transaction-type').value;
    const editId = document.getElementById('edit-id').value;
    const data = Object.fromEntries(new FormData(form));
    data.amount = Number(data.amount) || 0;

    const endpoint = editId
      ? `/projects/${this.currentProject.id}/${type}-payments/${editId}`
      : `/projects/${this.currentProject.id}/${type}-payments`;
    const method = editId ? 'PUT' : 'POST';

    if (type === 'owner') {
      delete data.subcontractor_name; delete data.type; delete data.description;
      delete data.category; delete data.vendor;
    } else if (type === 'subcontractor') {
      delete data.description; delete data.category; delete data.vendor;
    } else if (type === 'expenses') {
      delete data.subcontractor_name; delete data.type; delete data.notes;
    }

    try {
      await this.api(method, endpoint, data);
      this.closeModal('transaction');
      form.reset();
      document.getElementById('tx-date').value = new Date().toISOString().split('T')[0];
      this.currentProject = await this.api('GET', `/projects/${this.currentProject.id}`);
      this.renderFinancialSummary();
      this.renderCostSplitChart();
      this.renderCurrentTab();
      this.showToast(editId ? 'Updated!' : 'Saved!', 'success');
    } catch (err) {
      this.showToast('Error: ' + err.message, 'error');
    }
  },

  async deleteTransaction(type, id) {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    try {
      await this.api('DELETE', `/projects/${this.currentProject.id}/${type}-payments/${id}`);
      this.currentProject = await this.api('GET', `/projects/${this.currentProject.id}`);
      this.renderFinancialSummary();
      this.renderCostSplitChart();
      this.renderCurrentTab();
      this.showToast('Deleted!', 'success');
    } catch (err) {
      this.showToast('Error: ' + err.message, 'error');
    }
  },

  async deleteProject() {
    if (!confirm('Are you sure you want to delete this entire project? This cannot be undone.')) return;
    try {
      await this.api('DELETE', `/projects/${this.currentProject.id}`);
      this.showDashboard();
      await this.loadProjects();
      this.showToast('Project deleted!', 'success');
    } catch (err) {
      this.showToast('Error: ' + err.message, 'error');
    }
  },

  editTransaction(type, id) {
    const p = this.currentProject;
    let item;
    if (type === 'owner') item = p.owner_payments.find(x => x.id === id);
    else if (type === 'subcontractor') item = p.subcontractor_payments.find(x => x.id === id);
    else item = p.site_expenses.find(x => x.id === id);

    if (!item) return;

    this.setupTransactionForm(type);
    document.getElementById('edit-id').value = id;
    document.getElementById('tx-date').value = item.date;

    if (type === 'owner') {
      document.querySelector('#fields-owner input[name="amount"]').value = item.amount;
      document.querySelector('#fields-owner input[name="notes"]').value = item.notes || '';
    } else if (type === 'subcontractor') {
      document.querySelector('#fields-subcontractor input[name="subcontractor_name"]').value = item.subcontractor_name;
      document.querySelector('#fields-subcontractor select[name="type"]').value = item.type;
      document.querySelector('#fields-subcontractor input[name="amount"]').value = item.amount;
      document.querySelector('#fields-subcontractor input[name="notes"]').value = item.notes || '';
    } else {
      document.querySelector('#fields-expenses input[name="description"]').value = item.description;
      document.querySelector('#fields-expenses select[name="category"]').value = item.category;
      document.querySelector('#fields-expenses input[name="vendor"]').value = item.vendor || '';
      document.querySelector('#fields-expenses input[name="amount"]').value = item.amount;
    }

    document.getElementById('transaction-modal-title').textContent = 'Edit Entry';
    this.showModal('transaction');
  },

  setupTransactionForm(type) {
    document.getElementById('transaction-type').value = type;
    document.getElementById('edit-id').value = '';
    document.getElementById('form-transaction').reset();
    document.getElementById('tx-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('fields-owner').classList.toggle('hidden', type !== 'owner');
    document.getElementById('fields-subcontractor').classList.toggle('hidden', type !== 'subcontractor');
    document.getElementById('fields-expenses').classList.toggle('hidden', type !== 'expenses');
    const titles = { owner: 'Add Owner Payment', subcontractor: 'Add Subcontractor Payment', expenses: 'Add Site Expense' };
    document.getElementById('transaction-modal-title').textContent = titles[type];
  },

  showNewProjectModal() {
    document.getElementById('form-project').reset();
    document.querySelector('#form-project input[name="start_date"]').value = new Date().toISOString().split('T')[0];
    this.showModal('project');
  },

  showModal(name) {
    document.getElementById(`modal-${name}`).classList.add('active');
  },

  closeModal(name) {
    document.getElementById(`modal-${name}`).classList.remove('active');
    if (name === 'transaction') {
      document.getElementById('edit-id').value = '';
      document.getElementById('transaction-modal-title').textContent = 'Add Entry';
    }
  },

  showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    window.scrollTo(0, 0);
  },

  showDashboard() {
    this.currentProject = null;
    this.showView('dashboard-view');
    this.loadProjects();
  },

  async exportAll() {
    try {
      const res = await fetch('/api/export/all');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Construction_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      this.showToast('Export downloaded!', 'success');
    } catch (e) {
      this.showToast('Export failed: ' + e.message, 'error');
    }
  },

  async exportProject() {
    if (!this.currentProject) return;
    try {
      const res = await fetch(`/api/export/${this.currentProject.id}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.currentProject.name}_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      this.showToast('Project exported!', 'success');
    } catch (e) {
      this.showToast('Export failed: ' + e.message, 'error');
    }
  },

  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast fixed right-4 top-4 z-[300] translate-x-[120%] rounded-xl px-4 py-3 text-sm font-medium text-white shadow-elevated transition-transform duration-300 ${type}`;
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => toast.classList.remove('show'), 3000);
  },

  formatNumber(n) {
    return n.toLocaleString('en-IN');
  },

  formatDate(d) {
    if (!d) return '-';
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  },

  escape(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

document.addEventListener('DOMContentLoaded', () => app.init());
