import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/database.types";

type TechnicianInsert = Database["public"]["Tables"]["technicians"]["Insert"];
type TechnicianRow = Database["public"]["Tables"]["technicians"]["Row"];

const dbAddTechnician = async (data: TechnicianInsert) => {
  const { data: result, error } = await supabase
    .from("technicians")
    .insert([data])
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to add technician");
  }

  return result as TechnicianRow;
};

export function useAddTechnician() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation<TechnicianRow, Error, TechnicianInsert>({
    mutationFn: async (data: TechnicianInsert) => {
      const companyId = session?.user?.app_metadata?.company_id as
        | string
        | undefined;

      if (!companyId) {
        throw new Error("Company ID is missing from user session");
      }

      return dbAddTechnician({
        ...data,
        company_id: companyId,
      });
    },
    onSuccess: async (result) => {
      void result;
      toast.success("Technician added successfully");
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
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add technician");
    },
  });
}
