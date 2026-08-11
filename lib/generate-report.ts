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
  const commissionPaid = data.commission_payouts.reduce((s, p) => s + p.amount, 0);

  const constructionCost = subCost + matCost + miscCost;
  const totalProjectCost = constructionCost + directCost;
  const balanceInHand = received - constructionCost - commissionPaid;

  return { received, directCost, subCost, matCost, miscCost, constructionCost, totalProjectCost, commissionPaid, balanceInHand };
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

  // ── Cost Breakdown ──
  let yPos = 53;
  yPos = sectionTitle('Cost Breakdown', yPos) + 4;

  function setRgb(r: number, g: number, b: number): void {
    doc.setTextColor(r, g, b);
  }
  function setFillRgb(r: number, g: number, b: number): void {
    doc.setFillColor(r, g, b);
  }

  function breakdownRow(label: string, amount: number, opts?: { bold?: boolean; color?: [number, number, number]; bg?: [number, number, number] }) {
    const y = yPos + 3;
    const rowH = opts?.bg ? 8 : 5;

    if (opts?.bg) {
      setFillRgb(opts.bg[0], opts.bg[1], opts.bg[2]);
      doc.rect(margin - 2, y - 2, contentWidth + 4, rowH, 'F');
    }

    doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal');
    doc.setFontSize(10);
    if (opts?.color) {
      setRgb(opts.color[0], opts.color[1], opts.color[2]);
    } else {
      doc.setTextColor(...darkText);
    }
    doc.text(label, margin, y + 1);
    doc.text(pdfCurrency(amount), pageWidth - margin, y + 1, { align: 'right' });
    yPos = y + rowH;
  }

  function drawSeparator() {
    yPos += 2;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 1;
  }

  breakdownRow('Subcontractor Payments', calcs.subCost);
  breakdownRow('Material Expenses', calcs.matCost);
  breakdownRow('Miscellaneous Expenses', calcs.miscCost);
  breakdownRow('Owner Direct Payments', calcs.directCost);

  drawSeparator();

  // Total Project Cost — bold
  breakdownRow('Total Project Cost', calcs.totalProjectCost, { bold: true, bg: [245, 245, 250] });
  yPos += 4;

  // ── Cash Balance Breakdown ──
  yPos += 6;
  yPos = sectionTitle('Cash Balance Breakdown', yPos) + 4;

  const red: [number, number, number] = [180, 30, 30];
  const green: [number, number, number] = [15, 118, 110];

  // Total Received (income/green)
  breakdownRow('Total Received Payments', calcs.received, { bold: true, color: green });

  // Expenses paid by contractor (sub + mat + misc in red)
  breakdownRow('Expenses Paid by Contractor', calcs.constructionCost, { color: red });

  drawSeparator();

  // Commission Paid
  breakdownRow('Commission Paid', calcs.commissionPaid, { bold: true, color: red });

  // Balance in Hand — highlighted
  const balLabel = calcs.balanceInHand >= 0 ? 'Balance in Hand' : 'Deficit';
  breakdownRow(balLabel, Math.abs(calcs.balanceInHand), {
    bold: true,
    color: calcs.balanceInHand >= 0 ? green : red,
    bg: [240, 253, 244],
  });

  yPos += 6;

  // ── Transaction tables ──
  // Dummy autoTable to initialise lastAutoTable for the table functions below
  autoTable(doc, { startY: 0, body: [], theme: 'plain' });
  const tablesStartY = yPos + 4;
  autoTable(doc, { startY: tablesStartY, body: [], theme: 'plain' });
  let tableY = tablesStartY;

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
