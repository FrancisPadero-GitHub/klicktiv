"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  memo,
  type MouseEvent,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useFetchViewJobRow } from "@/hooks/jobs/useFetchJobTable";
import { useFetchTechSummary } from "@/hooks/technicians/useFetchTechSummary";
import { useFetchTechnicians } from "@/hooks/technicians/useFetchTechnicians";
import { shortId, fmt } from "@/lib/helper";
import { paymentStatusColors } from "@/components/dashboard/jobs/job-view-dialog";

export const RecentJobsList = memo(function RecentJobsList() {
  const router = useRouter();
  const [isShaking, setIsShaking] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerViewAllAttention = useCallback(() => {
    // Clear any existing timers
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);

    // Trigger both shake + highlight simultaneously
    setIsShaking(true);
    setIsHighlighted(true);

    shakeTimerRef.current = setTimeout(() => setIsShaking(false), 600);
    highlightTimerRef.current = setTimeout(() => setIsHighlighted(false), 1200);
  }, []);

  const handleViewAllClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      if (isShaking) return;
      setIsShaking(true);
      shakeTimerRef.current = setTimeout(() => {
        setIsShaking(false);
        router.push("/dashboard/jobs");
      }, 400);
    },
    [isShaking, router],
  );

  useEffect(() => {
    return () => {
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, []);

  const { data: jobs = [], isLoading, isError } = useFetchViewJobRow();
  const { data: techSummary = [] } = useFetchTechSummary();
  const { data: techDetails = [] } = useFetchTechnicians();

  const techNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of techSummary) {
      if (t.technician_id && t.name) map.set(t.technician_id, t.name);
    }
    return map;
  }, [techSummary]);

  const techCommissionMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of techDetails) {
      if (t.id) map.set(t.id, t.commission);
    }
    return map;
  }, [techDetails]);

  const recentJobs = useMemo(() => {
    return [...jobs]
      .sort((a, b) => {
        const av = a.created_at as string | number;
        const bv = b.created_at as string | number;
        let cmp = 0;
        if (typeof av === "number" && typeof bv === "number") {
          cmp = av - bv;
        } else {
          cmp = String(av).localeCompare(String(bv));
        }
        return -cmp;
      })
      .slice(0, 5);
  }, [jobs]);

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Recent Jobs
          </h3>
          <p className="text-xs text-muted-foreground">
            Showing {recentJobs.length} most recent
          </p>
        </div>
        <Link
          href="/dashboard/jobs"
          onClick={handleViewAllClick}
          className={cn(
            "group relative flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium shadow-sm transition-all duration-300",
            // Base idle state
            "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
            // Highlighted state — glows + fills with accent color
            isHighlighted &&
              "border-primary/60 bg-primary/10 text-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]",
            // Shake animation
            isShaking && "animate-shake",
          )}
        >
          {/* Ripple ring that expands outward when highlighted */}
          {isHighlighted && (
            <span className="pointer-events-none absolute inset-0 rounded-lg animate-ping-once border border-primary/40" />
          )}
          View all
          <ArrowUpRight
            className={cn(
              "h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
              isHighlighted && "-translate-y-0.5 translate-x-0.5",
            )}
          />
        </Link>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Spinner />
        </div>
      ) : isError ? (
        <div className="rounded-b-xl bg-destructive/10 p-6 text-center text-sm text-destructive">
          Failed to load jobs.
        </div>
      ) : recentJobs.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          No jobs found.
        </div>
      ) : (
        <ul className="max-h-120 divide-y divide-border/50 overflow-y-auto no-scrollbar">
          {recentJobs.map((job) => {
            const techName = job.technician_id
              ? (techNameMap.get(job.technician_id) ?? "-")
              : "-";
            const commRate = job.technician_id
              ? techCommissionMap.get(job.technician_id)
              : null;
            const initials =
              techName === "-"
                ? "?"
                : techName
                    .split(" ")
                    .map((n) => n[0])
                    .join("");

            return (
              <li
                key={job.work_order_id}
                onClick={triggerViewAllAttention}
                className={cn(
                  "flex flex-col gap-3 p-4 transition-colors hover:bg-muted/50 cursor-pointer",
                  job.payment_status === "partial" && "bg-warning/10",
                  job.status === "pending" && "bg-info/10",
                )}
              >
                {/* Row 1: ID + Title + Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      #{shortId(job.work_order_id ?? "-")}
                    </span>
                    <span className="text-sm font-semibold leading-tight text-foreground">
                      {job.work_title ?? "-"}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {job.work_order_date
                        ? new Date(job.work_order_date).toLocaleDateString()
                        : "-"}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs capitalize",
                        paymentStatusColors[
                          (job.payment_status as string).toLowerCase()
                        ] ?? "bg-muted text-muted-foreground",
                      )}
                    >
                      {job.payment_status ?? "-"}
                    </Badge>
                  </div>
                </div>

                {/* Row 2: Address + Technician */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="max-w-50 truncate">
                      {job.address ?? "-"}
                      {job.region && (
                        <span className="ml-1 text-muted-foreground/70">
                          {job.region}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="bg-muted text-[10px]">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-foreground">{techName}</span>
                    {commRate != null && (
                      <span className="text-muted-foreground">
                        ({commRate}%)
                      </span>
                    )}
                  </div>
                </div>

                {/* Row 3: Financial stats */}
                <div className="grid grid-cols-4 gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium tabular-nums text-foreground">
                      {fmt(job.subtotal ?? 0)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground">Net Revenue</span>
                    <span className="font-medium tabular-nums text-chart-3">
                      {fmt(job.net_revenue ?? 0)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground">Commission</span>
                    <span className="font-medium tabular-nums text-amber-600">
                      {fmt(job.total_commission ?? 0)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground">Company Net</span>
                    <span className="font-medium tabular-nums text-success">
                      {fmt(job.total_company_net ?? 0)}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});
