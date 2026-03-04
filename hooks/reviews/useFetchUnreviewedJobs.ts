import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/database.types";

export type UnreviewedJobRow = Database["public"]["Views"]["v_jobs"]["Row"];

const fetchUnreviewedJobs = async (
  companyId: string,
): Promise<UnreviewedJobRow[]> => {
  const { data, error } = await supabase
    .from("v_jobs")
    .select("*")
    .eq("company_id", companyId)
    .eq("status", "done")
    .is("review_id", null)
    .order("work_order_date", { ascending: false });

  if (error)
    throw new Error(error.message || "Failed to fetch unreviewed jobs");

  return data as UnreviewedJobRow[];
};

export function useFetchUnreviewedJobs() {
  const { session } = useAuth();
  const companyId = session?.user?.app_metadata?.company_id as
    | string
    | undefined;

  return useQuery<UnreviewedJobRow[], Error>({
    queryKey: ["jobs", "unreviewed", companyId ?? null],
    queryFn: () => {
      if (!companyId) {
        throw new Error("Company ID is missing from user session");
      }

      return fetchUnreviewedJobs(companyId);
    },
    enabled: Boolean(companyId),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
