"use client";

import { useMemo, useState } from "react";
import { useFetchViewJobRow } from "@/hooks/jobs/useFetchJobTable";
import { useFetchTechnicians } from "@/hooks/technicians/useFetchTechnicians";
import { useJobStore } from "@/features/store/jobs/useFormJobStore";
import { JobViewDialog } from "@/components/dashboard/jobs/job-view-dialog";
import type { ViewJobsRow } from "@/hooks/jobs/useFetchJobTable";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  // isSameDay,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

import { DayJobsDialog } from "./day-jobs-dialog";
import { LogJobDialog } from "@/components/dashboard/jobs/log-job-dialog";
import { JobDeleteAlert } from "@/components/dashboard/jobs/job-delete-alert";
import { useDelJob } from "@/hooks/jobs/useDelJob";

export function JobsCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Job View Dialog State
  const [viewOpen, setViewOpen] = useState(false);
  const [viewJob, setViewJob] = useState<ViewJobsRow | null>(null);

  // Day Jobs Dialog State
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedDayJobs, setSelectedDayJobs] = useState<ViewJobsRow[]>([]);

  // Delete Job State
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: jobs = [], isLoading, isError } = useFetchViewJobRow();
  const { data: technicians = [] } = useFetchTechnicians();
  const { openEdit } = useJobStore();
  const { mutate: deleteJob } = useDelJob();

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const today = () => setCurrentDate(new Date());

  const techMap = useMemo(() => {
    const map = new Map<string, (typeof technicians)[0]>();
    for (const t of technicians) {
      if (t.id) map.set(t.id, t);
    }
    return map;
  }, [technicians]);

  // Filter jobs by "done" or "pending" and group them by date string "YYYY-MM-DD"
  const jobsByDate = useMemo(() => {
    const map = new Map<string, ViewJobsRow[]>();

    const validJobs = jobs.filter(
      (j) => j.status === "done" || j.status === "pending",
    );

    for (const job of validJobs) {
      if (job.work_order_date) {
        // Just extract "YYYY-MM-DD" part of the date string
        const dateKey = job.work_order_date.split("T")[0];
        const list = map.get(dateKey) || [];
        list.push(job);
        map.set(dateKey, list);
      }
    }

    return map;
  }, [jobs]);

  // Calendar dates math
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  function handleDayClick(day: Date, dayJobs: ViewJobsRow[]) {
    // Only open dialog if we have jobs to show
    if (dayJobs.length === 0) return;

    setSelectedDay(day);
    setSelectedDayJobs(dayJobs);
    setDayDialogOpen(true);
  }

  function handleDeepJobClick(job: ViewJobsRow) {
    // Open the comprehensive JobViewDialog
    setViewJob(job);
    setViewOpen(true);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Calendar Toolbar */}
      <div className="flex items-center justify-between pb-4">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {format(currentDate, "MMMM yyyy")}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={today}
            className="hidden sm:inline-flex"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={prevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={nextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      ) : isError ? (
        <div className="flex flex-1 items-center justify-center text-red-600">
          Failed to load calendar jobs.
        </div>
      ) : (
        <>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 border-y border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="py-2 text-center text-xs font-semibold text-zinc-500 dark:text-zinc-400"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 bg-zinc-200 dark:bg-zinc-800 grid grid-cols-7 gap-px border-b border-zinc-200 dark:border-zinc-800">
            {days.map((day, idx) => {
              const strDate = format(day, "yyyy-MM-dd");
              const dayJobs = jobsByDate.get(strDate) || [];
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);
              const isClickable = dayJobs.length > 0;

              return (
                <div
                  key={day.toISOString() + idx}
                  onClick={() => isClickable && handleDayClick(day, dayJobs)}
                  className={cn(
                    "flex min-h-[100px] flex-col bg-white p-1 transition-colors dark:bg-zinc-900 sm:p-2",
                    !isCurrentMonth &&
                      "bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-400 dark:text-zinc-600",
                    isClickable
                      ? "cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      : "cursor-default",
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium sm:text-sm",
                        isCurrentDay
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                          : "text-zinc-700 dark:text-zinc-300",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {dayJobs.length > 0 && (
                      <span className="text-[10px] font-medium text-zinc-500 sm:hidden">
                        {dayJobs.length}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 overflow-y-auto no-scrollbar pointer-events-none">
                    {/* Only show up to 3 jobs on the calendar cell to prevent overwhelming it, allow them to click the cell to see the rest */}
                    {dayJobs.slice(0, 3).map((job) => {
                      const isDone = job.status === "done";
                      return (
                        <div
                          key={job.work_order_id}
                          className={cn(
                            "flex flex-col items-start gap-0.5 rounded px-1.5 py-1 text-left text-[10px] transition-colors sm:text-xs",
                            isDone
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
                          )}
                        >
                          <span className="line-clamp-1 font-semibold">
                            <span className="opacity-70 font-normal mr-1">#{job.work_order_id?.slice(0, 4)}</span>
                            {job.work_title || "Unnamed Job"}
                          </span>
                          <span className="line-clamp-1 opacity-80">
                            {job.technician_id
                              ? techMap.get(job.technician_id)?.name ||
                                "Unknown Tech"
                              : "No Tech"}
                          </span>
                        </div>
                      );
                    })}
                    {dayJobs.length > 3 && (
                      <div className="px-1.5 py-0.5 text-[10px] text-zinc-500 font-medium">
                        +{dayJobs.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Day Jobs List Dialog */}
      <DayJobsDialog
        date={selectedDay}
        jobs={selectedDayJobs}
        open={dayDialogOpen}
        onOpenChange={setDayDialogOpen}
        onJobClick={handleDeepJobClick}
        techMap={techMap}
      />

      {/* View Dialog */}
      <JobViewDialog
        job={viewJob}
        techName={
          viewJob?.technician_id
            ? techMap.get(viewJob.technician_id)?.name
            : undefined
        }
        commRate={
          viewJob?.technician_id
            ? techMap.get(viewJob.technician_id)?.commission
            : null
        }
        open={viewOpen}
        onOpenChange={setViewOpen}
        onEdit={() => {
          if (!viewJob) return;
          setDayDialogOpen(false); // Make sure we close both if editing
          openEdit({
            work_order_id: viewJob.work_order_id ?? "",
            work_title: viewJob.work_title ?? "",
            description: viewJob.description ?? "",
            work_order_date:
              viewJob.work_order_date ?? new Date().toISOString().slice(0, 10),
            technician_id: viewJob.technician_id ?? "",
            category: viewJob.category ?? "",
            address: viewJob.address ?? "",
            region: viewJob.region ?? "",
            contact_no: viewJob.contact_no ?? "",
            contact_email: viewJob.contact_email ?? "",
            payment_method_id: "",
            payment_method: viewJob.payment_method,
            parts_total_cost: viewJob.parts_total_cost ?? 0,
            subtotal: viewJob.subtotal ?? 0,
            tip_amount: viewJob.tip_amount ?? 0,
            notes: viewJob.notes ?? "",
            status: viewJob.status ?? "pending",
          });
          setViewOpen(false);
        }}
        onDelete={() => {
          if (viewJob?.work_order_id) setConfirmDeleteId(viewJob.work_order_id);
        }}
      />

      {/* Edit Dialog (triggered via Zustand) */}
      <LogJobDialog showTrigger={false} />

      {/* Delete Confirmation Alert */}
      <JobDeleteAlert
        open={!!confirmDeleteId}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) deleteJob(confirmDeleteId);
          setConfirmDeleteId(null);
          setViewOpen(false);
          setDayDialogOpen(false);
        }}
      />
    </div>
  );
}
