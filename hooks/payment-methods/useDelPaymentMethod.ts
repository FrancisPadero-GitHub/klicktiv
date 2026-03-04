import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const dbDelPaymentMethod = async (id: string, companyId: string) => {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("payment_methods")
    .update({ deleted_at: now })
    .eq("id", id)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to delete payment method");
  }

  return data;
};

export function useDelPaymentMethod() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const companyId = session?.user?.app_metadata?.company_id as
        | string
        | undefined;

      if (!companyId) {
        throw new Error("Company ID is missing from user session");
      }

      return dbDelPaymentMethod(id, companyId);
    },
    onSuccess: async (result) => {
      toast.success(`Payment method "${result.name}" deleted successfully`);
      await queryClient.invalidateQueries({
        queryKey: ["payment-methods"],
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete payment method",
      );
    },
  });
}
