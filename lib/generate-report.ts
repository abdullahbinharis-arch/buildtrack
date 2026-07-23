import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ProjectReportData {
  name: string;
  estimated_value: number;
  commission_rate: number;
  owner_payments: { id: string; date: string; amount: number }[];
  owner_direct_payments: { id: string; date: string; amount: number; description: string | null }[];
  subcontractor_payments: { id: string; date: string; amount: number; type: string; description: string | null }[];
  material_expenses: { id: string; date: string; amount: number; description: string | null }[];
  miscellaneous_expenses: { id: string; date: string; amount: number; description: string | null }[];
  commission_payouts: { id: string; date: string; amount: number; description: string | null }[];
}

// PDF-safe formatters (Helvetica only supports basic Latin characters)
function pdfCurrency(amount: number): string {
  return 'Rs.' + Math.round(amount).toLocaleString('en-IN');
}

function pdfDate(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
}

function getCalculations(data: ProjectReportData) {
  const received = data.owner_payments.reduce((s, p) => s + p.amount, 0);
  const directCost = data.owner_direct_payments.reduce((s, p) => s + p.amount, 0);
  const subCost = data.subcontractor_payments.reduce((s, p) => s + p.amount, 0);
  const matCost = data.material_expenses.reduce((s, p) => s + p.amount, 0);
  const miscCost = data.miscellaneous_expenses.reduce((s, p) => s + p.amount, 0);
  const totalCost = subCost + matCost + miscCost + directCost;
  const profit = received - (subCost + matCost + miscCost);
  const commissionReceivable = (totalCost * data.commission_rate) / 100;
  const commissionPaid = data.commission_payouts.reduce((s, p) => s + p.amount, 0);
  const commissionPayable = commissionReceivable - commissionPaid;
  return { received, directCost, subCost, matCost, miscCost, totalCost, profit, commissionReceivable, commissionPaid, commissionPayable };
}

export function generateProjectReport(data: ProjectReportData): jsPDF {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  const calcs = getCalculations(data);

  const brandColor: [number, number, number] = [79, 70, 229];
  const darkText: [number, number, number] = [30, 41, 59];
  const mutedText: [number, number, number] = [100, 116, 139];

  function sectionTitle(text: string, y: number) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...brandColor);
    doc.text(text, margin, y);
    doc.setDrawColor(...brandColor);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 1, pageWidth - margin, y + 1);
    return y + 8;
  }

  // ── Header ──
  doc.setFillColor(...brandColor);
  doc.rect(0, 0, pageWidth, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('BuildTrack', margin, 5.5);

  doc.setTextColor(...darkText);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('Project Financial Report', margin, 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...mutedText);
  doc.text('Project: ' + data.name, margin, 33);
  doc.text('Generated: ' + pdfDate(new Date().toISOString()), margin, 40);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, 46, pageWidth - margin, 46);

  // ── Summary boxes ──
  let sy = 53;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkText);

  const summaryItems = [
    { label: 'Contract Value', value: pdfCurrency(data.estimated_value) },
    { label: 'Amount Received', value: pdfCurrency(calcs.received) },
    { label: 'Total Cost', value: pdfCurrency(calcs.totalCost) },
    { label: 'Balance', value: pdfCurrency(Math.abs(calcs.profit)), prefix: calcs.profit >= 0 ? 'Profit: ' : 'Loss: ' },
    { label: 'Commission (' + data.commission_rate + '%)', value: pdfCurrency(Math.abs(calcs.commissionPayable)), prefix: calcs.commissionPayable >= 0 ? 'Receivable: ' : 'Payable: ' },
  ];

  const boxW = (contentWidth - 6) / 2;
  const boxH = 22;

  summaryItems.forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const bx = margin + col * (boxW + 6);
    const by = sy + row * (boxH + 4);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(bx, by, boxW, boxH, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...mutedText);
    doc.text(item.label, bx + 4, by + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    const prefix = item.prefix || '';
    const isPositive = item.label === 'Balance' ? calcs.profit >= 0 : true;
    doc.setTextColor(isPositive ? 15 : 220, isPositive ? 118 : 38, isPositive ? 110 : 38);
    doc.text(prefix + item.value, bx + 4, by + 18);
  });

  // ── Cost breakdown table ──
  sy = sy + 2 * (boxH + 4) + 12;
  const costY = sectionTitle('Cost Breakdown', sy) + 2;

  autoTable(doc, {
    startY: costY,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    body: [
      ['Subcontractor Payments', pdfCurrency(calcs.subCost)],
      ['Material Expenses', pdfCurrency(calcs.matCost)],
      ['Miscellaneous Expenses', pdfCurrency(calcs.miscCost)],
      ['Owner Direct Payments', pdfCurrency(calcs.directCost)],
      ['Total Cost', pdfCurrency(calcs.totalCost)],
    ],
    theme: 'plain',
    styles: { fontSize: 9, textColor: [30, 41, 59] as [number, number, number], cellPadding: { top: 2, bottom: 2, left: 0, right: 0 } },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.6 },
      1: { cellWidth: contentWidth * 0.4, halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.index === 4) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [220, 38, 38] as [number, number, number];
      }
    },
  });

  // ── Transaction tables ──
  let tableY = doc.lastAutoTable.finalY + 10;

  function addTable(
    title: string,
    rows: { date: string; amount: number; description?: string | null; type?: string }[],
    incomeCol: boolean,
  ) {
    if (rows.length === 0) return;
    if (tableY > 235) { doc.addPage(); tableY = margin + 5; }

    const secY = sectionTitle(title, tableY) + 2;

    autoTable(doc, {
      startY: secY,
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      head: [['Date', 'Type', 'Description', 'Amount']],
      body: rows.map((r) => [
        pdfDate(r.date),
        r.type || '',
        r.description || '',
        pdfCurrency(r.amount),
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: brandColor,
        fontSize: 8,
        fontStyle: 'bold',
        textColor: [255, 255, 255] as [number, number, number],
        cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
      },
      styles: {
        fontSize: 8,
        textColor: [30, 41, 59] as [number, number, number],
        cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
      },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 30 },
        2: { cellWidth: 'auto' as const },
        3: { cellWidth: 30, halign: 'right' as const },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
          data.cell.styles.textColor = incomeCol ? [15, 118, 110] as [number, number, number] : [220, 38, 38] as [number, number, number];
        }
      },
    });

    tableY = doc.lastAutoTable.finalY + 6;
  }

  tableY += 4;
  addTable('Payments Received', data.owner_payments, true);
  addTable('Owner Direct Payments', data.owner_direct_payments, false);
  addTable('Subcontractor Payments', data.subcontractor_payments, false);
  addTable('Material Expenses', data.material_expenses, false);
  addTable('Miscellaneous Expenses', data.miscellaneous_expenses, false);
  addTable('Commission Payouts', data.commission_payouts, false);

  // ── Page numbers ──
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'BuildTrack - ' + data.name + ' - Page ' + i + ' of ' + totalPages,
      margin,
      doc.internal.pageSize.getHeight() - 8,
    );
  }

  return doc;
}
