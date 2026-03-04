import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/database.types";

export type VJobsRow = Database["public"]["Views"]["v_jobs_summary"]["Row"];

// Data fetching function
export const fetchJobSummary = async (
  companyId: string,
): Promise<VJobsRow[]> => {
  const { data: result, error } = await supabase
    .from("v_jobs_summary")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to fetch jobs");
  }

  return result as VJobsRow[];
};

export function useFetchJobSummary() {
  const { session } = useAuth();
  const companyId = session?.user?.app_metadata?.company_id as
    | string
    | undefined;

  return useQuery<VJobsRow[], Error>({
    queryKey: ["jobs", "summary", companyId ?? null],
    queryFn: () => {
      if (!companyId) {
        throw new Error("Company ID is missing from user session");
      }

      return fetchJobSummary(companyId);
    },
    enabled: Boolean(companyId),
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
  });
}
