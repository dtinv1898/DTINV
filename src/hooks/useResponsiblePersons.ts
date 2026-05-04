import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useResponsiblePersons(divisionId?: string) {
  return useQuery({
    queryKey: ["responsible-persons", divisionId],
    queryFn: async () => {
      let query = supabase
        .from("responsible_persons")
        .select("*, divisions(code, name)")
        .order("name");
      if (divisionId) {
        query = query.eq("division_id", divisionId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useResponsiblePerson(personId?: string) {
  return useQuery({
    queryKey: ["responsible-person", personId],
    queryFn: async () => {
      if (!personId) return null;
      const { data, error } = await supabase
        .from("responsible_persons")
        .select("*, divisions(code, name)")
        .eq("id", personId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!personId,
  });
}

export function useProgramsByPerson(personId?: string) {
  return useQuery({
    queryKey: ["programs-by-person", personId],
    queryFn: async () => {
      if (!personId) return [];
      // Get uploads for this person
      const { data: uploads } = await supabase
        .from("uploads")
        .select("id")
        .eq("responsible_person_id", personId);
      if (!uploads?.length) return [];
      const uploadIds = uploads.map((u) => u.id);
      const { data, error } = await supabase
        .from("programs")
        .select("*, targets(*), budgets(*)")
        .in("upload_id", uploadIds);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!personId,
  });
}
