import * as XLSX from 'xlsx';

export interface ParsedPerson {
  name: string;
  division: string;
}

export interface ParsedMotherActivity {
  organizational_outcome: string;
  activity: string;
  date_of_implementation: string;
  indicator: string;
  responsible_person_name: string;
  monthly_targets: {
    jan: number; feb: number; mar: number; apr: number; may: number; jun: number;
    jul: number; aug: number; sep: number; oct: number; nov: number; dec: number;
    total: number;
  };
}

function toNum(val: unknown): number {
  if (val === null || val === undefined || val === '' || val === '-') return 0;
  const s = String(val).replace(/,/g, '').trim();
  if (s === '' || s === '-' || s === 'TBA' || s === 'ATC') return 0;
  const n = Number(s);
  return isNaN(n) ? 0 : n;
}

export function parseMotherExcel(buffer: ArrayBuffer): ParsedPerson[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const persons: ParsedPerson[] = [];
  const seen = new Set<string>();

  // Try DETAILED MOTHER sheet first
  const detailedSheet = workbook.SheetNames.find(s => s.toUpperCase().includes('DETAILED MOTHER'));
  const sheetName = detailedSheet || workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  // Column E (index 4) = Responsible Person in DETAILED MOTHER
  for (let i = 10; i < raw.length; i++) {
    const row = raw[i];
    if (!row) continue;
    const personName = String(row[4] ?? '').trim();
    if (!personName || personName.length < 2 || /^\d+$/.test(personName)) continue;
    // Skip aggregate labels
    if (personName.toLowerCase().includes('please refer') || personName.toLowerCase().includes('division of targets')) continue;

    const key = personName.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      persons.push({ name: personName, division: 'BDD' });
    }
  }

  return persons;
}

export function parseMotherActivities(buffer: ArrayBuffer): ParsedMotherActivity[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const detailedSheet = workbook.SheetNames.find(s => s.toUpperCase().includes('DETAILED MOTHER'));
  const sheetName = detailedSheet || workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  const activities: ParsedMotherActivity[] = [];
  let currentOO = '';
  let currentIndicator = '';

  for (let i = 10; i < raw.length; i++) {
    const row = raw[i];
    if (!row) continue;

    const colA = String(row[0] ?? '').trim();
    const colB = String(row[1] ?? '').trim();
    const colC = String(row[2] ?? '').trim();
    const colD = String(row[3] ?? '').trim();
    const colE = String(row[4] ?? '').trim();

    // Detect OO header from column A
    if (colA.match(/^OO[1-4]/i)) {
      currentOO = colA;
      continue;
    }
    // OO marker in column B (e.g., "OO2", "OO3")
    if (colB.match(/^OO[1-4]$/i) && !colC) {
      continue;
    }

    // Track indicators from column D
    if (colD && colD.length > 5) {
      currentIndicator = colD;
    }

    // Skip rows without activity name
    if (!colB || colB.length < 3) continue;

    // Skip header/summary rows
    if (colB.match(/^(OO[1-4]|TOTAL|GRAND|SUB-TOTAL)/i)) continue;

    // Monthly targets: columns F(5)=Jan through Q(16)=Dec, R(17)=Total
    // DETAILED MOTHER: C6=Jan, C7=Feb, ... C17=Dec, C18=Total (0-indexed: 5-17)
    const jan = toNum(row[5]);
    const feb = toNum(row[6]);
    const mar = toNum(row[7]);
    const apr = toNum(row[8]);
    const may = toNum(row[9]);
    const jun = toNum(row[10]);
    const jul = toNum(row[11]);
    const aug = toNum(row[12]);
    const sep = toNum(row[13]);
    const oct = toNum(row[14]);
    const nov = toNum(row[15]);
    const dec = toNum(row[16]);
    const total = toNum(row[17]);

    const hasData = jan || feb || mar || apr || may || jun || jul || aug || sep || oct || nov || dec || total;

    // Only add if there's a responsible person or meaningful data
    if (colE && colE.length >= 2 && !colE.toLowerCase().includes('please refer') && hasData) {
      activities.push({
        organizational_outcome: currentOO,
        activity: colB,
        date_of_implementation: colC,
        indicator: colD || currentIndicator,
        responsible_person_name: colE,
        monthly_targets: { jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec, total },
      });
    }
  }

  return activities;
}
