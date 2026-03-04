import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/database.types";

type ReviewRecordUpdate =
  Database["public"]["Tables"]["review_records"]["Update"];
type ReviewRecordRow = Database["public"]["Tables"]["review_records"]["Row"];

const dbDelReviewRecord = async (id: string, companyId: string) => {
  // Soft-delete the review record
  const { data: result, error } = await supabase
    .from("review_records")
    .update({ deleted_at: new Date().toISOString() } as ReviewRecordUpdate)
    .eq("id", id)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to delete review record");
  }

  // Clear review_id on work_orders so the job becomes available for re-review
  const { error: workOrderError } = await supabase
    .from("work_orders")
    .update({ review_id: null })
    .eq("review_id", id)
    .eq("company_id", companyId);

  if (workOrderError) {
    throw new Error(
      workOrderError.message || "Failed to unlink job from review record",
    );
  }

  return result as ReviewRecordRow;
};

export function useDelReviewRecord() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation<ReviewRecordRow, Error, string>({
    mutationFn: async (id) => {
      const companyId = session?.user?.app_metadata?.company_id as
        | string
        | undefined;

      if (!companyId) {
        throw new Error("Company ID is missing from user session");
      }

      return dbDelReviewRecord(id, companyId);
    },
    onSuccess: async (result) => {
      void result;
      toast.success("Review record deleted");
      // Invalidate review-related queries
      await queryClient.invalidateQueries({
        queryKey: ["reviews", "review-records"],
        exact: false,
      });
      await queryClient.invalidateQueries({
        queryKey: ["reviews", "review-records-summaries"],
        exact: false,
      });
      // Invalidate job-related queries (job becomes unreviewed again)
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
      toast.error(error.message || "Failed to delete review record");
    },
  });
}
