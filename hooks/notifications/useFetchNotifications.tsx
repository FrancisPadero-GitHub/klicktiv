import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/database.types";

export type NotificationsRow =
  Database["public"]["Tables"]["notifications"]["Row"];

export const fetchNotifications = async (
  companyId: string,
): Promise<NotificationsRow[]> => {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message || "Failed to fetch notifications");

  return data as NotificationsRow[];
};

export function useFetchNotifications() {
  const { session } = useAuth();
  const companyId = session?.user.app_metadata.company_id as string | undefined;

  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => ["notifications", companyId ?? null] as const,
    [companyId],
  );

  const query = useQuery<NotificationsRow[], Error>({
    queryKey,
    queryFn: () => {
      if (!companyId) {
        throw new Error("Company ID or user ID is missing from user session");
      }

      return fetchNotifications(companyId);
    },
    enabled: Boolean(companyId),
  });

  useEffect(() => {
    if (!companyId) return;

    const channel = supabase
      .channel(`notifications:${companyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${companyId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel).catch((err) => {
        console.error("Error removing channel:", err);
      });
    };
  }, [companyId, queryClient, queryKey]);

  return query;
}
