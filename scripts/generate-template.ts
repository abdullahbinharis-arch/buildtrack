import * as XLSX from 'xlsx';
import * as path from 'path';

const OUTPUT = path.join(process.cwd(), 'BuildTrack_New_Project.xlsx');

/* ── Helper: create a styled worksheet ── */
function makeSheet(headers: string[], rows: unknown[][], colWidths: number[]) {
  const data = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Column widths
  ws['!cols'] = colWidths.map((w) => ({ wch: w }));

  // Row heights
  ws['!rows'] = data.map(() => ({ hpx: 22 }));

  // Style: header row
  const headerRange = XLSX.utils.decode_range(ws['!ref']!);
  for (let c = headerRange.s.c; c <= headerRange.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    if (ws[addr]) {
      ws[addr].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
        fill: { fgColor: { rgb: '1E40AF' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: 'CBD5E1' } },
          bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
          left: { style: 'thin', color: { rgb: 'CBD5E1' } },
          right: { style: 'thin', color: { rgb: 'CBD5E1' } },
        },
      };
    }
  }

  // Style: data rows
  for (let r = 1; r < data.length; r++) {
    for (let c = headerRange.s.c; c <= headerRange.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (ws[addr]) {
        ws[addr].s = {
          font: { sz: 10.5 },
          alignment: { vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: 'E2E8F0' } },
            bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
            left: { style: 'thin', color: { rgb: 'E2E8F0' } },
            right: { style: 'thin', color: { rgb: 'E2E8F0' } },
          },
        };
        if (r % 2 === 0) ws[addr].s.fill = { fgColor: { rgb: 'F8FAFC' } };
      }
    }
  }
  return ws;
}

const wb = XLSX.utils.book_new();

/* ── Sheet 1: Project Info ── */
wb.SheetNames.push('Project Info');
wb.Sheets['Project Info'] = makeSheet(
  ['Field', 'Value'],
  [
    ['Project Name', ''],
    ['Estimated Value (₹)', ''],
    ['Commission Rate (%)', '10'],
  ],
  [30, 30],
);

/* ── Sheet 2: Transactions ── */
wb.SheetNames.push('Transactions');
wb.Sheets['Transactions'] = makeSheet(
  ['Date (YYYY-MM-DD)', 'Amount (₹)', 'Type', 'Description'],
  [
    ['2026-07-01', 1000000, 'Owner Payment', ''],
    ['', '', 'Owner Direct', ''],
    ['', '', 'Subcontractor', ''],
    ['', '', 'Material', ''],
    ['', '', 'Commission Payout', ''],
    ['', '', '', ''],
    ['', '', '', ''],
    ['', '', '', ''],
    ['', '', '', ''],
    ['', '', '', ''],
    ['', '', '', ''],
    ['', '', '', ''],
    ['', '', '', ''],
    ['', '', '', ''],
    ['', '', '', ''],
    ['', '', '', ''],
    ['', '', '', ''],
    ['', '', '', ''],
    ['', '', '', ''],
    ['', '', '', ''],
  ],
  [22, 20, 24, 40],
);

/* ── Write ── */
XLSX.writeFile(wb, OUTPUT, { bookType: 'xlsx' });
console.log(`✅ Created: ${OUTPUT}`);
