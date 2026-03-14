"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  UserRound,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useDashboardFilterStore,
  type DateFilterMode,
} from "@/features/store/dashboard/useDashboardFilterStore";
import { useFetchTechnicians } from "@/hooks/technicians/useFetchTechnicians";

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

const PRESET_BUTTONS: { mode: DateFilterMode; label: string }[] = [
  { mode: "all", label: "All Time" },
  { mode: "year", label: "Year" },
  { mode: "month", label: "Month" },
  { mode: "week", label: "Week" },
  { mode: "day", label: "Day" },
  { mode: "range", label: "Range" },
];

const toISODate = (d: Date) => {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const yearOptions = () => {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current + 1; y >= 2020; y--) years.push(y);
  return years;
};

function getISOWeekRange(isoWeek: string) {
  const match = isoWeek.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setUTCDate(jan4.getUTCDate() - jan4Day + 1);
  const weekStart = new Date(mondayWeek1);
  weekStart.setUTCDate(mondayWeek1.getUTCDate() + (week - 1) * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
  return {
    start: weekStart.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
    }),
    end: weekEnd.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  };
}

export function DashboardDateFilter() {
  const store = useDashboardFilterStore();
  const { data: technicianList } = useFetchTechnicians();

  const [dayOpen, setDayOpen] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const filterSummary = useMemo(() => {
    switch (store.mode) {
      case "all":
        return "Showing all data";
      case "year":
        return `Year ${store.year}`;
      case "month":
        return `${MONTHS[store.month - 1]} ${store.year}`;
      case "week": {
        const range = getISOWeekRange(store.isoWeek);
        return range
          ? `Week: ${range.start}, ${range.end}`
          : `Week: ${store.isoWeek}`;
      }
      case "day":
        return new Date(store.date + "T00:00:00").toLocaleDateString("en-PH", {
          weekday: "short",
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      case "range":
        return `${store.startDate || "start"} → ${store.endDate || "end"}`;
      default:
        return "";
    }
  }, [
    store.mode,
    store.year,
    store.month,
    store.isoWeek,
    store.date,
    store.startDate,
    store.endDate,
  ]);

  const navigatePrev = () => {
    if (store.mode === "year") {
      store.setYear(store.year - 1);
    } else if (store.mode === "month") {
      if (store.month === 1) {
        store.setYear(store.year - 1);
        store.setMonth(12);
      } else store.setMonth(store.month - 1);
    } else if (store.mode === "week") {
      const match = store.isoWeek.match(/^(\d{4})-W(\d{2})$/);
      if (match) {
        let y = Number(match[1]),
          w = Number(match[2]) - 1;
        if (w < 1) {
          y -= 1;
          w = 52;
        }
        store.setIsoWeek(`${y}-W${String(w).padStart(2, "0")}`);
      }
    } else if (store.mode === "day") {
      const d = new Date(store.date + "T00:00:00");
      d.setDate(d.getDate() - 1);
      store.setDate(toISODate(d));
    }
  };

  const navigateNext = () => {
    if (store.mode === "year") {
      store.setYear(store.year + 1);
    } else if (store.mode === "month") {
      if (store.month === 12) {
        store.setYear(store.year + 1);
        store.setMonth(1);
      } else store.setMonth(store.month + 1);
    } else if (store.mode === "week") {
      const match = store.isoWeek.match(/^(\d{4})-W(\d{2})$/);
      if (match) {
        let y = Number(match[1]),
          w = Number(match[2]) + 1;
        if (w > 52) {
          y += 1;
          w = 1;
        }
        store.setIsoWeek(`${y}-W${String(w).padStart(2, "0")}`);
      }
    } else if (store.mode === "day") {
      const d = new Date(store.date + "T00:00:00");
      d.setDate(d.getDate() + 1);
      store.setDate(toISODate(d));
    }
  };

  const showNav = store.mode !== "all" && store.mode !== "range";

  // Derive Date objects from ISO strings for the pickers
  const selectedDay = store.date ? parseISO(store.date) : new Date();
  const selectedStart = store.startDate ? parseISO(store.startDate) : undefined;
  const selectedEnd = store.endDate ? parseISO(store.endDate) : undefined;

  return (
    <div className="space-y-3">
      {/* Mode Selector Row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1">
          {PRESET_BUTTONS.map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => store.setMode(mode)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                store.mode === mode
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {showNav && (
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon-xs" onClick={navigatePrev}>
              <ChevronLeft />
            </Button>
            <Button variant="outline" size="icon-xs" onClick={navigateNext}>
              <ChevronRight />
            </Button>
          </div>
        )}

        <Button
          variant="ghost"
          size="xs"
          onClick={store.reset}
          className="text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="size-3" />
          Reset
        </Button>
      </div>

      {/* Mode-specific controls */}
      <div className="flex flex-wrap items-end gap-3">
        {(store.mode === "year" || store.mode === "month") && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Year
            </label>
            <Select
              value={String(store.year)}
              onValueChange={(v) => store.setYear(Number(v))}
            >
              <SelectTrigger size="sm" className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions().map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {store.mode === "month" && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Month
            </label>
            <Select
              value={String(store.month)}
              onValueChange={(v) => store.setMonth(Number(v))}
            >
              <SelectTrigger size="sm" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={i} value={String(i + 1)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {store.mode === "week" && (
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Week
            </label>
            <Input
              type="week"
              value={store.isoWeek}
              onChange={(e) => store.setIsoWeek(e.target.value)}
              className="h-8 w-44 text-sm"
            />
          </div>
        )}

        {/* Day — Popover Calendar */}
        {store.mode === "day" && (
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Date
            </label>
            <Popover open={dayOpen} onOpenChange={setDayOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-8 w-44 justify-between text-sm font-normal"
                >
                  {store.date ? format(selectedDay, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto overflow-hidden p-0"
                align="start"
              >
                <CalendarPicker
                  mode="single"
                  selected={selectedDay}
                  captionLayout="dropdown"
                  defaultMonth={selectedDay}
                  onSelect={(d) => {
                    if (d) {
                      store.setDate(toISODate(d));
                      setDayOpen(false);
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Range — two Popover Calendars */}
        {store.mode === "range" && (
          <>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                From
              </label>
              <Popover open={startOpen} onOpenChange={setStartOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-8 w-44 justify-between text-sm font-normal"
                  >
                    {selectedStart
                      ? format(selectedStart, "PPP")
                      : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto overflow-hidden p-0"
                  align="start"
                >
                  <CalendarPicker
                    mode="single"
                    selected={selectedStart}
                    captionLayout="dropdown"
                    defaultMonth={selectedStart ?? new Date()}
                    onSelect={(d) => {
                      if (d) {
                        store.setStartDate(toISODate(d));
                        setStartOpen(false);
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                To
              </label>
              <Popover open={endOpen} onOpenChange={setEndOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-8 w-44 justify-between text-sm font-normal"
                  >
                    {selectedEnd ? format(selectedEnd, "PPP") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto overflow-hidden p-0"
                  align="start"
                >
                  <CalendarPicker
                    mode="single"
                    selected={selectedEnd}
                    captionLayout="dropdown"
                    defaultMonth={selectedEnd ?? new Date()}
                    onSelect={(d) => {
                      if (d) {
                        store.setEndDate(toISODate(d));
                        setEndOpen(false);
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </>
        )}

        {/* Technician Selector */}
        <div className="flex flex-col space-y-1">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Technician
          </label>
          <Select
            value={store.technicianId || "all"}
            onValueChange={(v) => store.setTechnicianId(v)}
          >
            <SelectTrigger size="sm" className="w-48">
              <UserRound className="size-3.5 shrink-0 text-muted-foreground" />
              <SelectValue placeholder="All Technicians" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Technicians</SelectItem>
              {technicianList?.map((tech) => (
                <SelectItem key={tech.id} value={tech.id}>
                  {tech.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active filter summary badge */}
        <div className="flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
          {store.mode === "range" ? (
            <CalendarRange className="size-3.5" />
          ) : store.mode === "day" ? (
            <Calendar className="size-3.5" />
          ) : (
            <CalendarDays className="size-3.5" />
          )}
          {filterSummary}
        </div>
      </div>
    </div>
  );
}
