import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/database.types";

type WorkOrderRow = Database["public"]["Tables"]["work_orders"]["Row"];

const dbSoftDeleteEstimate = async (workOrderId: string, companyId: string) => {
  const now = new Date().toISOString();

  const { error: estimateError } = await supabase
    .from("estimates")
    .update({ deleted_at: now })
    .eq("work_order_id", workOrderId)
    .eq("company_id", companyId);

  if (estimateError) {
    throw new Error(estimateError.message || "Failed to delete estimate");
  }

  const { error: jobError } = await supabase
    .from("jobs")
    .update({ deleted_at: now })
    .eq("work_order_id", workOrderId)
    .eq("company_id", companyId);

  if (jobError) {
    throw new Error(jobError.message || "Failed to delete related job");
  }

  const { data: result, error: workOrderError } = await supabase
    .from("work_orders")
    .update({ deleted_at: now })
    .eq("id", workOrderId)
    .eq("company_id", companyId)
    .select()
    .single();

  if (workOrderError) {
    throw new Error(workOrderError.message || "Failed to delete work order");
  }

  return result as WorkOrderRow;
};

export function useDelEstimate() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation<WorkOrderRow, Error, string>({
    mutationFn: async (workOrderId: string) => {
      const companyId = session?.user?.app_metadata?.company_id as
        | string
        | undefined;

      if (!companyId) {
        throw new Error("Company ID is missing from user session");
      }

      return dbSoftDeleteEstimate(workOrderId, companyId);
    },
    onSuccess: async (result) => {
      void result;
      toast.success("Estimate deleted successfully");
      await queryClient.invalidateQueries({
        queryKey: ["estimates"],
        exact: false,
      });
      await queryClient.invalidateQueries({
        queryKey: ["jobs", "work-orders"],
        exact: false,
      });
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
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete estimate",
      );
    },
  });
}
