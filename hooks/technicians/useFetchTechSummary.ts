import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/database.types";

export type TechnicianSummaryRow =
  Database["public"]["Views"]["v_technicians_summary"]["Row"];

// Data fetching function
export const fetchTechSummary = async (
  companyId: string,
): Promise<TechnicianSummaryRow[]> => {
  const { data: result, error } = await supabase
    .from("v_technicians_summary")
    .select("*")
    .eq("company_id", companyId);

  if (error) {
    throw new Error(error.message || "Failed to fetch technician summary");
  }

  return result as TechnicianSummaryRow[];
};

export function useFetchTechSummary() {
  const { session } = useAuth();
  const companyId = session?.user?.app_metadata?.company_id as
    | string
    | undefined;

  return useQuery<TechnicianSummaryRow[], Error>({
    queryKey: ["technicians", "summary", companyId ?? null],
    queryFn: () => {
      if (!companyId) {
        throw new Error("Company ID is missing from user session");
      }

      return fetchTechSummary(companyId);
    },
    enabled: Boolean(companyId),
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
  });
}
