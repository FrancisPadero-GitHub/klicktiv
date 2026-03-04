import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/database.types";

export type VJobsRow = Database["public"]["Views"]["v_jobs"]["Row"];

export type JobsSummaryFilterMode =
  | "all"
  | "year"
  | "month"
  | "week"
  | "day"
  | "range";

export interface JobsSummaryFilter {
  mode?: JobsSummaryFilterMode;
  year?: number;
  month?: number;
  isoWeek?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
}

interface ResolvedDateRange {
  startDate?: string;
  endDate?: string;
}

const toISODate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getCurrentWeekRange = () => {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { startDate: toISODate(monday), endDate: toISODate(sunday) };
};

const getRangeFromISOWeek = (isoWeek: string): ResolvedDateRange => {
  const match = isoWeek.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return {};

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
    startDate: toISODate(weekStart),
    endDate: toISODate(weekEnd),
  };
};

const resolveDateRange = (filter?: JobsSummaryFilter): ResolvedDateRange => {
  if (!filter) return {};

  const mode = filter.mode ?? "all";
  const now = new Date();

  if (mode === "all") {
    return {};
  }

  if (mode === "year") {
    const year = filter.year ?? now.getFullYear();
    return {
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
    };
  }

  if (mode === "month") {
    const year = filter.year ?? now.getFullYear();
    const month = filter.month ?? now.getMonth() + 1;
    const monthDate = new Date(year, month - 1, 1);
    const monthStart = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth(),
      1,
    );
    const monthEnd = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() + 1,
      0,
    );
    return {
      startDate: toISODate(monthStart),
      endDate: toISODate(monthEnd),
    };
  }

  if (mode === "week") {
    if (filter.isoWeek) return getRangeFromISOWeek(filter.isoWeek);
    return getCurrentWeekRange();
  }

  if (mode === "day") {
    const day = filter.date ?? toISODate(now);
    return { startDate: day, endDate: day };
  }

  if (mode === "range") {
    return {
      startDate: filter.startDate,
      endDate: filter.endDate,
    };
  }

  return {};
};

// Data fetching function
export const fetchJobs = async (
  companyId: string,
  filter?: JobsSummaryFilter,
): Promise<VJobsRow[]> => {
  let query = supabase.from("v_jobs").select("*").eq("company_id", companyId);

  const { startDate, endDate } = resolveDateRange(filter);
  if (startDate) query = query.gte("work_order_date", startDate);
  if (endDate) query = query.lte("work_order_date", endDate);

  const { data: result, error } = await query.order("work_order_date", {
    ascending: false,
  });

  if (error) {
    throw new Error(error.message || "Failed to fetch jobs");
  }

  return result as VJobsRow[];
};

export function useFetchJobDetailed(filter?: JobsSummaryFilter) {
  const { session } = useAuth();
  const companyId = session?.user?.app_metadata?.company_id as
    | string
    | undefined;

  return useQuery<VJobsRow[], Error>({
    queryKey: ["jobs", "table-detailed", companyId ?? null, filter ?? null],
    queryFn: () => {
      if (!companyId) {
        throw new Error("Company ID is missing from user session");
      }

      return fetchJobs(companyId, filter);
    },
    enabled: Boolean(companyId),
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
  });
}
