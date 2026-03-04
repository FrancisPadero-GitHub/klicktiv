import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/database.types";
import { toast } from "sonner";

type PaymentMethodUpdate =
  Database["public"]["Tables"]["payment_methods"]["Update"];

export interface EditPaymentMethodPayload {
  id: string;
  data: PaymentMethodUpdate;
}

const dbEditPaymentMethod = async (
  payload: EditPaymentMethodPayload,
  companyId: string,
) => {
  const { data, error } = await supabase
    .from("payment_methods")
    .update(payload.data)
    .eq("id", payload.id)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update payment method");
  }

  return data;
};

export function useEditPaymentMethod() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (payload: EditPaymentMethodPayload) => {
      const companyId = session?.user?.app_metadata?.company_id as
        | string
        | undefined;

      if (!companyId) {
        throw new Error("Company ID is missing from user session");
      }

      return dbEditPaymentMethod(payload, companyId);
    },
    onSuccess: async (result) => {
      toast.success(`Payment method "${result.name}" updated successfully`);
      await queryClient.invalidateQueries({
        queryKey: ["payment-methods"],
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update payment method",
      );
    },
  });
}
