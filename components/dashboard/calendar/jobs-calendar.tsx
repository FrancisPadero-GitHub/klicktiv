"use client";

import { useMemo, useState } from "react";
import { useFetchViewJobRow } from "@/hooks/jobs/useFetchJobTable";
import { useFetchTechnicians } from "@/hooks/technicians/useFetchTechnicians";
import { useJobStore } from "@/features/store/jobs/useFormJobStore";
import { useCalendarFilterStore } from "@/features/store/calendar/useCalendarFilterStore";
import { JobViewDialog } from "@/components/dashboard/jobs/job-view-dialog";
import type { ViewJobsRow } from "@/hooks/jobs/useFetchJobTable";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

import { DayJobsDialog } from "./day-jobs-dialog";
import { LogJobDialog } from "@/components/dashboard/jobs/log-job-dialog";
import { JobDeleteAlert } from "@/components/dashboard/jobs/job-delete-alert";
import { useDelJob } from "@/hooks/jobs/useDelJob";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const YEARS = Array.from(
  { length: 11 },
  (_, i) => new Date().getFullYear() - 5 + i,
);

export function JobsCalendar() {
  const {
    year,
    month,
    selectedTechnicians,
    setYear,
    setMonth,
    toggleTechnician,
  } = useCalendarFilterStore();

  const currentDate = useMemo(() => new Date(year, month, 1), [year, month]);

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

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };
  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };
  const today = () => {
    const d = new Date();
    setMonth(d.getMonth());
    setYear(d.getFullYear());
  };

  const techMap = useMemo(() => {
    const map = new Map<string, (typeof technicians)[0]>();
    for (const t of technicians) {
      if (t.id) map.set(t.id, t);
    }
    return map;
  }, [technicians]);

  // Filter jobs by "done" or "pending", grouped by date string "YYYY-MM-DD"
  // Apply technician filter as well.
  const jobsByDate = useMemo(() => {
    const map = new Map<string, ViewJobsRow[]>();

    const validJobs = jobs.filter((j) => {
      if (j.status !== "done" && j.status !== "pending") return false;

      if (
        selectedTechnicians.length > 0 &&
        !selectedTechnicians.includes(j.technician_id || "")
      ) {
        return false;
      }

      return true;
    });

    for (const job of validJobs) {
      if (job.work_order_date) {
        const dateKey = format(new Date(job.work_order_date), "yyyy-MM-dd");
        const list = map.get(dateKey) || [];
        list.push(job);
        map.set(dateKey, list);
      }
    }

    return map;
  }, [jobs, selectedTechnicians]);

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
        <div className="flex items-center rounded-lg border border-border bg-background shadow-xs">
          {/* month selector */}
          <Select
            value={month.toString()}
            onValueChange={(val) => setMonth(parseInt(val, 10))}
          >
            <SelectTrigger className="w-32 h-9 text-base font-semibold border-none shadow-none focus:ring-0 pl-3 pr-1 rounded-r-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="h-5 w-px bg-border" />
          {/* year selector */}
          <Select
            value={year.toString()}
            onValueChange={(val) => setYear(parseInt(val, 10))}
          >
            <SelectTrigger className="w-20 h-9 text-base font-semibold border-none shadow-none focus:ring-0 pl-3 pr-2 rounded-l-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5">
                <Filter className="h-4 w-4" />
                Technicians
                {selectedTechnicians.length > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                    {selectedTechnicians.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Filter by Technician</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {technicians.length === 0 && (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  No technicians found.
                </div>
              )}
              {technicians.map((t) => (
                <DropdownMenuCheckboxItem
                  key={t.id}
                  checked={selectedTechnicians.includes(t.id || "")}
                  onCheckedChange={() => toggleTechnician(t.id || "")}
                  onSelect={(e) => e.preventDefault()}
                >
                  {t.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={today}
            className="hidden sm:inline-flex h-8"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={prevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={nextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading ? (
        <div className="flex flex-1 min-h-75 items-center justify-center rounded-lg border border-border">
          <Spinner />
        </div>
      ) : isError ? (
        <div className="flex flex-1 min-h-75 items-center justify-center rounded-lg border border-border text-sm text-destructive">
          Failed to load calendar jobs.
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-lg border border-border">
          {/* Week day headers */}
          <div className="grid grid-cols-7 border-b border-border bg-muted">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="py-2.5 text-center text-xs font-semibold tracking-wide text-muted-foreground uppercase"
              >
                {d}
              </div>
            ))}
          </div>
          {/* Calendar Grid */}
          <div className="flex-1 overflow-y-auto min-h-0 bg-border grid grid-cols-7 gap-px">
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
                    "flex min-h-22.5 flex-col bg-card p-1.5 transition-colors sm:p-2",
                    !isCurrentMonth && "bg-muted/50",
                    isClickable
                      ? "cursor-pointer hover:bg-accent/50"
                      : "cursor-default",
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium sm:text-sm",
                        isCurrentDay
                          ? "bg-primary text-primary-foreground"
                          : isCurrentMonth
                            ? "text-foreground"
                            : "text-muted-foreground",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {dayJobs.length > 0 && (
                      <span className="text-[10px] font-medium text-muted-foreground sm:hidden">
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
                              ? "bg-success/15 text-success dark:bg-success/20"
                              : "bg-primary/15 text-primary dark:bg-primary/20",
                          )}
                        >
                          <span className="line-clamp-1 font-semibold">
                            <span className="opacity-70 font-normal mr-1">
                              #{job.work_order_id?.slice(0, 4)}
                            </span>
                            {job.work_title || "Unnamed Job"}
                          </span>
                          <div className="flex items-center justify-between gap-2 w-full">
                            <span className="line-clamp-1 opacity-80 font-semibold text-foreground">
                              {job.technician_id
                                ? techMap.get(job.technician_id)?.name ||
                                  "Unknown Tech"
                                : "No Tech"}
                            </span>
                            {job.work_order_date && (
                              <span className="shrink-0 text-[9px] font-medium opacity-60">
                                {format(
                                  new Date(job.work_order_date),
                                  "h:mm a",
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {dayJobs.length > 3 && (
                      <div className="px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        +{dayJobs.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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
            name: viewJob.name ?? "",
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
