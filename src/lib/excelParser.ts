import * as XLSX from 'xlsx';

export interface ParsedProgram {
  organizational_outcome: string;
  program_name: string;
  activity: string;
  date_of_implementation: string;
  indicator: string;
  sub_industry: string;
  targets: {
    q1: number | null;
    q2: number | null;
    q3: number | null;
    q4: number | null;
    total: number | null;
  };
  budget: {
    q1: number;
    q2: number;
    q3: number;
    q4: number;
    total: number;
    ps: number;
    traveling: number;
    training: number;
    office_supplies: number;
    fuel: number;
    other_supplies: number;
    water: number;
    electricity: number;
    postage: number;
    mobile: number;
    landline: number;
    internet: number;
    ict_internet: number;
    professional_services: number;
    janitorial: number;
    general_services: number;
    repairs_office: number;
    repairs_ict: number;
    repairs_transport: number;
    taxes: number;
    fidelity_bond: number;
    insurance: number;
    printing: number;
    representation: number;
    rents_building: number;
    rents_vehicle: number;
    other_mooe: number;
    total_mooe: number;
    grand_total: number;
  };
}

function toNum(val: unknown): number | null {
  if (val === null || val === undefined || val === '' || val === '-') return null;
  const s = String(val).replace(/,/g, '').trim();
  if (s === '' || s === '-' || s === 'TBA' || s === 'ATC') return null;
  const n = Number(s);
  return isNaN(n) ? null : n;
}

function toNumZero(val: unknown): number {
  return toNum(val) ?? 0;
}

export function parseWFPExcel(buffer: ArrayBuffer): ParsedProgram[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  const programs: ParsedProgram[] = [];
  let currentOO = '';
  let currentProgram = '';
  let currentSubIndustry = '';

  // Find data start - look for the first OO row
  let startRow = 0;
  for (let i = 0; i < raw.length; i++) {
    const firstCell = String(raw[i]?.[0] ?? '').trim();
    if (firstCell.startsWith('OO1:') || firstCell.startsWith('OO2:') || firstCell.startsWith('OO3:') || firstCell.startsWith('OO4:')) {
      startRow = i;
      break;
    }
  }

  for (let i = startRow; i < raw.length; i++) {
    const row = raw[i];
    if (!row || row.length < 5) continue;

    const colA = String(row[0] ?? '').trim();
    const colB = String(row[1] ?? '').trim();
    const colC = String(row[2] ?? '').trim();
    const colD = String(row[3] ?? '').trim();

    // Detect OO header
    if (colA.startsWith('OO1:') || colA.startsWith('OO2:') || colA.startsWith('OO3:') || colA.startsWith('OO4:')) {
      currentOO = colA;
      currentProgram = colB;
      currentSubIndustry = '';
      continue;
    }

    // Skip empty rows
    if (!colB && !colD) continue;

    // Detect program-level rows (column B has text, no date in C, no indicator in D)
    // These are either program headers or sub-industry headers
    if (colB && !colC && !colD) {
      // Check if this looks like a sub-industry (ALL CAPS or known patterns)
      if (colB === colB.toUpperCase() && colB.length > 3) {
        currentSubIndustry = colB;
      } else {
        currentProgram = colB;
        currentSubIndustry = '';
      }
      continue;
    }

    // Activity rows - have at least activity name and some data
    if (colB) {
      const activity = colB;
      const dateImpl = colC;
      const indicator = colD;

      // Physical targets: columns E(4) through I(8) = Q1,Q2,Q3,Q4,Total
      const q1Target = toNum(row[4]);
      const q2Target = toNum(row[5]);
      const q3Target = toNum(row[6]);
      const q4Target = toNum(row[7]);
      const totalTarget = toNum(row[8]);

      // Budget columns: J(9) through N(13) = Q1,Q2,Q3,Q4,Total
      const q1Budget = toNumZero(row[9]);
      const q2Budget = toNumZero(row[10]);
      const q3Budget = toNumZero(row[11]);
      const q4Budget = toNumZero(row[12]);
      const totalBudget = toNumZero(row[13]);

      // PS: column O(14), MOOE detail columns: P(15) through AQ(42)
      const ps = toNumZero(row[14]);
      const traveling = toNumZero(row[15]);
      const training = toNumZero(row[16]);
      const office_supplies = toNumZero(row[17]);
      const fuel = toNumZero(row[18]);
      const other_supplies = toNumZero(row[19]);
      const water = toNumZero(row[20]);
      const electricity = toNumZero(row[21]);
      const postage = toNumZero(row[22]);
      const mobile = toNumZero(row[23]);
      const landline = toNumZero(row[24]);
      const internet = toNumZero(row[25]);
      const ict_internet = toNumZero(row[26]);
      const professional_services = toNumZero(row[27]);
      const janitorial = toNumZero(row[28]);
      const general_services = toNumZero(row[29]);
      const repairs_office = toNumZero(row[30]);
      const repairs_ict = toNumZero(row[31]);
      const repairs_transport = toNumZero(row[32]);
      const taxes = toNumZero(row[33]);
      const fidelity_bond = toNumZero(row[34]);
      const insurance = toNumZero(row[35]);
      const printing = toNumZero(row[36]);
      const representation = toNumZero(row[37]);
      const rents_building = toNumZero(row[38]);
      const rents_vehicle = toNumZero(row[39]);
      const other_mooe = toNumZero(row[40]);
      const total_mooe = toNumZero(row[41]);
      const grand_total = toNumZero(row[42]);

      // Only add if there's meaningful data
      const hasTargets = q1Target !== null || q2Target !== null || q3Target !== null || q4Target !== null || totalTarget !== null;
      const hasBudget = totalBudget > 0 || grand_total > 0;

      if (hasTargets || hasBudget || indicator) {
        programs.push({
          organizational_outcome: currentOO,
          program_name: currentProgram,
          activity,
          date_of_implementation: dateImpl,
          indicator,
          sub_industry: currentSubIndustry,
          targets: { q1: q1Target, q2: q2Target, q3: q3Target, q4: q4Target, total: totalTarget },
          budget: {
            q1: q1Budget, q2: q2Budget, q3: q3Budget, q4: q4Budget, total: totalBudget,
            ps, traveling, training, office_supplies, fuel, other_supplies,
            water, electricity, postage, mobile, landline, internet, ict_internet,
            professional_services, janitorial, general_services,
            repairs_office, repairs_ict, repairs_transport,
            taxes, fidelity_bond, insurance, printing, representation,
            rents_building, rents_vehicle, other_mooe, total_mooe, grand_total,
          },
        });
      }
    }
  }

  return programs;
}
