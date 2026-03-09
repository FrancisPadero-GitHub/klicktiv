"use client";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { QueryStatePanel } from "@/components/misc/query-state-panel";

// Hooks client side
import { useFetchTechSummary } from "@/hooks/technicians/useFetchTechSummary";
import {
  useFetchTechnicians,
  type TechnicianDetailRow,
} from "@/hooks/technicians/useFetchTechnicians";
import { useFilterTechTable } from "@/features/store/technician/useFilterTechTable";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n,
  );

export function TechnicianCardsGrid() {
  const showRemoved = useFilterTechTable((state) => state.showRemoved);

  const {
    data: summaries = [],
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    error: summaryError,
  } = useFetchTechSummary();
  const {
    data: techDetails = [],
    isLoading: isDetailsLoading,
    isError: isDetailsError,
    error: detailsError,
  } = useFetchTechnicians();

  const isLoading = isSummaryLoading || isDetailsLoading;
  const isError = isSummaryError || isDetailsError;
  const errorMessage = summaryError?.message || detailsError?.message;

  /** Map technician_id → detail row for commission/email/hired_date */
  const detailMap = useMemo(() => {
    const m = new Map<string, TechnicianDetailRow>();
    for (const d of techDetails) if (d.id) m.set(d.id, d);
    return m;
  }, [techDetails]);

  const technicians = useMemo(
    () =>
      summaries.map((s) => {
        const detail = s.technician_id ? detailMap.get(s.technician_id) : null;
        return {
          ...s,
          isDeleted: detail?.deleted_at != null,
          commission: detail?.commission ?? null,
          email: detail?.email ?? null,
          hired_date: detail?.hired_date ?? null,
        };
      }),
    [summaries, detailMap],
  );

  const visibleTechnicians = useMemo(
    () =>
      technicians.filter((tech) =>
        showRemoved ? tech.isDeleted : !tech.isDeleted,
      ),
    [technicians, showRemoved],
  );

  return (
    <QueryStatePanel
      isLoading={isLoading}
      isError={isError}
      errorMessage={errorMessage}
      loadingMessage="Loading technicians..."
    >
      <div className="flex h-full gap-4 overflow-x-auto pb-2">
        {visibleTechnicians.map((tech) => {
          const initials = (tech.name || "?")
            .split(" ")
            .map((n) => n[0])
            .join("");
          const badgeClass = tech.isDeleted
            ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";

          return (
            <div
              key={tech.technician_id}
              className={cn(
                "w-md shrink-0 rounded-xl border p-6 bg-card border-border",
                tech.isDeleted && "opacity-70",
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                    {initials}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      {tech.name || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tech.email || "-"}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                    badgeClass,
                  )}
                >
                  {tech.isDeleted ? "Removed" : "Active"}
                </span>
              </div>

              {/* Details */}
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
                <div>
                  <p className="text-xs text-muted-foreground/70">
                    Commission Rate
                  </p>
                  <p className="mt-0.5 text-lg font-bold text-foreground">
                    {tech.commission ?? 0} %
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground/70">
                    Jobs Completed
                  </p>
                  <p className="mt-0.5 text-lg font-bold text-foreground">
                    {tech.total_jobs ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground/70">
                    Total Gross
                  </p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground/80">
                    {fmt(tech.gross_revenue ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground/70">
                    Company Net Revenue Gained
                  </p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-primary/80">
                    {fmt(tech.total_company_net ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground/70">
                    Tech Total Earned
                  </p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-success">
                    {fmt(tech.total_commission_earned ?? 0)}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground/60">
                <span>
                  {tech.isDeleted
                    ? "Removed"
                    : `Hired ${
                        tech.hired_date
                          ? new Date(tech.hired_date).toLocaleDateString()
                          : "N/A"
                      }`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </QueryStatePanel>
  );
}
