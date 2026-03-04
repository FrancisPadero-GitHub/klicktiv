import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/database.types";

type WorkOrderUpdate = Database["public"]["Tables"]["work_orders"]["Update"];
type JobUpdate = Database["public"]["Tables"]["jobs"]["Update"];

export interface EditJobPayload {
  workOrderId: string;
  workOrder: WorkOrderUpdate;
  job: JobUpdate;
}

const dbEditJob = async (payload: EditJobPayload, companyId: string) => {
  // Update the work order
  const { error: woError } = await supabase
    .from("work_orders")
    .update(payload.workOrder)
    .eq("id", payload.workOrderId)
    .eq("company_id", companyId);

  if (woError) {
    throw new Error(woError.message || "Failed to update work order");
  }

  // Update the job
  const { data: result, error: jobError } = await supabase
    .from("jobs")
    .update(payload.job)
    .eq("work_order_id", payload.workOrderId)
    .eq("company_id", companyId)
    .select()
    .single();

  if (jobError) {
    throw new Error(jobError.message || "Failed to update job");
  }

  return result;
};

export function useEditJob() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (payload: EditJobPayload) => {
      const companyId = session?.user?.app_metadata?.company_id as
        | string
        | undefined;

      if (!companyId) {
        throw new Error("Company ID is missing from user session");
      }

      return dbEditJob(payload, companyId);
    },
    onSuccess: async (result) => {
      void result;
      toast.success("Job updated successfully");
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
        queryKey: ["estimates"],
        exact: false,
      });
      await queryClient.invalidateQueries({
        queryKey: ["jobs", "work-orders"],
        exact: false,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update job");
    },
  });
}
