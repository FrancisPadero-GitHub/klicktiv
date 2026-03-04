import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/database.types";
import { toast } from "sonner";

type ReviewTypeUpdate = Database["public"]["Tables"]["review_types"]["Update"];

export interface EditReviewTypePayload {
  id: string;
  data: ReviewTypeUpdate;
}

const dbEditReviewType = async (
  payload: EditReviewTypePayload,
  companyId: string,
) => {
  const { data, error } = await supabase
    .from("review_types")
    .update(payload.data)
    .eq("id", payload.id)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update review type");
  }

  return data;
};

export function useEditReviewType() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (payload: EditReviewTypePayload) => {
      const companyId = session?.user?.app_metadata?.company_id as
        | string
        | undefined;

      if (!companyId) {
        throw new Error("Company ID is missing from user session");
      }

      return dbEditReviewType(payload, companyId);
    },
    onSuccess: async (result) => {
      toast.success(`Review type "${result.name}" updated successfully`);
      await queryClient.invalidateQueries({
        queryKey: ["review-types"],
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update review type",
      );
    },
  });
}
