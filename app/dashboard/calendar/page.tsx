"use client";

import { JobsCalendar } from "@/components/dashboard/calendar/jobs-calendar";

export default function CalendarPage() {
  return (
    <div className="space-y-6 flex flex-col h-full min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Jobs Calendar
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          View all done and pending jobs by date.
        </p>
      </div>

      <div className="flex-1 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden p-6 flex flex-col">
        <JobsCalendar />
      </div>
    </div>
  );
}
