import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const dbDelReviewType = async (id: string, companyId: string) => {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("review_types")
    .update({ deleted_at: now })
    .eq("id", id)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to delete review type");
  }

  return data;
};

export function useDelReviewType() {
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

      return dbDelReviewType(id, companyId);
    },
    onSuccess: async (result) => {
      toast.success(`Review type "${result.name}" deleted successfully`);
      await queryClient.invalidateQueries({
        queryKey: ["review-types"],
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete review type",
      );
    },
  });
}
