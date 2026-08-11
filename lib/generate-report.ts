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

  // ── Cost Breakdown structured panel ──
  let sy = 53;
  const costY = sectionTitle('Cost Breakdown', sy) + 4;

  const red: [number, number, number] = [220, 38, 38];
  const purple: [number, number, number] = [147, 51, 234];
  const green: [number, number, number] = [15, 118, 110];

  /** Draw a single breakdown row: label on left, amount on right. */
  function breakdownRow(label: string, amount: number, opts?: { bold?: boolean; color?: [number, number, number] }) {
    const y = (doc.lastAutoTable as any).finalY + 2;
    doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal');
    doc.setFontSize(9);
    if (opts?.color) {
      (doc.setTextColor as any)(...opts.color);
    } else {
      doc.setTextColor(...darkText);
    }
    doc.text(label, margin, y);
    doc.text(pdfCurrency(amount), pageWidth - margin, y, { align: 'right' });
    (doc as any).lastAutoTable = { finalY: y + 4 };
  }

  /** Draw a highlighted row with background fill. */
  function highlightRow(label: string, amount: number, opts?: { color?: [number, number, number]; bg?: [number, number, number] }) {
    const y = (doc.lastAutoTable as any).finalY + 1;
    const rowH = 7;

    if (opts?.bg) {
      (doc.setFillColor as any)(...opts.bg);
    } else {
      doc.setFillColor(248, 250, 252);
    }
    doc.rect(margin - 3, y - 2, contentWidth + 6, rowH, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    if (opts?.color) {
      (doc.setTextColor as any)(...opts.color);
    } else {
      doc.setTextColor(...darkText);
    }
    doc.text(label, margin, y + 1.5);
    doc.text(pdfCurrency(amount), pageWidth - margin, y + 1.5, { align: 'right' });

    (doc as any).lastAutoTable = { finalY: y + rowH };
  }

  // Initial Y tracker — used by breakdownRow / highlightRow
  // @ts-ignore – mutable tracker for Y position
  (doc as any).lastAutoTable = { finalY: costY - 2 };

  // ── Contractor costs ──
  breakdownRow('Subcontractor Payments', calcs.subCost);
  breakdownRow('Material Expenses', calcs.matCost);
  breakdownRow('Miscellaneous Expenses', calcs.miscCost);

  // Separator
  const sepY = (doc.lastAutoTable as any).finalY + 2;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, sepY, pageWidth - margin, sepY);
  (doc as any).lastAutoTable = { finalY: sepY };

  // Construction Cost by Contractor — bold red
  highlightRow('Construction Cost by Contractor', calcs.constructionCost, { color: red, bg: [254, 242, 242] });

  // Owner Direct
  breakdownRow('', 0); // spacer
  const odY = (doc.lastAutoTable as any).finalY + 1;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...darkText);
  doc.text('Owner Direct Payments', margin, odY);
  doc.text(pdfCurrency(calcs.directCost), pageWidth - margin, odY, { align: 'right' });
  (doc as any).lastAutoTable = { finalY: odY + 5 };

  // Total Project Cost — bold dark
  highlightRow('Total Project Cost (including owner direct)', calcs.totalProjectCost, { bg: [241, 245, 249] });

  // ── Cash Balance section ──
  const cbY = (doc.lastAutoTable as any).finalY + 8;
  sectionTitle('Cash Balance', cbY);

  (doc as any).lastAutoTable = { finalY: cbY + 8 };

  breakdownRow('Commission Paid', calcs.commissionPaid, { bold: true, color: purple });

  // Balance in Hand — highlighted green/red
  const balY = (doc.lastAutoTable as any).finalY + 3;
  highlightRow(
    'Balance in Hand (after commission)',
    Math.abs(calcs.balanceInHand),
    { color: calcs.balanceInHand >= 0 ? green : red, bg: [236, 253, 245] },
  );

  // ── Transaction tables ──
  let tableY = (doc.lastAutoTable as any).finalY + 10;

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
