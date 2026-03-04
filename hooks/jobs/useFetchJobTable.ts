import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/database.types";

export type ViewJobsRow = Database["public"]["Views"]["v_jobs"]["Row"];

// Data fetching function
export const fetchViewJobRow = async (
  companyId: string,
): Promise<ViewJobsRow[]> => {
  const { data: result, error } = await supabase
    .from("v_jobs")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to fetch jobs view table");
  }

  return result as ViewJobsRow[];
};

export function useFetchViewJobRow() {
  const { session } = useAuth();
  const companyId = session?.user?.app_metadata?.company_id as
    | string
    | undefined;

  return useQuery<ViewJobsRow[], Error>({
    queryKey: ["jobs", "view-table", companyId ?? null],
    queryFn: () => {
      if (!companyId) {
        throw new Error("Company ID is missing from user session");
      }

      return fetchViewJobRow(companyId);
    },
    enabled: Boolean(companyId),
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
  });
}
