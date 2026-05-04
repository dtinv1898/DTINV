import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDivisions() {
  return useQuery({
    queryKey: ["divisions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("divisions").select("*");
      if (error) throw error;
      return data;
    },
  });
}
