import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useProgramsByDivision(divisionCode?: string) {
  return useQuery({
    queryKey: ["programs", divisionCode],
    queryFn: async () => {
      // Get division id
      let divisionId: string | undefined;
      if (divisionCode) {
        const { data: div } = await supabase
          .from("divisions")
          .select("id")
          .eq("code", divisionCode)
          .single();
        divisionId = div?.id;
        if (!divisionId) return [];
      }

      // Get uploads for this division
      let uploadsQuery = supabase.from("uploads").select("id");
      if (divisionId) {
        uploadsQuery = uploadsQuery.eq("division_id", divisionId);
      }
      const { data: uploads } = await uploadsQuery;
      if (!uploads?.length) return [];

      const uploadIds = uploads.map((u) => u.id);

      // Get programs with targets and budgets
      const { data: programs, error } = await supabase
        .from("programs")
        .select("*, targets(*), budgets(*)")
        .in("upload_id", uploadIds);

      if (error) throw error;
      return programs ?? [];
    },
    enabled: true,
  });
}

export function useAllPrograms() {
  return useQuery({
    queryKey: ["all-programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("programs")
        .select("*, targets(*), budgets(*), uploads!inner(division_id, divisions:division_id(code, name))");
      if (error) throw error;
      return data ?? [];
    },
  });
}
