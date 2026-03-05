import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

async function deleteCompany(id: string) {
  // Soft delete
  const { error } = await supabase
    .from("companies")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export function useDeleteCompany() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: deleteCompany,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["super-admin"] });
      toast.success("Company deactivated.");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
