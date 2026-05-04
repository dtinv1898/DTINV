import * as XLSX from 'xlsx';

export interface PGSRow {
  perspective: string; // e.g. "External stakeholders", "Core Process"
  strategicObjective: string;
  measureNo: number | null;
  strategicMeasure: string;
  cyTarget: number | null;
  targets: {
    q1: number | null; q2: number | null; q3: number | null; q4: number | null;
    sem1: number | null; sem2: number | null;
    toDate: number | null;
  };
  accomplishments: {
    q1: number | null; q2: number | null; q3: number | null; q4: number | null;
    sem1: number | null; sem2: number | null;
    toDate: number | null;
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

export function parsePGSExcel(buffer: ArrayBuffer): PGSRow[] {
  const workbook = XLSX.read(buffer, { type: 'array' });

  const sheetName = workbook.SheetNames.find(
    (n) => n.toLowerCase().includes('nueva') || n.toLowerCase().includes('vizcaya')
  );
  if (!sheetName) throw new Error('No "Nueva Vizcaya" sheet found in the PGS file.');

  const sheet = workbook.Sheets[sheetName];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  const rows: PGSRow[] = [];
  let currentPerspective = '';
  let currentObjective = '';

  // PGS columns layout (0-indexed):
  // A(0)=perspective, B(1)=letter, C(2)=strategic objective, D(3)=no, E(4)=strategic measure
  // F(5)=CY target, G(6)=to-date target
  // H(7)=Q1 target, I(8)=Q2, J(9)=1st SEM, K(10)=Q3, L(11)=Q4, M(12)=2nd SEM
  // N(13)=to-date accomp, O(14)=Q1 accomp, P(15)=Q2, Q(16)=1st SEM, R(17)=Q3, S(18)=Q4, T(19)=2nd SEM
  // U(20)=% accomp
  // V(21)=Jan target, W(22)=Jan accomp, X(23)=Feb target, Y(24)=Feb accomp, Z(25)=Mar target, AA(26)=Mar accomp
  // AB(27)=Apr target, AC(28)=Apr accomp, ...

  // PGS data usually starts after row 7 (index 6 or 7)
  for (let i = 7; i < raw.length; i++) {
    const row = raw[i];
    if (!row || row.length < 6) continue;

    const colA = String(row[0] ?? '').trim();
    const colB = String(row[1] ?? '').trim();
    const colC = String(row[2] ?? '').trim();
    const measureNoRaw = String(row[3] ?? '').trim();
    const rawColE = String(row[4] ?? '');
    const colETrimmed = rawColE.trim();

    const lowerColA = colA.toLowerCase();
    const lowerColC = colC.toLowerCase();
    const lowerColE = colETrimmed.toLowerCase();

    const isGarbage = (text: string) => {
      const t = text.toLowerCase();
      return t.startsWith('date:') || 
             t.startsWith('prepared by:') || 
             t.startsWith('province:') ||
             t.includes('signature') ||
             t.includes('approved by') ||
             t.includes('noted by') ||
             t.includes('reviewed by') ||
             t.includes('provincial director') ||
             t.includes('division chief') ||
             t.includes('regional operations group') ||
             t.includes('region 02') ||
             t.includes('cy 2025') ||
             t === 'total' ||
             t === 'date';
    };

    if (isGarbage(lowerColA) || isGarbage(lowerColC) || isGarbage(lowerColE)) continue;

    // A row is valid if it has an objective letter (Col B), a measure number (Col D),
    // OR it has a meaningful strategic measure text in Col E (sub-measure rows have
    // neither a letter nor a number — only text in the measure column).
    const hasLetter = colB.length === 1 && /[A-Z]/i.test(colB);
    const hasNumber = measureNoRaw.length > 0 && !isNaN(Number(measureNoRaw));
    const hasSubMeasureText = !hasLetter && !hasNumber && colETrimmed.length >= 3;
    
    if (!hasLetter && !hasNumber && !hasSubMeasureText) continue;

    // Detect perspective
    if (colA && colA.length > 3 && !colA.match(/^\d/) && !isGarbage(lowerColA)) {
      currentPerspective = colA;
    }

    // Detect strategic objective
    if (colC && colC.length > 5) {
      currentObjective = colC;
    }

    // Strategic measure must be in column E
    if (!colETrimmed || colETrimmed.length < 3) continue;

    // Check if perspective is missing (merged cells issue), use the last known one
    if (!currentPerspective) continue;

    let colE = colETrimmed;
    if (!measureNoRaw) {
      // Indent sub-measures with non-breaking spaces
      colE = '\u00A0\u00A0\u00A0\u00A0' + colETrimmed;
    }

    rows.push({
      perspective: currentPerspective,
      strategicObjective: currentObjective,
      measureNo: toNum(row[3]),
      strategicMeasure: colE,
      cyTarget: toNum(row[5]),
      targets: {
        toDate: toNum(row[6]),
        q1: toNum(row[7]), q2: toNum(row[8]),
        sem1: toNum(row[9]),
        q3: toNum(row[10]), q4: toNum(row[11]),
        sem2: toNum(row[12]),
      },
      accomplishments: {
        toDate: toNum(row[13]),
        q1: toNum(row[14]), q2: toNum(row[15]),
        sem1: toNum(row[16]),
        q3: toNum(row[17]), q4: toNum(row[18]),
        sem2: toNum(row[19]),
      },
      monthly: {
        jan: { target: toNum(row[21]), accomp: toNum(row[22]) },
        feb: { target: toNum(row[23]), accomp: toNum(row[24]) },
        mar: { target: toNum(row[25]), accomp: toNum(row[26]) },
        apr: { target: toNum(row[27]), accomp: toNum(row[28]) },
        may: { target: toNum(row[29]), accomp: toNum(row[30]) },
        jun: { target: toNum(row[31]), accomp: toNum(row[32]) },
        jul: { target: toNum(row[33]), accomp: toNum(row[34]) },
        aug: { target: toNum(row[35]), accomp: toNum(row[36]) },
        sep: { target: toNum(row[37]), accomp: toNum(row[38]) },
        oct: { target: toNum(row[39]), accomp: toNum(row[40]) },
        nov: { target: toNum(row[41]), accomp: toNum(row[42]) },
        dec: { target: toNum(row[43]), accomp: toNum(row[44]) },
      },
      pctAccomp: (() => {
        const v = toNum(row[20]);
        if (v === null) return null;
        return v;
      })(),
    });
  }

  return rows;
}
