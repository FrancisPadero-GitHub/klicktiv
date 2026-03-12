import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";

const dbSoftDeleteJob = async (workOrderId: string, companyId: string) => {
  const now = new Date().toISOString();

  // Soft delete the job record
  const { error: jobError } = await supabase
    .from("jobs")
    .update({ deleted_at: now })
    .eq("work_order_id", workOrderId)
    .eq("company_id", companyId);

  if (jobError) {
    throw new Error(jobError.message || "Failed to delete job");
  }

  // Soft delete the work order
  const { data: result, error: woError } = await supabase
    .from("work_orders")
    .update({ deleted_at: now })
    .eq("id", workOrderId)
    .eq("company_id", companyId)
    .select()
    .single();

  if (woError) {
    throw new Error(woError.message || "Failed to delete work order");
  }

  return result;
};

export function useDelJob() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (workOrderId: string) => {
      const companyId = session?.user.app_metadata.company_id as
        | string
        | undefined;

      if (!companyId) {
        throw new Error("Company ID is missing from user session");
      }

      return dbSoftDeleteJob(workOrderId, companyId);
    },
    onSuccess: async (result) => {
      void result;
      toast.success("Job deleted successfully");
      await queryClient.invalidateQueries({
        queryKey: ["jobs"],
        exact: false,
      });
      await queryClient.invalidateQueries({
        queryKey: ["job-monthly-financial-summary"],
        exact: false,
      });
      await queryClient.invalidateQueries({
        queryKey: ["technicians"],
        exact: false,
      });
      await queryClient.invalidateQueries({
        queryKey: ["technicians", "summary"],
        exact: false,
      });
      await queryClient.invalidateQueries({
        queryKey: ["estimates"],
        exact: false,
      });
      await queryClient.invalidateQueries({
        queryKey: ["jobs", "work-orders"],
        exact: false,
      });
      await queryClient.invalidateQueries({
        queryKey: ["reviews", "review-records"],
        exact: false,
      });
      await queryClient.invalidateQueries({
        queryKey: ["reviews", "review-records-summaries"],
        exact: false,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete job");
    },
  });
}
