import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OORCRow } from "@/lib/oorcParser";
import { PGSRow } from "@/lib/pgsParser";

const MONTHS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"] as const;

export async function resolveDivisionIdToUuid(divisionId: string | undefined) {
  if (!divisionId) return undefined;
  if (divisionId !== "company") return divisionId;
  // find or create a special company division with code 'COMPANY'
  const { data: found, error: findErr } = await supabase.from('divisions').select('id').ilike('code', 'COMPANY').limit(1);
  if (findErr) throw findErr;
  if (found && (found as any).length > 0) {
    console.log('Found existing COMPANY division:', (found as any)[0].id);
    return (found as any)[0].id;
  }
  console.log('COMPANY division not found, creating new one...');
  const { data: ins, error: insErr } = await supabase.from('divisions').insert({ name: 'Company', code: 'COMPANY' }).select().single();
  if (insErr) throw insErr;
  console.log('Created new COMPANY division:', (ins as any).id);
  return (ins as any).id;
}

export function useOORCData(divisionId: string | undefined) {
  return useQuery({
    queryKey: ["oorc_data", divisionId],
    queryFn: async () => {
      if (!divisionId) return [];
      const realId = await resolveDivisionIdToUuid(divisionId);
      const { data, error } = await supabase.from("oorc_data").select("*").eq("division_id", realId);
      if (error) throw error;
      return data;
    },
    enabled: divisionId !== undefined && divisionId !== "",
  });
}

export function usePGSData(divisionId: string | undefined) {
  return useQuery({
    queryKey: ["pgs_data", divisionId],
    queryFn: async () => {
      if (!divisionId) return [];
      const realId = await resolveDivisionIdToUuid(divisionId);
      const { data, error } = await supabase.from("pgs_data").select("*").eq("division_id", realId);
      if (error) throw error;
      return data;
    },
    enabled: divisionId !== undefined && divisionId !== "",
  });
}

export function useSaveOORCData(divisionId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: OORCRow[]) => {
      const realId = await resolveDivisionIdToUuid(divisionId);
      if (!realId) throw new Error("No division");
      // Only keep rows that actually contain target/accomplishment data
      const hasData = (r: OORCRow) => {
        if (r.annualTarget !== null) return true;
        if (r.pctAccomp !== null) return true;
        if (r.targets && (r.targets.q1 !== null || r.targets.q2 !== null || r.targets.q3 !== null || r.targets.q4 !== null)) return true;
        // monthly data
        for (const m of MONTHS) {
          const mm = (r.monthly as any)[m];
          if (mm && (mm.target !== null || mm.accomp !== null)) return true;
        }
        return false;
      };

      const filtered = rows.filter(hasData);
      // remove existing data for this division (or company-level entries where division_id IS NULL)
      await supabase.from("oorc_data").delete().eq("division_id", realId);
      // Insert filtered rows in batches of 50
      for (let i = 0; i < filtered.length; i += 50) {
        const batch = filtered.slice(i, i + 50).map((r) => ({
          division_id: realId,
          category: r.category,
          oo: r.oo,
          program: r.program,
          indicator: r.indicator,
          annual_target: r.annualTarget,
          target_q1: r.targets.q1, target_q2: r.targets.q2,
          target_q3: r.targets.q3, target_q4: r.targets.q4,
          target_sem1: r.targets.sem1, target_sem2: r.targets.sem2,
          accomp_q1: r.accomplishments.q1, accomp_q2: r.accomplishments.q2,
          accomp_q3: r.accomplishments.q3, accomp_q4: r.accomplishments.q4,
          accomp_sem1: r.accomplishments.sem1, accomp_sem2: r.accomplishments.sem2,
          ...Object.fromEntries(MONTHS.map((m) => [`target_${m}`, r.monthly[m].target])),
          ...Object.fromEntries(MONTHS.map((m) => [`accomp_${m}`, r.monthly[m].accomp])),
          pct_accomp: r.pctAccomp,
        }));
        const { error } = await supabase.from("oorc_data").insert(batch);
        if (error) throw error;
      }
      return filtered.length;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["oorc_data", divisionId] }),
  });
}

