import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/database.types";

type WorkOrderInsert = Database["public"]["Tables"]["work_orders"]["Insert"];
type EstimateInsert = Database["public"]["Tables"]["estimates"]["Insert"];

export interface AddEstimatePayload {
  workOrder: WorkOrderInsert;
  estimate: Omit<EstimateInsert, "work_order_id">;
}

const dbAddEstimate = async (payload: AddEstimatePayload) => {
  const { data: workOrder, error: workOrderError } = await supabase
    .from("work_orders")
    .insert([payload.workOrder])
    .select()
    .single();

  if (workOrderError) {
    throw new Error(
      workOrderError.message || "Failed to create estimate work order",
    );
  }

  const { data: estimate, error: estimateError } = await supabase
    .from("estimates")
    .insert([{ ...payload.estimate, work_order_id: workOrder.id }])
    .select()
    .single();

  if (estimateError) {
    await supabase.from("work_orders").delete().eq("id", workOrder.id);
    throw new Error(estimateError.message || "Failed to create estimate");
  }

  return { workOrder, estimate };
};

export function useAddEstimate() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (payload: AddEstimatePayload) => {
      const companyId = session?.user?.app_metadata?.company_id as
        | string
        | undefined;

      if (!companyId) {
        throw new Error("Company ID is missing from user session");
      }

      return dbAddEstimate({
        workOrder: {
          ...payload.workOrder,
          company_id: companyId,
        },
        estimate: {
          ...payload.estimate,
          company_id: companyId,
        },
      });
    },
    onSuccess: async () => {
      toast.success("Estimate added successfully");
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
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add estimate");
    },
  });
}
