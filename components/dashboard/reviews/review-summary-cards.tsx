"use client";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { QueryStatePanel } from "@/components/misc/query-state-panel";
import { useFetchReviewRecordsSummaries } from "@/hooks/reviews/useFetchReviewSummaries";
import {
  BadgeDollarSign,
  ClipboardList,
  ListChecks,
  WalletCards,
} from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n,
  );

const num = (n: number) => new Intl.NumberFormat("en-US").format(n);

export function ReviewSummaryCards() {
  const {
    data: summary,
    isLoading,
    isError,
    error,
  } = useFetchReviewRecordsSummaries();

  const summaryData = useMemo(() => summary?.[0] || null, [summary]);

  const cards = useMemo(
    () => [
      {
        title: "Total Review Amount",
        value: fmt(summaryData?.total_review_amount ?? 0),
        icon: WalletCards,
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-50 dark:bg-emerald-900/20",
      },
      {
        title: "Avg Review Amount",
        value: fmt(summaryData?.avg_review_amount ?? 0),
        icon: BadgeDollarSign,
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-50 dark:bg-blue-900/20",
      },
      // FOR SOME REASON THIS WAS REMOVED IN THE LATEST SCHEMA UPDATE, CAN ADD BACK IF NEEDED
      // {
      //   title: "Avg / Reviewed Job",
      //   value: fmt(summaryData?.avg_amount_per_reviewed_job ?? 0),
      //   icon: CircleDollarSign,
      //   color: "text-violet-600 dark:text-violet-400",
      //   bg: "bg-violet-50 dark:bg-violet-900/20",
      // },
      // {
      //   title: "Min Review Amount",
      //   value: fmt(summaryData?.min_review_amount ?? 0),
      //   icon: TrendingDown,
      //   color: "text-amber-600 dark:text-amber-400",
      //   bg: "bg-amber-50 dark:bg-amber-900/20",
      // },
      // {
      //   title: "Coverage Ratio",
      //   value: pct(summaryData?.review_coverage_ratio ?? 0),
      //   icon: ClipboardCheck,
      //   color: "text-cyan-600 dark:text-cyan-400",
      //   bg: "bg-cyan-50 dark:bg-cyan-900/20",
      // },
      // {
      //   title: "Total Done Jobs",
      //   value: num(summaryData?.total_done_jobs ?? 0),
      //   icon: BriefcaseBusiness,
      //   color: "text-zinc-900 dark:text-zinc-50",
      //   bg: "bg-zinc-100 dark:bg-zinc-800",
      // },
      {
        title: "Jobs With Reviews",
        value: num(summaryData?.total_jobs_with_reviews ?? 0),
        icon: ClipboardList,
        color: "text-indigo-600 dark:text-indigo-400",
        bg: "bg-indigo-50 dark:bg-indigo-900/20",
      },
      {
        title: "Jobs Without Reviews",
        value: num(summaryData?.total_jobs_without_reviews ?? 0),
        icon: ListChecks,
        color: "text-orange-600 dark:text-orange-400",
        bg: "bg-orange-50 dark:bg-orange-900/20",
      },
    ],
    [summaryData],
  );

  return (
    <QueryStatePanel
      isLoading={isLoading}
      isError={isError}
      errorMessage={error?.message}
      loadingMessage="Loading review summary..."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-4">
        {cards.map(({ title, value, icon: Icon, color, bg }) => (
          <div
            key={title}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                {title}
              </p>
              <div className={cn("rounded-md p-1.5", bg)}>
                <Icon className={cn("h-3.5 w-3.5", color)} />
              </div>
            </div>
            <p className={cn("mt-2 text-2xl font-bold tabular-nums", color)}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </QueryStatePanel>
  );
}