export function useSavePGSData(divisionId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: PGSRow[]) => {
      const realId = await resolveDivisionIdToUuid(divisionId);
      if (!realId) throw new Error("No division");
      const hasData = (r: PGSRow) => {
        if (r.cyTarget !== null) return true;
        if (r.pctAccomp !== null) return true;
        if (r.targets && (r.targets.q1 !== null || r.targets.q2 !== null || r.targets.q3 !== null || r.targets.q4 !== null)) return true;
        for (const m of MONTHS) {
          const mm = (r.monthly as any)[m];
          if (mm && (mm.target !== null || mm.accomp !== null)) return true;
        }
        return false;
      };

      const filtered = rows.filter(hasData);
      await supabase.from("pgs_data").delete().eq("division_id", realId);
      for (let i = 0; i < filtered.length; i += 50) {
        const batch = filtered.slice(i, i + 50).map((r) => ({
          division_id: realId,
          perspective: r.perspective,
          strategic_objective: r.strategicObjective,
          measure_no: r.measureNo,
          strategic_measure: r.strategicMeasure,
          cy_target: r.cyTarget,
          target_to_date: r.targets.toDate,
          target_q1: r.targets.q1, target_q2: r.targets.q2,
          target_q3: r.targets.q3, target_q4: r.targets.q4,
          target_sem1: r.targets.sem1, target_sem2: r.targets.sem2,
          accomp_to_date: r.accomplishments.toDate,
          accomp_q1: r.accomplishments.q1, accomp_q2: r.accomplishments.q2,
          accomp_q3: r.accomplishments.q3, accomp_q4: r.accomplishments.q4,
          accomp_sem1: r.accomplishments.sem1, accomp_sem2: r.accomplishments.sem2,
          ...Object.fromEntries(MONTHS.map((m) => [`target_${m}`, r.monthly[m].target])),
          ...Object.fromEntries(MONTHS.map((m) => [`accomp_${m}`, r.monthly[m].accomp])),
          pct_accomp: r.pctAccomp,
        }));
        const { error } = await supabase.from("pgs_data").insert(batch);
        if (error) throw error;
      }
      return filtered.length;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pgs_data", divisionId] }),
  });
}

// Convert DB rows back to parser format for chart reuse
export function dbToOORCRows(dbRows: any[]): OORCRow[] {
  return dbRows.map((r) => ({
    category: r.category || "",
    oo: r.oo || "",
    program: r.program || "",
    indicator: r.indicator,
    annualTarget: r.annual_target,
    targets: { q1: r.target_q1, q2: r.target_q2, q3: r.target_q3, q4: r.target_q4, sem1: r.target_sem1, sem2: r.target_sem2 },
    accomplishments: { toDate: r.accomp_to_date, q1: r.accomp_q1, q2: r.accomp_q2, q3: r.accomp_q3, q4: r.accomp_q4, sem1: r.accomp_sem1, sem2: r.accomp_sem2 },
    monthly: Object.fromEntries(MONTHS.map((m) => [m, { target: r[`target_${m}`], accomp: r[`accomp_${m}`] }])) as any,
    pctAccomp: r.pct_accomp,
  }));
}

export function dbToPGSRows(dbRows: any[]): PGSRow[] {
  return dbRows.map((r) => ({
    perspective: r.perspective || "",
    strategicObjective: r.strategic_objective || "",
    measureNo: r.measure_no,
    strategicMeasure: r.strategic_measure,
    cyTarget: r.cy_target,
    targets: { toDate: r.target_to_date, q1: r.target_q1, q2: r.target_q2, q3: r.target_q3, q4: r.target_q4, sem1: r.target_sem1, sem2: r.target_sem2 },
    accomplishments: { toDate: r.accomp_to_date, q1: r.accomp_q1, q2: r.accomp_q2, q3: r.accomp_q3, q4: r.accomp_q4, sem1: r.accomp_sem1, sem2: r.accomp_sem2 },
    monthly: Object.fromEntries(MONTHS.map((m) => [m, { target: r[`target_${m}`], accomp: r[`accomp_${m}`] }])) as any,
    pctAccomp: r.pct_accomp,
  }));
}
