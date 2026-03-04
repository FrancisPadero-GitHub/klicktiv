import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/database.types";

type ReviewRecordUpdate =
  Database["public"]["Tables"]["review_records"]["Update"];
type ReviewRecordRow = Database["public"]["Tables"]["review_records"]["Row"];

const dbEditReviewRecord = async (
  data: ReviewRecordUpdate,
  companyId: string,
) => {
  const { data: result, error } = await supabase
    .from("review_records")
    .update(data)
    .eq("id", data.id)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to edit review record");
  }

  return result as ReviewRecordRow;
};

export function useEditReviewRecord() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation<ReviewRecordRow, Error, ReviewRecordUpdate>({
    mutationFn: async (data) => {
      const companyId = session?.user?.app_metadata?.company_id as
        | string
        | undefined;

      if (!companyId) {
        throw new Error("Company ID is missing from user session");
      }

      return dbEditReviewRecord(data, companyId);
    },
    onSuccess: async (result) => {
      console.log("Review record edited successfully:", result);
      // Invalidate review-related queries
      await queryClient.invalidateQueries({
        queryKey: ["reviews", "review-records"],
        exact: false,
      });
      await queryClient.invalidateQueries({
        queryKey: ["reviews", "review-records-summaries"],
        exact: false,
      });
      // Invalidate job-related queries
      await queryClient.invalidateQueries({
        queryKey: ["jobs"],
        exact: false,
      });
      await queryClient.invalidateQueries({
        queryKey: ["jobs", "unreviewed"],
        exact: false,
      });
      await queryClient.invalidateQueries({
        queryKey: ["jobs", "for-review"],
        exact: false,
      });
      await queryClient.invalidateQueries({
        queryKey: ["jobs", "work-orders"],
        exact: false,
      });
      // Invalidate financial summaries
      await queryClient.invalidateQueries({
        queryKey: ["job-monthly-financial-summary"],
        exact: false,
      });
      // Invalidate estimates (in case job was promoted from estimate)
      await queryClient.invalidateQueries({
        queryKey: ["estimates"],
        exact: false,
      });
    },
    onError: (error) => {
      console.error("Error editing review record:", error.message || error);
    },
  });
}
