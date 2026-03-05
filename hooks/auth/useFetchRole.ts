import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/database.types";

export type ProfilesRow = Database["public"]["Tables"]["profiles"]["Row"];

export const profileQueryKey = (userId?: string) =>
  ["profiles", "me", userId ?? "anonymous"] as const;

// Deprecated
// use the role from the session instead of fetching the profile for every user
export const fetchProfileById = async (
  userId: string,
  companyId: string,
): Promise<ProfilesRow | null> => {
  const { data: result, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to fetch profile");
  }

  return result as ProfilesRow | null;
};

// Deprecated
// use the role from the session instead of fetching the profile for every user
export function useFetchRole(userId?: string) {
  const { session } = useAuth();
  const companyId = session?.user.app_metadata.company_id as string | undefined;

  return useQuery<ProfilesRow | null, Error>({
    queryKey: [...profileQueryKey(userId), companyId ?? null],
    queryFn: () => {
      if (!userId || !companyId) {
        throw new Error("User ID or Company ID is missing");
      }

      return fetchProfileById(userId, companyId);
    },
    enabled: Boolean(userId && companyId),
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
  });
}

export const allProfilesQueryKey = ["profiles", "all"] as const;

export const fetchAllProfiles = async (
  companyId: string,
): Promise<ProfilesRow[]> => {
  const { data: result, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("company_id", companyId)
    .neq("role", "super_admin")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to fetch profiles");
  }

  return result as ProfilesRow[];
};

export function useFetchProfiles() {
  const { session } = useAuth();
  const companyId = session?.user.app_metadata.company_id as string | undefined;

  return useQuery<ProfilesRow[], Error>({
    queryKey: [...allProfilesQueryKey, companyId ?? null],
    queryFn: () => {
      if (!companyId) {
        throw new Error("Company ID is missing from user session");
      }

      return fetchAllProfiles(companyId);
    },
    enabled: Boolean(companyId),
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
  });
}
