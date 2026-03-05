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
  Wrench,
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
  if (!value) return "—";

  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
};

const paymentColors: Record<string, string> = {
  cash: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  check: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "credit card":
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  zelle: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

const statusColors: Record<string, string> = {
  done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  pending:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
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
        "flex flex-col justify-between min-h-25 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/50",
        className,
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
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
  const paymentKey = (job.payment_method ?? "").toLowerCase();
  const initials = techName
    ? techName
        .split(" ")
        .map((n) => n[0])
        .join("")
    : "?";

  const hasReview = !!job.review_id;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3 pr-6">
              <div className="min-w-0">
                <DialogTitle className="truncate text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {job.work_title ?? "Untitled Job"}
                </DialogTitle>
                {job.work_order_date && (
                  <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                    {new Date(job.work_order_date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}
              </div>
              <span
                className={cn(
                  "mt-0.5 inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                  statusColors[statusKey] ??
                    "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
                )}
              >
                {job.status ?? "pending"}
              </span>
            </div>
          </DialogHeader>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-2">
            {/* Financial summary cards */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <StatCard
                label="Gross"
                value={fmt(job.subtotal ?? 0)}
                className="text-zinc-900 dark:text-zinc-100"
              />
              <StatCard
                label="Parts Cost"
                value={fmt(job.parts_total_cost ?? 0)}
                className="text-orange-500 dark:text-orange-400"
              />
              <StatCard
                label="Net Revenue"
                value={fmt(job.net_revenue ?? 0)}
                className="text-sky-600 dark:text-sky-400"
              />
              <StatCard
                label="Commission"
                value={fmt(job.total_commission ?? 0)}
                className="text-amber-600 dark:text-amber-400"
              />
              <StatCard
                label="Company Net"
                value={fmt(job.total_company_net ?? 0)}
                className="text-emerald-600 dark:text-emerald-400"
              />
            </div>

            {/* Details grid */}

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Left column */}
              <div className="space-y-4">
                {/* Technician */}
                <InfoRow icon={User} label="Technician">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
                      {initials}
                    </div>
                    <span>{techName ?? "—"}</span>
                    {commRate != null && (
                      <span className="text-xs text-zinc-400">
                        ({commRate}%)
                      </span>
                    )}
                  </div>
                </InfoRow>

                {/* Address */}
                <InfoRow icon={MapPin} label="Address">
                  <span>{job.address ?? "—"}</span>
                  {job.region && (
                    <span className="ml-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                      {job.region}
                    </span>
                  )}
                </InfoRow>

                {/* Category */}
                <InfoRow icon={Tag} label="Category">
                  {job.category ?? "—"}
                </InfoRow>

                {/* Contact Number */}
                <InfoRow icon={Phone} label="Contact Number">
                  {job.contact_no ?? "—"}
                </InfoRow>

                {/* Payment */}
                <InfoRow icon={CreditCard} label="Payment Method">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                      paymentColors[paymentKey] ??
                        "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
                    )}
                  >
                    {job.payment_method ?? "—"}
                  </span>
                </InfoRow>
              </div>

              {/* Right column */}
              <div className="space-y-4">
                {/* Tip */}
                <InfoRow icon={DollarSign} label="Tip">
                  {fmt(job.tip_amount ?? 0)}
                </InfoRow>

                {/* Net Revenue */}
                <InfoRow icon={Wrench} label="Net Revenue">
                  {fmt(job.net_revenue ?? 0)}
                </InfoRow>

                {/* Contact Email */}
                <InfoRow icon={Mail} label="Contact Email">
                  {job.contact_email ?? "—"}
                </InfoRow>

                {/* Marked done at */}
                <InfoRow icon={Star} label="Marked done at">
                  {fmtDateTime(job.promoted_at)}
                </InfoRow>

                {/* Last Updated */}
                <InfoRow icon={Clock3} label="Last Updated">
                  {fmtDateTime(job.updated_at)}
                </InfoRow>

                {/* Description */}
                <InfoRow icon={FileText} label="Description">
                  {job.description ? (
                    <p className="whitespace-pre-wrap">{job.description}</p>
                  ) : (
                    <span className="text-zinc-400 dark:text-zinc-500">—</span>
                  )}
                </InfoRow>
              </div>
            </div>

            {/* Notes */}
            {job.notes && (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
                <div className="mb-1.5 flex items-center gap-2">
                  <StickyNote className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                    Notes
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
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
                    <span className="ml-auto text-xs text-zinc-400">
                      {new Date(job.review_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="grid gap-1 text-sm text-zinc-700 dark:text-zinc-300">
                  {job.review_type && (
                    <p>
                      <span className="font-medium">Type:</span>{" "}
                      {job.review_type}
                    </p>
                  )}
                  {job.review_amount != null && (
                    <p>
                      <span className="font-medium">Amount:</span>{" "}
                      {fmt(job.review_amount)}
                    </p>
                  )}
                  {job.review_notes && (
                    <p className="mt-1 whitespace-pre-wrap">
                      {job.review_notes}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer actions */}
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
    </>
  );
}
