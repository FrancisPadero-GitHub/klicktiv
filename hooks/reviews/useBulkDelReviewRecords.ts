import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/database.types";

type ReviewRecordUpdate =
  Database["public"]["Tables"]["review_records"]["Update"];

const dbBulkDelReviewRecords = async (ids: string[], companyId: string) => {
  // Soft-delete the review records
  const { error } = await supabase
    .from("review_records")
    .update({ deleted_at: new Date().toISOString() } as ReviewRecordUpdate)
    .in("id", ids)
    .eq("company_id", companyId);

  if (error) {
    throw new Error(error.message || "Failed to delete review records");
  }

  // Clear review_id on work_orders so the jobs become available for re-review
  const { error: workOrderError } = await supabase
    .from("work_orders")
    .update({ review_id: null })
    .in("review_id", ids)
    .eq("company_id", companyId);

  if (workOrderError) {
    throw new Error(
      workOrderError.message || "Failed to unlink jobs from review records",
    );
  }
};

export function useBulkDelReviewRecords() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const companyId = session?.user.app_metadata.company_id as
        | string
        | undefined;

      if (!companyId) {
        throw new Error("Company ID is missing from user session");
      }

      return dbBulkDelReviewRecords(ids, companyId);
    },
    onSuccess: async () => {
      toast.success("Review records deleted");
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
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete review records");
    },
  });
}
