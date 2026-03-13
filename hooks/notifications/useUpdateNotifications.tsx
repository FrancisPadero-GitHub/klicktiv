import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/database.types";
import type { NotificationsRow } from "./useFetchNotifications";

type NotificationUpdate =
  Database["public"]["Tables"]["notifications"]["Update"] & {
    deleted_at?: string | null;
  };

type UpdateNotificationInput = {
  id: string;
  readAt?: string | null;
  deletedAt?: string | null;
};

const updateNotification = async (
  input: UpdateNotificationInput,
): Promise<NotificationsRow> => {
  const updates: NotificationUpdate = {};

  if (typeof input.readAt !== "undefined") {
    updates.read_at = input.readAt;
  }

  if (typeof input.deletedAt !== "undefined") {
    updates.deleted_at = input.deletedAt;
  }

  if (Object.keys(updates).length === 0) {
    throw new Error("No updates provided");
  }

  const { data, error } = await supabase
    .from("notifications")
    .update(updates as Database["public"]["Tables"]["notifications"]["Update"])
    .eq("id", input.id)
    .select("*")
    .single();

  if (error) throw new Error(error.message || "Failed to update notification");

  return data as NotificationsRow;
};

export function useUpdateNotifications() {
  const { session } = useAuth();
  const companyId = session?.user.app_metadata.company_id as string | undefined;
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const queryKey = [
    "notifications",
    companyId ?? null,
    userId ?? null,
  ] as const;

  const mutation = useMutation({
    mutationFn: updateNotification,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey, exact: false });
    },
  });

  const updateReadAt = (id: string, readAt = new Date().toISOString()) =>
    mutation.mutate({ id, readAt });

  const updateReadAtAsync = (id: string, readAt = new Date().toISOString()) =>
    mutation.mutateAsync({ id, readAt });

  const softDeleteNotification = (
    id: string,
    deletedAt = new Date().toISOString(),
  ) => mutation.mutate({ id, deletedAt });

  const softDeleteNotificationAsync = (
    id: string,
    deletedAt = new Date().toISOString(),
  ) => mutation.mutateAsync({ id, deletedAt });

  return {
    ...mutation,
    updateReadAt,
    updateReadAtAsync,
    softDeleteNotification,
    softDeleteNotificationAsync,
  };
}
