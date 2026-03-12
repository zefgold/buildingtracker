import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

const buf = readFileSync('12 week LOA - Building C issues.xlsx');
const wb = XLSX.read(buf);

// Inspect main sheet fully
const ws = wb.Sheets['Bldg C 12WLOA'];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

console.log('Total rows main:', rows.length);
console.log('\n--- Rows 0-70 (cols 0-19) ---');
rows.slice(0, 70).forEach((r, i) => {
  const cells = r.slice(0, 20);
  if (cells.some(c => c !== '')) console.log('R' + i + ':', JSON.stringify(cells));
});

// CLOSED sheet
console.log('\n--- CLOSED sheet (cols 0-16) ---');
const wsC = wb.Sheets['CLOSED'];
const rowsC = XLSX.utils.sheet_to_json(wsC, { header: 1, defval: '' });
rowsC.slice(0, 3).forEach((r, i) => console.log('R' + i + ':', JSON.stringify(r.slice(0,16))));

