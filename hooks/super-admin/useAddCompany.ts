import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface AddCompanyPayload {
  name: string;
}

async function addCompany(payload: AddCompanyPayload) {
  const { data, error } = await supabase
    .from("companies")
    .insert({ name: payload.name })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export function useAddCompany() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: addCompany,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["super-admin"] });
      toast.success("Company created successfully.");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
