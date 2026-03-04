import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/database.types";

type TechnicianRow = Database["public"]["Tables"]["technicians"]["Row"];

const dbSoftDeleteTechnician = async (id: string, companyId: string) => {
  const { data: result, error } = await supabase
    .from("technicians")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to delete technician");
  }

  return result as TechnicianRow;
};

const dbRestoreTechnician = async (id: string, companyId: string) => {
  const { data: result, error } = await supabase
    .from("technicians")
    .update({ deleted_at: null })
    .eq("id", id)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to restore technician");
  }

  return result as TechnicianRow;
};

const invalidateTechnicianRelatedQueries = async (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  await queryClient.invalidateQueries({
    queryKey: ["technicians"],
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
    queryKey: ["estimates"],
    exact: false,
  });
  await queryClient.invalidateQueries({
    queryKey: ["jobs", "work-orders"],
    exact: false,
  });
};

export function useDelTechnician() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation<TechnicianRow, Error, string>({
    mutationFn: async (id) => {
      const companyId = session?.user?.app_metadata?.company_id as
        | string
        | undefined;

      if (!companyId) {
        throw new Error("Company ID is missing from user session");
      }

      return dbSoftDeleteTechnician(id, companyId);
    },
    onSuccess: async (result) => {
      console.log("Technician soft-deleted successfully:", result);
      await invalidateTechnicianRelatedQueries(queryClient);
    },
    onError: (error) => {
      console.error("Error deleting technician:", error.message || error);
    },
  });
}

export function useRestoreTechnician() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation<TechnicianRow, Error, string>({
    mutationFn: async (id) => {
      const companyId = session?.user?.app_metadata?.company_id as
        | string
        | undefined;

      if (!companyId) {
        throw new Error("Company ID is missing from user session");
      }

      return dbRestoreTechnician(id, companyId);
    },
    onSuccess: async (result) => {
      console.log("Technician restored successfully:", result);
      await invalidateTechnicianRelatedQueries(queryClient);
    },
    onError: (error) => {
      console.error("Error restoring technician:", error.message || error);
    },
  });
}
