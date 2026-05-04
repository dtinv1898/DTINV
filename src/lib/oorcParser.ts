import * as XLSX from 'xlsx';

export interface OORCRow {
  category: string; // Outcome or Output
  oo: string; // e.g. "OO1: Exports and investments increased"
  program: string;
  indicator: string;
  annualTarget: number | null;
  toDateTarget: number | null;
  targets: {
    q1: number | null; q2: number | null; q3: number | null; q4: number | null;
    sem1: number | null; sem2: number | null;
  };
  accomplishments: {
    toDate: number | null;
    q1: number | null; q2: number | null; q3: number | null; q4: number | null;
    sem1: number | null; sem2: number | null;
  };
  monthly: {
    jan: { target: number | null; accomp: number | null };
    feb: { target: number | null; accomp: number | null };
    mar: { target: number | null; accomp: number | null };
    apr: { target: number | null; accomp: number | null };
    may: { target: number | null; accomp: number | null };
    jun: { target: number | null; accomp: number | null };
    jul: { target: number | null; accomp: number | null };
    aug: { target: number | null; accomp: number | null };
    sep: { target: number | null; accomp: number | null };
    oct: { target: number | null; accomp: number | null };
    nov: { target: number | null; accomp: number | null };
    dec: { target: number | null; accomp: number | null };
  };
  pctAccomp: number | null;
}

function toNum(val: unknown): number | null {
  if (val === null || val === undefined || val === '' || val === '-') return null;
  const s = String(val).replace(/,/g, '').trim();
  if (s === '' || s === '-' || s === 'TBA' || s === 'ATC' || s.includes('#DIV')) return null;
  const n = Number(s);
  return isNaN(n) ? null : n;
}

export function parseOORCExcel(buffer: ArrayBuffer): OORCRow[] {
  const workbook = XLSX.read(buffer, { type: 'array' });

  // Find Nueva Vizcaya sheet
  const sheetName = workbook.SheetNames.find(
    (n) => n.toLowerCase().includes('nueva') || n.toLowerCase().includes('vizcaya')
  );
  if (!sheetName) throw new Error('No "Nueva Vizcaya" sheet found in the OORC file.');

  const sheet = workbook.Sheets[sheetName];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  const rows: OORCRow[] = [];
  let currentOO = '';
  let currentProgram = '';
  let currentCategory = '';

  // Data starts after header rows — scan all rows (usually row 8+, index 7)
  for (let i = 7; i < raw.length; i++) {
    const row = raw[i];
    if (!row || row.length < 2) continue;

    const colA = String(row[0] ?? '').trim();
    const colB = String(row[1] ?? '').trim();

    // Detect OO header
    if (colA.match(/^OO\d/i)) {
      currentOO = colA;
      continue;
    }

    // Detect program header
    if (colA.match(/PROGRAM$/i) || colA.match(/PROGRAM\s*$/i)) {
      currentProgram = colA;
      continue;
    }

    // Detect category
    if (colA === 'Outcome' || colA === 'Output') {
      currentCategory = colA;
    }

    // Skip rows that look like labels or footers
    const lowerColA = colA.toLowerCase();
    const lowerColB = colB.toLowerCase();
    
    const isGarbage = (text: string) => {
      return text.startsWith('date:') || 
             text.startsWith('prepared by:') || 
             text.startsWith('province:') ||
             text.includes('signature') ||
             text.includes('approved by') ||
             text.includes('noted by') ||
             text.includes('reviewed by') ||
             text.includes('provincial director') ||
             text.includes('division chief') ||
             text === 'total' ||
             text === 'date';
    };

    if (isGarbage(lowerColA) || isGarbage(lowerColB)) continue;

    // Skip rows without indicator text in column B
    if (!colB || colB.length < 2) continue;

    // Check if row has any numeric data (Removed to include all indicators as per user request)
    // const hasData = row.slice(2, 42).some((v) => toNum(v) !== null);
    // if (!hasData) continue;

    // OORC columns layout:
    // B(1)=indicator, C(2)=annual target, D(3)=to-date target
    // E(4)=Q1 target, F(5)=Q2 target, G(6)=1st SEM target, H(7)=Q3 target, I(8)=Q4 target, J(9)=2nd SEM target
    // K(10)=to-date accomp, L(11)=Q1 accomp, M(12)=Q2 accomp, N(13)=1st SEM accomp, O(14)=Q3 accomp, P(15)=Q4 accomp, Q(16)=2nd SEM accomp
    // R(17)=% accomp
    // S(18)=Jan target, T(19)=Jan accomp, U(20)=Feb target, V(21)=Feb accomp, ...

    rows.push({
      category: currentCategory || (colA === 'Outcome' || colA === 'Output' ? colA : ''),
      oo: currentOO,
      program: currentProgram,
      indicator: colB,
      annualTarget: toNum(row[2]),
      toDateTarget: toNum(row[3]),
      targets: {
        q1: toNum(row[4]), q2: toNum(row[5]),
        sem1: toNum(row[6]),
        q3: toNum(row[7]), q4: toNum(row[8]),
        sem2: toNum(row[9]),
      },
      accomplishments: {
        toDate: toNum(row[10]),
        q1: toNum(row[11]), q2: toNum(row[12]),
        sem1: toNum(row[13]),
        q3: toNum(row[14]), q4: toNum(row[15]),
        sem2: toNum(row[16]),
      },
      monthly: {
        jan: { target: toNum(row[18]), accomp: toNum(row[19]) },
        feb: { target: toNum(row[20]), accomp: toNum(row[21]) },
        mar: { target: toNum(row[22]), accomp: toNum(row[23]) },
        apr: { target: toNum(row[24]), accomp: toNum(row[25]) },
        may: { target: toNum(row[26]), accomp: toNum(row[27]) },
        jun: { target: toNum(row[28]), accomp: toNum(row[29]) },
        jul: { target: toNum(row[30]), accomp: toNum(row[31]) },
        aug: { target: toNum(row[32]), accomp: toNum(row[33]) },
        sep: { target: toNum(row[34]), accomp: toNum(row[35]) },
        oct: { target: toNum(row[36]), accomp: toNum(row[37]) },
        nov: { target: toNum(row[38]), accomp: toNum(row[39]) },
        dec: { target: toNum(row[40]), accomp: toNum(row[41]) },
      },
      pctAccomp: (() => {
        const v = toNum(row[17]);
        if (v === null) return null;
        // Ensure stored as fraction (0.21) not percent (21.0)
        return v;
      })(),
    });
  }

  return rows;
}
