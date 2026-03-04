import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/database.types";

export type ReviewTypeRow = Database["public"]["Tables"]["review_types"]["Row"];

const fetchReviewTypes = async (
  companyId: string,
): Promise<ReviewTypeRow[]> => {
  const { data, error } = await supabase
    .from("review_types")
    .select("*")
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .order("name");

  if (error) throw new Error(error.message || "Failed to fetch review types");

  return data as ReviewTypeRow[];
};

export function useFetchReviewTypes() {
  const { session } = useAuth();
  const companyId = session?.user?.app_metadata?.company_id as
    | string
    | undefined;

  return useQuery<ReviewTypeRow[], Error>({
    queryKey: ["review-types", companyId ?? null],
    queryFn: () => {
      if (!companyId) {
        throw new Error("Company ID is missing from user session");
      }

      return fetchReviewTypes(companyId);
    },
    enabled: Boolean(companyId),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
