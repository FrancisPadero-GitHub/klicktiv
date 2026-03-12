"use client";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ViewJobsRow } from "@/hooks/jobs/useFetchJobTable";
import {
  MapPin,
  User,
  Tag,
  CreditCard,
  FileText,
  DollarSign,
  // Wrench,
  BadgeCheck,
  Star,
  StickyNote,
  Pencil,
  Trash2,
  Phone,
  Mail,
  Clock3,
} from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n,
  );

const fmtDateTime = (value: string | null | undefined) => {
  if (!value) return "-";

  return new Date(value).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
};

const paymentColors: Record<string, string> = {
  cash: "bg-success/10 text-success",
  check: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "credit card":
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  zelle: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

export const paymentStatusColors: Record<string, string> = {
  full: "bg-success/10 text-success",
  partial: "bg-warning/10 text-warning",
};

const statusColors: Record<string, string> = {
  done: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
  pending: "bg-info/10 text-info",
};

interface JobViewDialogProps {
  job: ViewJobsRow | null;
  techName?: string;
  commRate?: number | null;
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
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="mt-0.5 text-sm text-foreground">{children}</div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        // 1. Added 'flex flex-col justify-between'
        // 2. Added a minimum height (e.g., h-24 or min-h-[100px])
        "flex flex-col justify-between min-h-25 rounded-lg border border-border bg-muted/50 px-4 py-3",
        className,
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-base font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function JobViewDialog({
  job,
  techName,
  commRate,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: JobViewDialogProps) {
  const router = useRouter();

  if (!job) return null;

  const statusKey = (job.status ?? "pending").toLowerCase();
  const payStatusKey = (job.payment_status as "full" | "partial").toLowerCase();
  const paymentKey = (job.payment_method ?? "").toLowerCase();
  const initials = techName
    ? techName
        .split(" ")
        .map((n) => n[0])
        .join("")
    : "?";

  const hasReview = !!job.review_id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full sm:max-w-4xl flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="min-w-0">
              <DialogTitle className="truncate text-lg font-semibold text-foreground">
                {job.work_title ?? "Untitled Job"}
              </DialogTitle>
              {job.work_order_date && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {new Date(job.work_order_date).toLocaleString("en-PH", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
            <span
              className={cn(
                "mt-0.5 inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                statusColors[statusKey] ?? "bg-muted text-muted-foreground",
              )}
            >
              {job.status ?? "pending"}
            </span>
          </div>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-2 no-scrollbar">
          {/* Financial summary cards */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatCard
              label="Subtotal"
              value={fmt(job.subtotal ?? 0)}
              className="text-foreground"
            />

            <StatCard
              label="Deposit"
              value={fmt(job.deposits ?? 0)}
              className="text-[#64748B]"
            />
            <StatCard
              label="Tip"
              value={fmt(job.tip_amount ?? 0)}
              className="text-foreground"
            />
            <StatCard
              label="Parts Cost"
              value={fmt(job.parts_total_cost ?? 0)}
              className="text-primary"
            />
            <StatCard
              label="Net Revenue"
              value={fmt(job.net_revenue ?? 0)}
              className="text-chart-3"
            />
            <StatCard
              label="Commission"
              value={fmt(job.total_commission ?? 0)}
              className="text-amber-600 dark:text-amber-400"
            />
            <StatCard
              label="Company Net"
              value={fmt(job.total_company_net ?? 0)}
              className="text-success"
            />
            <StatCard
              label="Review"
              value={fmt(job.review_amount ?? 0)}
              className="text-foreground"
            />
          </div>

          {/* Details grid */}

          <div className="grid gap-4 sm:grid-cols-3">
            {/* Left column - Text info details */}
            <div className="space-y-4">
              {/* Technician */}
              <InfoRow icon={User} label="Technician">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                    {initials}
                  </div>
                  <span>{techName ?? "-"}</span>
                  {commRate != null && (
                    <span className="text-xs text-muted-foreground">
                      ({commRate}%)
                    </span>
                  )}
                </div>
              </InfoRow>

              {/* Address */}
              <InfoRow icon={MapPin} label="Address">
                <span>{job.address ?? "-"}</span>
                {job.region && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    {job.region}
                  </span>
                )}
              </InfoRow>

              {/* Category */}
              <InfoRow icon={Tag} label="Category">
                {job.category ?? "-"}
              </InfoRow>
            </div>

            {/* Center column - Contact info */}
            <div className="space-y-4">
              {/* Contact Number */}
              <InfoRow icon={Phone} label="Contact Number">
                {job.contact_no ?? "-"}
              </InfoRow>

              {/* Contact Email */}
              <InfoRow icon={Mail} label="Contact Email">
                {job.contact_email ?? "-"}
              </InfoRow>

              {/* Payment Method */}
              <InfoRow icon={CreditCard} label="Payment Method">
                <span
                  className={cn(
                    "inline-flex justify-center items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize min-w-15",
                    paymentColors[paymentKey] ??
                      "bg-muted text-muted-foreground",
                  )}
                >
                  {job.payment_method ?? "-"}
                </span>
              </InfoRow>

              {/* Payment Status */}
              <InfoRow icon={DollarSign} label="Payment Status">
                <span
                  className={cn(
                    "inline-flex justify-center items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize min-w-15 ",
                    paymentStatusColors[payStatusKey] ??
                      "bg-muted text-muted-foreground",
                  )}
                >
                  {job.payment_status ?? "-"}
                </span>
              </InfoRow>
            </div>

            {/* Right column - Numbers */}
            <div className="space-y-4">
              {/* Tip */}
              {/* <InfoRow icon={DollarSign} label="Tip">
                {fmt(job.tip_amount ?? 0)}
              </InfoRow> */}

              {/* Net Revenue */}
              {/* <InfoRow icon={Wrench} label="Net Revenue">
                {fmt(job.net_revenue ?? 0)}
              </InfoRow> */}

              {/* Marked done at */}
              <InfoRow icon={Star} label="Marked done at">
                {fmtDateTime(job.promoted_at)}
              </InfoRow>

              {/* Last Updated */}
              <InfoRow icon={Clock3} label="Last Updated">
                {fmtDateTime(job.updated_at)}
              </InfoRow>

              {/* Last Updated */}
              <InfoRow icon={BadgeCheck} label="Handled by">
                {job.name ?? "-"}
              </InfoRow>
            </div>
          </div>

          {/* Description */}
          <InfoRow icon={FileText} label="Description">
            {job.description ? (
              <p className="whitespace-pre-wrap">{job.description}</p>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </InfoRow>

          {/* Notes */}
          {job.notes && (
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <div className="mb-1.5 flex items-center gap-2">
                <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Notes
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {job.notes}
              </p>
            </div>
          )}

          {/* Review */}
          {hasReview && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/40 dark:bg-amber-950/20">
              <div className="mb-2 flex items-center gap-2">
                <Star className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-[11px] font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
                  Review
                </span>
                {job.review_date && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(job.review_date).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div className="grid gap-1 text-sm text-foreground">
                {job.review_type && (
                  <p>
                    <span className="font-medium">Type:</span> {job.review_type}
                  </p>
                )}
                {job.review_amount != null && (
                  <p>
                    <span className="font-medium">Amount:</span>{" "}
                    {fmt(job.review_amount)}
                  </p>
                )}
                {job.review_notes && (
                  <p className="mt-1 whitespace-pre-wrap">{job.review_notes}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <DialogFooter className="border-t border-border pt-4 sm:justify-between">
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
              variant="secondary"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                onOpenChange(false);
                if (hasReview && job.review_id) {
                  const params = new URLSearchParams({
                    highlightReviewId: job.review_id,
                  });
                  router.push(`/dashboard/reviews?${params.toString()}`);
                  return;
                }

                if (job.work_order_id) {
                  const params = new URLSearchParams({
                    open: "add",
                    jobId: job.work_order_id,
                  });
                  router.push(`/dashboard/reviews?${params.toString()}`);
                } else {
                  router.push("/dashboard/reviews?open=add");
                }
              }}
            >
              <Star className="h-3.5 w-3.5" />
              Review
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => {
                onEdit?.();
                onOpenChange(false);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
