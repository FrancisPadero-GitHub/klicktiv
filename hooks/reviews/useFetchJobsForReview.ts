import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/database.types";

export type JobRow = Database["public"]["Views"]["v_jobs"]["Row"];

const fetchJobs = async (companyId: string): Promise<JobRow[]> => {
  const { data, error } = await supabase
    .from("v_jobs")
    .select("*")
    .eq("company_id", companyId)
    .eq("status", "done")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message || "Failed to fetch jobs");

  return data as JobRow[];
};

export function useFetchJobsForReview() {
  const { session } = useAuth();
  const companyId = session?.user?.app_metadata?.company_id as
    | string
    | undefined;

  return useQuery<JobRow[], Error>({
    queryKey: ["jobs", "for-review", companyId ?? null],
    queryFn: () => {
      if (!companyId) {
        throw new Error("Company ID is missing from user session");
      }

      return fetchJobs(companyId);
    },
    enabled: Boolean(companyId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
