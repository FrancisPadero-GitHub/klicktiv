import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface SuperAdminStats {
  totalCompanies: number;
  activeCompanies: number;
  inactiveCompanies: number;
  totalUsers: number;
}

async function fetchSuperAdminStats(): Promise<SuperAdminStats> {
  const [{ data: companies, error: cError }, { data: users, error: uError }] =
    await Promise.all([
      supabase.from("companies").select("id, deleted_at"),
      supabase.from("company_users").select("user_id"),
    ]);

  if (cError) throw new Error(cError.message);
  if (uError) throw new Error(uError.message);

  const comp = companies;
  const activeCompanies = comp.filter((c) => c.deleted_at === null).length;

  // unique users
  const uniqueUsers = new Set(users.map((u) => u.user_id)).size;

  return {
    totalCompanies: comp.length,
    activeCompanies,
    inactiveCompanies: comp.length - activeCompanies,
    totalUsers: uniqueUsers,
  };
}

export function useSuperAdminStats() {
  return useQuery<SuperAdminStats, Error>({
    queryKey: ["super-admin", "stats"],
    queryFn: fetchSuperAdminStats,
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
}
