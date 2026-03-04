import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/database.types";

type EstimateUpdate = Database["public"]["Tables"]["estimates"]["Update"];
type WorkOrderUpdate = Database["public"]["Tables"]["work_orders"]["Update"];

// destructure to omit work_order_id from updates since it's not editable
export interface EditEstimatePayload {
  estimateId: string; // used to identify the estimate to update
  estimateUpdates?: EstimateUpdate;
  workOrderUpdates?: WorkOrderUpdate;
}

const dbEditEstimate = async (
  payload: EditEstimatePayload,
  companyId: string,
) => {
  const hasEstimateUpdates =
    payload.estimateUpdates && Object.keys(payload.estimateUpdates).length > 0;
  const hasWorkOrderUpdates =
    payload.workOrderUpdates &&
    Object.keys(payload.workOrderUpdates).length > 0;

  let estimateResult: Database["public"]["Tables"]["estimates"]["Row"] | null =
    null;
  let workOrderResult:
    | Database["public"]["Tables"]["work_orders"]["Row"]
    | null = null;

  if (hasEstimateUpdates) {
    const { data, error } = await supabase
      .from("estimates")
      .update(payload.estimateUpdates)
      .eq("work_order_id", payload.estimateId)
      .eq("company_id", companyId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message || "Failed to update estimate");
    }

    estimateResult = data;
  }

  if (hasWorkOrderUpdates) {
    const { data, error } = await supabase
      .from("work_orders")
      .update(payload.workOrderUpdates)
      .eq("id", payload.estimateId)
      .eq("company_id", companyId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message || "Failed to update work order");
    }

    workOrderResult = data;
  }

  if (!hasEstimateUpdates && !hasWorkOrderUpdates) {
    throw new Error("No updates provided");
  }

  return {
    estimate: estimateResult,
    workOrder: workOrderResult,
  };
};

export function useEditEstimate() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (payload: EditEstimatePayload) => {
      const companyId = session?.user?.app_metadata?.company_id as
        | string
        | undefined;

      if (!companyId) {
        throw new Error("Company ID is missing from user session");
      }

      return dbEditEstimate(payload, companyId);
    },
    onSuccess: async (result) => {
      void result;
      toast.success("Estimate updated successfully");
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
        queryKey: ["technicians"],
        exact: false,
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update estimate",
      );
    },
  });
}
