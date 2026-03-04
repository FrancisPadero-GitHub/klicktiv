import { useQuery } from "@tanstack/react-query";
import type { Database } from "@/database.types";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";

export type ReviewRecordRowSummaries =
  Database["public"]["Views"]["v_review_records_summary"]["Row"];

const fetchReviewRecordsSummaries = async (
  companyId: string,
): Promise<ReviewRecordRowSummaries[]> => {
  const { data, error } = await supabase
    .from("v_review_records_summary")
    .select("*")
    .eq("company_id", companyId);

  if (error) {
    throw new Error(error.message || "Failed to fetch review records");
  }

  return (data ?? []) as ReviewRecordRowSummaries[];
};

export function useFetchReviewRecordsSummaries() {
  const { session } = useAuth();
  const companyId = session?.user?.app_metadata?.company_id as
    | string
    | undefined;

  return useQuery<ReviewRecordRowSummaries[], Error>({
    queryKey: ["reviews", "review-records-summaries", companyId ?? null],
    queryFn: () => {
      if (!companyId) {
        throw new Error("Company ID is missing from user session");
      }

      return fetchReviewRecordsSummaries(companyId);
    },
    enabled: Boolean(companyId),
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
}
