import { useQuery } from "@tanstack/react-query";
import type { Database } from "@/database.types";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";

export type ReviewRecordRow =
  Database["public"]["Views"]["v_review_records"]["Row"];

const fetchReviewRecords = async (
  companyId: string,
): Promise<ReviewRecordRow[]> => {
  const { data, error } = await supabase
    .from("v_review_records")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to fetch review records");
  }

  return data as ReviewRecordRow[];
};

export function useFetchReviewRecords() {
  const { session } = useAuth();
  const companyId = session?.user.app_metadata.company_id as string | undefined;

  return useQuery<ReviewRecordRow[], Error>({
    queryKey: ["reviews", "review-records", companyId ?? null],
    queryFn: () => {
      if (!companyId) {
        throw new Error("Company ID is missing from user session");
      }

      return fetchReviewRecords(companyId);
    },
    enabled: Boolean(companyId),
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
}
