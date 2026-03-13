"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { NotificationsRow } from "@/hooks/notifications/useFetchNotifications";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, ExternalLink } from "lucide-react";
import { relativeTime } from "./sidebar-notifcation";

interface NotificationDetailDialogProps {
  notification: NotificationsRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}

function absoluteTime(dateStr: string | null) {
  if (!dateStr) return null;
  try {
    return format(new Date(dateStr), "MMM d, yyyy 'at' h:mm a");
  } catch {
    return dateStr;
  }
}

export default function NotificationDetailDialog({
  notification,
  open,
  onOpenChange,
  onDelete,
  isPending,
}: NotificationDetailDialogProps) {
  if (!notification) return null;

  // Parse `data` JSON safely
  let parsedData: Record<string, unknown> | null = null;
  if (notification.data && typeof notification.data === "object") {
    parsedData = notification.data as Record<string, unknown>;
  }

  const isRead = Boolean(notification.read_at);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        {/* Header */}
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {!isRead && (
                  <Badge
                    variant="destructive"
                    className="text-[10px] h-4 px-1.5"
                  >
                    Unread
                  </Badge>
                )}
                {notification.entity_type && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] h-4 px-1.5 capitalize"
                  >
                    {notification.entity_type}
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-base leading-snug">
                {notification.title}
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs text-muted-foreground">
                {relativeTime(notification.created_at)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <ScrollArea className="max-h-[60vh]">
          <div className="flex flex-col gap-0 divide-y divide-border">
            {/* Notification body text */}
            {notification.body && (
              <div className="px-6 py-4">
                <p className="text-sm leading-relaxed text-foreground">
                  {notification.body}
                </p>
              </div>
            )}

            {/* Meta fields */}
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 px-6 py-4 text-xs">
              {/* Created at */}
              <span className="text-muted-foreground font-medium whitespace-nowrap">
                Received
              </span>
              <span className="text-foreground">
                {absoluteTime(notification.created_at)}
              </span>

              {/* Delivered at */}
              {notification.delivered_at && (
                <>
                  <span className="text-muted-foreground font-medium whitespace-nowrap">
                    Delivered
                  </span>
                  <span className="text-foreground">
                    {absoluteTime(notification.delivered_at)}
                  </span>
                </>
              )}

              {/* Read at */}
              {notification.read_at && (
                <>
                  <span className="text-muted-foreground font-medium whitespace-nowrap">
                    Read
                  </span>
                  <span className="text-foreground">
                    {absoluteTime(notification.read_at)}
                  </span>
                </>
              )}

              {/* Entity type + ID */}
              {notification.entity_type && (
                <>
                  <span className="text-muted-foreground font-medium whitespace-nowrap">
                    Type
                  </span>
                  <span className="text-foreground capitalize">
                    {notification.entity_type}
                  </span>
                </>
              )}
              {notification.entity_id && (
                <>
                  <span className="text-muted-foreground font-medium whitespace-nowrap">
                    Reference&nbsp;ID
                  </span>
                  <span className="font-mono text-[11px] text-foreground break-all">
                    {notification.entity_id}
                  </span>
                </>
              )}

              {/* Dedupe key */}
              {notification.dedupe_key && (
                <>
                  <span className="text-muted-foreground font-medium whitespace-nowrap">
                    Dedupe&nbsp;Key
                  </span>
                  <span className="font-mono text-[11px] text-foreground break-all">
                    {notification.dedupe_key}
                  </span>
                </>
              )}
            </div>

            {/* Extra data payload (JSON) */}
            {parsedData && Object.keys(parsedData).length > 0 && (
              <div className="px-6 py-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Additional Data
                </p>
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-xs">
                  {Object.entries(parsedData).map(([key, value]) => (
                    <span key={key} className="contents">
                      <span className="text-muted-foreground font-medium capitalize whitespace-nowrap">
                        {key.replace(/_/g, " ")}
                      </span>
                      <span className="text-foreground break-all">
                        {typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value ?? "—")}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t px-6 py-3">
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5"
            disabled={isPending}
            onClick={() => {
              onDelete(notification.id);
              onOpenChange(false);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
          {notification.entity_id && notification.entity_type && (
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <a
                href={`#${notification.entity_type}/${notification.entity_id}`}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View {notification.entity_type}
              </a>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
