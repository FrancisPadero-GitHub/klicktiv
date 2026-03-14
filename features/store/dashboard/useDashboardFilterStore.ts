import { create } from "zustand";

export type DateFilterMode =
  | "all"
  | "year"
  | "month"
  | "week"
  | "day"
  | "range";

export interface DashboardDateFilter {
  mode: DateFilterMode;
  /** Selected year for "year" or "month" modes */
  year: number;
  /** 1-based month for "month" mode */
  month: number;
  /** ISO week string e.g. "2026-W09" for "week" mode */
  isoWeek: string;
  /** ISO date string e.g. "2026-03-01" for "day" mode */
  date: string;
  /** ISO date string for range start */
  startDate: string;
  /** ISO date string for range end */
  endDate: string;
  /** UUID of the selected technician, or "all" for no filter */
  technicianId: string | null;
}

interface DashboardFilterState extends DashboardDateFilter {
  setMode: (mode: DateFilterMode) => void;
  setYear: (year: number) => void;
  setMonth: (month: number) => void;
  setIsoWeek: (isoWeek: string) => void;
  setDate: (date: string) => void;
  setStartDate: (startDate: string) => void;
  setEndDate: (endDate: string) => void;
  setTechnicianId: (technicianId: string) => void;
  setPreset: (
    mode: DateFilterMode,
    overrides?: Partial<DashboardDateFilter>,
  ) => void;
  reset: () => void;
}

const toISODate = (d: Date) => {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const getCurrentISOWeek = (): string => {
  const now = new Date();
  const jan4 = new Date(now.getFullYear(), 0, 4);
  const jan4Day = jan4.getDay() || 7;
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setDate(jan4.getDate() - jan4Day + 1);

  const diffMs = now.getTime() - mondayWeek1.getTime();
  const weekNum = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
};

const now = new Date();

const initialState: DashboardDateFilter = {
  mode: "month",
  year: now.getFullYear(),
  month: now.getMonth() + 1,
  isoWeek: getCurrentISOWeek(),
  date: toISODate(now),
  startDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`,
  endDate: toISODate(now),
  technicianId: "all",
};

export const useDashboardFilterStore = create<DashboardFilterState>()(
  (set) => ({
    ...initialState,

    setMode: (mode) => set({ mode }),
    setYear: (year) => set({ year }),
    setMonth: (month) => set({ month }),
    setIsoWeek: (isoWeek) => set({ isoWeek }),
    setDate: (date) => set({ date }),
    setStartDate: (startDate) => set({ startDate }),
    setEndDate: (endDate) => set({ endDate }),
    setTechnicianId: (technicianId) => set({ technicianId }),

    setPreset: (mode, overrides) =>
      set((state) => ({ ...state, mode, ...overrides })),

    reset: () => set(initialState),
  }),
);

/**
 * Convert the store's filter state into the shape expected by fetch hooks.
 */
export function toJobsSummaryFilter(filter: DashboardDateFilter) {
  return {
    mode: filter.mode,
    year: filter.year,
    month: filter.month,
    isoWeek: filter.isoWeek,
    date: filter.date,
    startDate: filter.startDate,
    endDate: filter.endDate,
    technicianId:
      filter.technicianId === "all" ? undefined : filter.technicianId,
  };
}
