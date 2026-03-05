"use client";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { EstimatesRow } from "@/hooks/estimates/useFetchEstimates";
import type { EstimateStatus } from "@/types/estimate";
import {
  MapPin,
  User,
  Tag,
  FileText,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  Clock3,
  StickyNote,
  Pencil,
  Trash2,
  ClipboardCheck,
  BadgeCheck,
} from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n,
  );

const fmtDateTime = (value: string | null | undefined) => {
  if (!value) return "-";

  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusStyles: Record<EstimateStatus, string> = {
  follow_up:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  approved:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  denied: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const statusLabels: Record<EstimateStatus, string> = {
  follow_up: "Follow Up",
  approved: "Approved",
  denied: "Denied",
};

export type EstimatesRowWithNotes = EstimatesRow & { notes?: string | null };

interface EstimateViewDialogProps {
  estimate: EstimatesRowWithNotes | null;
  techName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800">
        <Icon className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          {label}
        </p>
        <div className="mt-0.5 text-sm text-zinc-800 dark:text-zinc-200">
          {children}
        </div>
      </div>
    </div>
  );
}

export function EstimateViewDialog({
  estimate,
  techName,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: EstimateViewDialogProps) {
  if (!estimate) return null;

  const statusKey = estimate.estimate_status as EstimateStatus | null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {estimate.work_title ?? "Estimate Details"}
            </DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto py-2 pr-2">
            <InfoRow icon={Calendar} label="Date">
              {estimate.work_order_date
                ? new Date(estimate.work_order_date).toLocaleDateString()
                : "—"}
            </InfoRow>

            <InfoRow icon={MapPin} label="Address">
              {estimate.address ?? "—"}
              {estimate.region && (
                <span className="ml-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                  {estimate.region}
                </span>
              )}
            </InfoRow>

            <InfoRow icon={Phone} label="Contact Number">
              {estimate.contact_no ?? "—"}
            </InfoRow>

            <InfoRow icon={Mail} label="Contact Email">
              {estimate.contact_email ?? "—"}
            </InfoRow>

            <InfoRow icon={User} label="Technician">
              {techName ?? "—"}
            </InfoRow>

            {estimate.category && (
              <InfoRow icon={Tag} label="Category">
                {estimate.category}
              </InfoRow>
            )}

            <InfoRow icon={FileText} label="Description">
              {estimate.description ?? "—"}
            </InfoRow>

            <InfoRow icon={DollarSign} label="Estimated Amount">
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {fmt(Number(estimate.estimated_amount ?? 0))}
              </span>
            </InfoRow>

            <InfoRow icon={ClipboardCheck} label="Status">
              {statusKey ? (
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                    statusStyles[statusKey],
                  )}
                >
                  {statusLabels[statusKey]}
                </span>
              ) : (
                "—"
              )}
            </InfoRow>

            <InfoRow icon={BadgeCheck} label="Handled By">
              {estimate.handled_by ?? "—"}
            </InfoRow>

            <InfoRow icon={Clock3} label="Last Updated">
              {fmtDateTime(estimate.updated_at)}
            </InfoRow>

            <InfoRow icon={Clock3} label="Promoted At">
              {fmtDateTime(estimate.promoted_at)}
            </InfoRow>

            {estimate.notes && (
              <InfoRow icon={StickyNote} label="Notes">
                {estimate.notes}
              </InfoRow>
            )}
          </div>

          <DialogFooter className="border-t border-zinc-200 pt-4 dark:border-zinc-700 sm:justify-between">
            <DialogClose asChild>
              <Button variant="outline" size="sm">
                Close
              </Button>
            </DialogClose>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5"
                onClick={onDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  onOpenChange(false);
                  onEdit?.();
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
