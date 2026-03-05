import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/database.types";

export type PaymentMethodRow =
  Database["public"]["Tables"]["payment_methods"]["Row"];

export const fetchPaymentMethods = async (
  companyId: string,
): Promise<PaymentMethodRow[]> => {
  const { data, error } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error)
    throw new Error(error.message || "Failed to fetch payment methods");

  return data as PaymentMethodRow[];
};

export function useFetchPaymentMethods() {
  const { session } = useAuth();
  const companyId = session?.user?.app_metadata?.company_id as
    | string
    | undefined;

  return useQuery<PaymentMethodRow[], Error>({
    queryKey: ["payment-methods", companyId ?? null],
    queryFn: () => {
      if (!companyId) {
        throw new Error("Company ID is missing from user session");
      }

      return fetchPaymentMethods(companyId);
    },
    enabled: Boolean(companyId),
    staleTime: 1000 * 60 * 10, // 10 minutes, these rarely change
  });
}
