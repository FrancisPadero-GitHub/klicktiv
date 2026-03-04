import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/database.types";

export type EstimatesRow = Database["public"]["Views"]["v_estimates"]["Row"];

// Data fetching function
export const fetchEstimates = async (
  companyId: string,
): Promise<EstimatesRow[]> => {
  const { data: result, error } = await supabase
    .from("v_estimates")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to fetch estimates");
  }

  return result as EstimatesRow[];
};

export function useFetchEstimates() {
  const { session } = useAuth();
  const companyId = session?.user?.app_metadata?.company_id as
    | string
    | undefined;

  return useQuery<EstimatesRow[], Error>({
    queryKey: ["estimates", "view-table", companyId ?? null],
    queryFn: () => {
      if (!companyId) {
        throw new Error("Company ID is missing from user session");
      }

      return fetchEstimates(companyId);
    },
    enabled: Boolean(companyId),
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
  });
}
