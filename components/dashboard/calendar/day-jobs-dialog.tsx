import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ViewJobsRow } from "@/hooks/jobs/useFetchJobTable";

interface DayJobsDialogProps {
  date: Date | null;
  jobs: ViewJobsRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobClick: (job: ViewJobsRow) => void;
  techMap: Map<string, { name: string; commission: number }>;
}

export function DayJobsDialog({
  date,
  jobs,
  open,
  onOpenChange,
  onJobClick,
  techMap,
}: DayJobsDialogProps) {
  if (!date) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-zinc-950">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Jobs on {format(date, "MMMM d, yyyy")}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 flex max-h-[60vh] flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
          {jobs.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No jobs scheduled for this date.
            </p>
          ) : (
            jobs.map((job) => {
              const isDone = job.status === "done";
              const techName = job.technician_id
                ? techMap.get(job.technician_id)?.name || "Unknown Tech"
                : "No Tech";

              return (
                <button
                  key={job.work_order_id}
                  onClick={() => onJobClick(job)}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors hover:bg-zinc-50 focus:outline-none dark:hover:bg-zinc-900",
                    isDone
                      ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                      : "border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20"
                  )}
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                        #{job.work_order_id?.slice(0, 8)}
                      </span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {job.work_title || "Unnamed Job"}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                        isDone
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                      )}
                    >
                      {job.status}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-col gap-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <span className="font-medium">Technician:</span> {techName}
                    </span>
                    {job.address && (
                      <span className="flex items-center gap-1.5 line-clamp-1">
                        <span className="font-medium">Address:</span> {job.address}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
