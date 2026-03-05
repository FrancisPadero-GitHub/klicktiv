import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/database.types";

type WorkOrderUpdate = Database["public"]["Tables"]["work_orders"]["Update"];
type EstimateUpdate = Database["public"]["Tables"]["estimates"]["Update"];
type JobInsert = Database["public"]["Tables"]["jobs"]["Insert"];

export interface PromoteEstimateToJobPayload {
  workOrderId: string;
  workOrderUpdates?: WorkOrderUpdate;
  estimateUpdates: EstimateUpdate;
  job: Omit<JobInsert, "work_order_id">;
}

const dbPromoteEstimateToJob = async (
  payload: PromoteEstimateToJobPayload,
  companyId: string,
) => {
  const now = new Date().toISOString();

  if (
    payload.workOrderUpdates &&
    Object.keys(payload.workOrderUpdates).length
  ) {
    const workOrderUpdate = {
      ...payload.workOrderUpdates,
      updated_at: now,
    };

    const { error: workOrderError } = await supabase
      .from("work_orders")
      .update(workOrderUpdate)
      .eq("id", payload.workOrderId)
      .eq("company_id", companyId);

    if (workOrderError) {
      throw new Error(workOrderError.message || "Failed to update work order");
    }
  }

  const { data: jobResult, error: jobError } = await supabase
    .from("jobs")
    .upsert(
      [
        {
          ...payload.job,
          company_id: companyId,
          work_order_id: payload.workOrderId,
          deleted_at: null,
        },
      ],
      { onConflict: "work_order_id" },
    )
    .select()
    .single();

  if (jobError) {
    throw new Error(jobError.message || "Failed to promote estimate to job");
  }

  const estimateUpdate = {
    ...payload.estimateUpdates,
    promoted_at: now,
  };

  const { data: estimateResult, error: estimateError } = await supabase
    .from("estimates")
    .update(estimateUpdate)
    .eq("work_order_id", payload.workOrderId)
    .eq("company_id", companyId)
    .select()
    .single();

  if (estimateError) {
    await supabase
      .from("jobs")
      .delete()
      .eq("work_order_id", payload.workOrderId)
      .eq("company_id", companyId);
    throw new Error(
      estimateError.message || "Failed to update estimate status",
    );
  }

  return {
    job: jobResult,
    estimate: estimateResult,
  };
};

export function usePromoteEstimateToJob() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (payload: PromoteEstimateToJobPayload) => {
      const companyId = session?.user?.app_metadata?.company_id as
        | string
        | undefined;

      if (!companyId) {
        throw new Error("Company ID is missing from user session");
      }

      return dbPromoteEstimateToJob(payload, companyId);
    },
    onSuccess: async () => {
      toast.success("Estimate promoted to job successfully");
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
    onError: (error: Error) => {
      toast.error(error.message || "Failed to promote estimate to job");
    },
  });
}
