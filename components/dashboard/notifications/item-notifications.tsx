"use client";

import { useMemo } from "react";
import { Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { NotificationsRow } from "@/hooks/notifications/useFetchNotifications";
import { cn } from "@/lib/utils";
import { relativeTime } from "./sidebar-notifcation";

interface NotificationItemProps {
  notification: NotificationsRow;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onViewDetail: (notification: NotificationsRow) => void;
  isPending: boolean;
}

export default function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
  onViewDetail,
  isPending,
}: NotificationItemProps) {
  const isUnread = !notification.read_at;

  const timeAgo = useMemo(
    () => relativeTime(notification.created_at),
    [notification.created_at],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onViewDetail(notification)}
      onKeyDown={(e) => e.key === "Enter" && onViewDetail(notification)}
      className={cn(
        "group relative flex cursor-pointer flex-col gap-1 px-4 py-3 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        isUnread && "border-l-2 border-l-primary pl-3.5",
      )}
    >
      {/* Unread dot */}
      {isUnread && (
        <span className="absolute top-3.5 right-4 h-2 w-2 rounded-full bg-primary" />
      )}

      {/* Entity type pill */}
      {notification.entity_type && (
        <Badge
          variant="secondary"
          className="mb-0.5 w-fit text-[10px] h-4 px-1.5 capitalize"
        >
          {notification.entity_type}
        </Badge>
      )}

      {/* Title */}
      <p
        className={cn(
          "pr-6 text-sm leading-snug",
          isUnread
            ? "font-semibold text-foreground"
            : "font-medium text-muted-foreground",
        )}
      >
        {notification.title}
      </p>

      {/* Body preview */}
      {notification.body && (
        <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
          {notification.body}
        </p>
      )}

      {/* Time + actions */}
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground/70">{timeAgo}</span>
        <div
          className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          {isUnread && (
            <Button
              variant="ghost"
              size="icon-xs"
              title="Mark as read"
              disabled={isPending}
              onClick={() => onMarkRead(notification.id)}
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
            >
              <Check className="h-3.5 w-3.5" />
              <span className="sr-only">Mark as read</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-xs"
            title="Delete notification"
            disabled={isPending}
            onClick={() => onDelete(notification.id)}
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
