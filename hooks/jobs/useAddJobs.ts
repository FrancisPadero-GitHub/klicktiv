import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/database.types";

type WorkOrderInsert = Database["public"]["Tables"]["work_orders"]["Insert"];
type JobInsert = Database["public"]["Tables"]["jobs"]["Insert"];

export interface AddJobPayload {
  workOrder: WorkOrderInsert;
  job: Omit<JobInsert, "work_order_id">;
}

const dbAddJob = async (payload: AddJobPayload) => {
  // Step 1: Insert work order
  const { data: workOrder, error: woError } = await supabase
    .from("work_orders")
    .insert([payload.workOrder])
    .select()
    .single();

  if (woError) {
    throw new Error(woError.message || "Failed to create work order");
  }

  // Step 2: Insert job with work_order_id
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .insert([{ ...payload.job, work_order_id: workOrder.id }])
    .select()
    .single();

  if (jobError) {
    // Clean up the work order on failure
    await supabase.from("work_orders").delete().eq("id", workOrder.id);
    throw new Error(jobError.message || "Failed to create job");
  }

  return { workOrder, job };
};

export function useAddJob() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (payload: AddJobPayload) => {
      const companyId = session?.user.app_metadata.company_id as
        | string
        | undefined;

      if (!companyId) {
        throw new Error("Company ID is missing from user session");
      }

      return dbAddJob({
        workOrder: {
          ...payload.workOrder,
          company_id: companyId,
        },
        job: {
          ...payload.job,
          company_id: companyId,
        },
      });
    },
    onSuccess: async (result) => {
      void result;
      toast.success("Job added successfully");
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
      toast.error(error.message || "Failed to add job");
    },
  });
}
