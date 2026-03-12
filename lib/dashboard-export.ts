import { saveAs } from "file-saver";
import { d, dSub, dToNum } from "@/lib/decimal";
import {
  appendPdfTechJobDetailPages,
  buildTechJobDetailSheet,
} from "@/lib/dashboard-export-detail";
import type { VJobsRow } from "@/hooks/jobs/useFetchJobs";
import type { TechnicianDetailRow } from "@/hooks/technicians/useFetchTechnicians";

export type ExportFormat = "pdf" | "excel";

export interface DashboardTotals {
  grossRevenue: number;
  partsCost: number;
  netRevenue: number;
  companyNet: number;
  totalTechnicianCommissions: number;
  totalJobsCompleted: number;
  avgRevenuePerJob: number;
  companyNetMarginPct: number;
  totalTips: number;
  totalDeposits: number;
}

export interface TechPerformanceRow {
  technician: string;
  jobs: number;
  grossRevenue: number;
  parts: number;
  tips: number;
  netRevenue: number;
  techPay: number;
  companyNet: number;
  splitLabel: string;
}

export interface MonthlyComparisonRow {
  month: string;
  jobs: number;
  gross: number;
  parts: number;
  net: number;
  techPay: number;
  companyNet: number;
  pctOfTotal: number;
  companyNetPct: number;
}

export interface TechJobDetailJobRow {
  date: string;
  address: string;
  deposits: number;
  paymentStatus: "partial" | "full";
  parts: number;
  tip: number;
  gross: number;
  netAfterParts: number;
  techPay: number;
  companyNet: number;
  reviewAmount: number;
  month: string;
}

export interface TechJobDetailGroup {
  technician: string;
  commissionRate: number;
  splitLabel: string;
  jobs: TechJobDetailJobRow[];
  totals: {
    deposits: number;
    parts: number;
    tip: number;
    gross: number;
    netAfterParts: number;
    techPay: number;
    companyNet: number;
    reviewAmount: number;
  };
}

export interface ReviewTotals {
  totalDoneJobs: number;
  totalJobsWithReviews: number;
  totalJobsWithoutReviews: number;
  reviewCapturePct: number;
  totalReviewAmount: number;
  avgReviewAmount: number;
  avgReviewAmountPerDoneJob: number;
  distinctPaymentMethods: number;
  distinctReviewTypes: number;
}

export interface ReviewBreakdownRow {
  label: string;
  reviews: number;
  totalAmount: number;
  avgAmount: number;
  pctOfReviews: number;
  pctOfAmount: number;
}

export interface ReviewMonthlyRow {
  month: string;
  reviews: number;
  totalAmount: number;
  avgAmount: number;
  pctOfDoneJobs: number;
}

export interface DashboardExportReport {
  title: string;
  company: {
    id: string;
    name: string;
  };
  scopeLabel: string;
  reportingPeriod: string;
  generatedAt: string;
  totals: DashboardTotals;
  technicianRows: TechPerformanceRow[];
  monthlyRows: MonthlyComparisonRow[];
  techJobDetailGroups: TechJobDetailGroup[];
  reviewTotals: ReviewTotals;
  reviewTypeRows: ReviewBreakdownRow[];
  paymentMethodRows: ReviewBreakdownRow[];
  reviewTechnicianRows: ReviewBreakdownRow[];
  reviewMonthlyRows: ReviewMonthlyRow[];
}

interface BuildReportInput {
  jobs: VJobsRow[];
  technicians: TechnicianDetailRow[];
  techNameMap?: Map<string, string>;
  scopeLabel: string;
  company: {
    id: string;
    name?: string | null;
  };
}

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

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const fmtCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);

const fmtPercent = (value: number, dp = 1) => `${value.toFixed(dp)}%`;

const hasText = (value: string | null | undefined): value is string =>
  typeof value === "string" && value.trim().length > 0;

const toLabel = (value: string | null | undefined, fallback: string) =>
  hasText(value) ? value.trim() : fallback;

const safeDate = (isoDate: string | null | undefined) => {
  if (!isoDate) return null;

  const raw = isoDate.trim();
  if (!raw) return null;

  // Handle YYYY-MM-DD and timestamp-like values from Supabase consistently.
  const normalized = raw.includes("T")
    ? raw
    : raw.includes(" ")
      ? raw.replace(" ", "T")
      : `${raw}T00:00:00`;

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatPeriod = (dates: Date[]) => {
  if (dates.length === 0) return "No completed jobs in selected period";

  const min = new Date(Math.min(...dates.map((dte) => dte.getTime())));
  const max = new Date(Math.max(...dates.map((dte) => dte.getTime())));

  const format = (value: Date) =>
    value.toLocaleDateString("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  return `${format(min)} - ${format(max)}`;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const makeFileName = (
  format: ExportFormat,
  scopeLabel: string,
  companyName: string,
) => {
  const date = new Date().toISOString().slice(0, 10);
  const scope = slugify(scopeLabel);
  const company = slugify(companyName || "unknown-company");
  return `dashboard-financial-report-${company}-${scope}-${date}.${
    format === "excel" ? "xlsx" : "pdf"
  }`;
};

export function buildDashboardExportReport({
  jobs,
  technicians,
  techNameMap,
  scopeLabel,
  company,
}: BuildReportInput): DashboardExportReport {
  const companyName = company.name?.trim() || "Unknown Company";

  const doneJobs = jobs.filter((job) => job.status === "done");

  const commissionMap = new Map<string, number>();
  const fallbackTechNameMap = new Map<string, string>();
  for (const technician of technicians) {
    commissionMap.set(technician.id, technician.commission);
    fallbackTechNameMap.set(technician.id, technician.name);
  }

  const periodDates = doneJobs
    .map((job) => safeDate(job.work_order_date))
    .filter((value): value is Date => value !== null);

  let grossRevenue = d(0);
  let netRevenue = d(0);
  let partsCost = d(0);
  let totalTips = d(0);
  let totalDeposits = d(0);
  let companyNet = d(0);
  let totalTechnicianCommissions = d(0);

  const technicianAgg = new Map<string, TechPerformanceRow>();
  const techJobDetailMap = new Map<string, TechJobDetailGroup>();
  const monthlyAgg = new Map<
    string,
    {
      month: string;
      jobs: number;
      gross: number;
      parts: number;
      net: number;
      techPay: number;
      companyNet: number;
    }
  >();
  const paymentMethodAgg = new Map<
    string,
    {
      label: string;
      reviews: number;
      totalAmount: number;
    }
  >();
  const reviewTechnicianAgg = new Map<
    string,
    {
      label: string;
      reviews: number;
      totalAmount: number;
    }
  >();
  const reviewTypeAgg = new Map<
    string,
    {
      label: string;
      reviews: number;
      totalAmount: number;
    }
  >();
  const reviewMonthAgg = new Map<
    string,
    {
      month: string;
      reviews: number;
      totalAmount: number;
    }
  >();

  let totalReviewAmount = d(0);
  let totalJobsWithReviews = 0;

  for (const job of doneJobs) {
    const subtotal = job.subtotal ?? 0;
    const parts = job.parts_total_cost ?? 0;
    const tips = job.tip_amount ?? 0;
    const deposits = job.deposits ?? 0;
    const net = dSub(subtotal, parts);
    const commissionRate = commissionMap.get(job.technician_id ?? "") ?? 0;
    const techPay = net.times(d(commissionRate).dividedBy(100));
    const compNet = net.minus(techPay);

    if (job.payment_status === "full") {
      grossRevenue = grossRevenue.plus(d(subtotal));
      partsCost = partsCost.plus(d(parts));
      totalTips = totalTips.plus(d(tips));
      netRevenue = netRevenue.plus(net);
      companyNet = companyNet.plus(compNet);
      totalTechnicianCommissions = totalTechnicianCommissions.plus(techPay);
    }

    if (job.payment_status === "partial") {
      totalDeposits = totalDeposits.plus(d(deposits));
      grossRevenue = grossRevenue.plus(d(deposits));
    }

    const exportGross =
      job.payment_status === "full"
        ? subtotal
        : job.payment_status === "partial"
          ? deposits
          : 0;
    const exportParts = job.payment_status === "full" ? parts : 0;
    const exportTips = job.payment_status === "full" ? tips : 0;
    const exportNet = job.payment_status === "full" ? dToNum(net) : 0;
    const exportTechPay = job.payment_status === "full" ? dToNum(techPay) : 0;
    const exportCompanyNet =
      job.payment_status === "full" ? dToNum(compNet) : 0;

    const techName = job.technician_id
      ? (techNameMap?.get(job.technician_id) ??
        fallbackTechNameMap.get(job.technician_id) ??
        "Unassigned")
      : "Unassigned";

    const existingTech = technicianAgg.get(techName) ?? {
      technician: techName,
      jobs: 0,
      grossRevenue: 0,
      parts: 0,
      tips: 0,
      netRevenue: 0,
      techPay: 0,
      companyNet: 0,
      splitLabel: `${100 - commissionRate}% Co / ${commissionRate}% Tech`,
    };

    existingTech.jobs += 1;
    existingTech.grossRevenue += exportGross;
    existingTech.parts += exportParts;
    existingTech.tips += exportTips;
    existingTech.netRevenue += exportNet;
    existingTech.techPay += exportTechPay;
    existingTech.companyNet += exportCompanyNet;
    existingTech.splitLabel = `${100 - commissionRate}% Co / ${commissionRate}% Tech`;

    technicianAgg.set(techName, existingTech);

    // ── Per-job detail for Technician Job Detail export ───────────────────────
    const jobDate = safeDate(job.work_order_date);
    const detailReviewAmount = job.review_amount ?? 0;
    const jobDetailRow: TechJobDetailJobRow = {
      date: jobDate
        ? jobDate.toLocaleDateString("en-PH", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
          })
        : "",
      address: job.address ?? "",
      deposits,
      paymentStatus: job.payment_status === "partial" ? "partial" : "full",
      parts: exportParts,
      tip: exportTips,
      gross: subtotal,
      netAfterParts: exportNet,
      techPay: exportTechPay,
      companyNet: exportCompanyNet,
      reviewAmount: detailReviewAmount,
      month: jobDate
        ? `${MONTHS_SHORT[jobDate.getMonth()]} ${jobDate.getFullYear()}`
        : "",
    };
    const existingDetail = techJobDetailMap.get(techName) ?? {
      technician: techName,
      commissionRate,
      splitLabel: `${100 - commissionRate}% Co / ${commissionRate}% Tech`,
      jobs: [],
      totals: {
        deposits: 0,
        parts: 0,
        tip: 0,
        gross: 0,
        netAfterParts: 0,
        techPay: 0,
        companyNet: 0,
        reviewAmount: 0,
      },
    };
    existingDetail.jobs.push(jobDetailRow);
    existingDetail.totals.deposits += deposits;
    existingDetail.totals.parts += exportParts;
    existingDetail.totals.tip += exportTips;
    existingDetail.totals.gross += subtotal;
    existingDetail.totals.netAfterParts += exportNet;
    existingDetail.totals.techPay += exportTechPay;
    existingDetail.totals.companyNet += exportCompanyNet;
    existingDetail.totals.reviewAmount += detailReviewAmount;
    existingDetail.splitLabel = `${100 - commissionRate}% Co / ${commissionRate}% Tech`;
    techJobDetailMap.set(techName, existingDetail);

    if (job.work_order_date) {
      const dte = safeDate(job.work_order_date);
      if (dte) {
        const key = `${dte.getFullYear()}-${String(dte.getMonth() + 1).padStart(2, "0")}`;
        const monthLabel = `${MONTHS[dte.getMonth()]} ${dte.getFullYear()}`;
        const existingMonth = monthlyAgg.get(key) ?? {
          month: monthLabel,
          jobs: 0,
          gross: 0,
          parts: 0,
          net: 0,
          techPay: 0,
          companyNet: 0,
        };

        existingMonth.jobs += 1;
        existingMonth.gross += exportGross;
        existingMonth.parts += exportParts;
        existingMonth.net += exportNet;
        existingMonth.techPay += exportTechPay;
        existingMonth.companyNet += exportCompanyNet;

        monthlyAgg.set(key, existingMonth);
      }
    }

    if (!job.review_amount) {
      continue;
    }

    const reviewAmount = job.review_amount;
    totalReviewAmount = totalReviewAmount.plus(d(reviewAmount));
    totalJobsWithReviews += 1;

    const reviewType = toLabel(job.review_type, "Unspecified Type");
    const method = toLabel(job.payment_method, "Unspecified Method");

    const existingType = reviewTypeAgg.get(reviewType) ?? {
      label: reviewType,
      reviews: 0,
      totalAmount: 0,
    };
    existingType.reviews += 1;
    existingType.totalAmount += reviewAmount;
    reviewTypeAgg.set(reviewType, existingType);

    const existingMethod = paymentMethodAgg.get(method) ?? {
      label: method,
      reviews: 0,
      totalAmount: 0,
    };
    existingMethod.reviews += 1;
    existingMethod.totalAmount += reviewAmount;
    paymentMethodAgg.set(method, existingMethod);

    const existingTechnicianReview = reviewTechnicianAgg.get(techName) ?? {
      label: techName,
      reviews: 0,
      totalAmount: 0,
    };
    existingTechnicianReview.reviews += 1;
    existingTechnicianReview.totalAmount += reviewAmount;
    reviewTechnicianAgg.set(techName, existingTechnicianReview);

    const reviewDate = safeDate(job.review_date ?? job.work_order_date);
    if (reviewDate) {
      const key = `${reviewDate.getFullYear()}-${String(
        reviewDate.getMonth() + 1,
      ).padStart(2, "0")}`;
      const monthLabel = `${MONTHS[reviewDate.getMonth()]} ${reviewDate.getFullYear()}`;
      const existing = reviewMonthAgg.get(key) ?? {
        month: monthLabel,
        reviews: 0,
        totalAmount: 0,
      };
      existing.reviews += 1;
      existing.totalAmount += reviewAmount;
      reviewMonthAgg.set(key, existing);
    }
  }

  const gross = dToNum(grossRevenue);
  const parts = dToNum(partsCost);
  const net = dToNum(netRevenue);
  const totalCompanyNet = dToNum(companyNet);
  const totalJobs = doneJobs.length;
  const avgRevenuePerJob =
    totalJobs > 0 ? dToNum(grossRevenue.dividedBy(totalJobs)) : 0;
  const companyNetMarginPct =
    gross > 0 ? dToNum(companyNet.dividedBy(grossRevenue).times(100), 1) : 0;

  const technicianRows = Array.from(technicianAgg.values()).sort(
    (a, b) => b.grossRevenue - a.grossRevenue,
  );

  const monthlyRows = Array.from(monthlyAgg.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, value]) => ({
      ...value,
      pctOfTotal: gross > 0 ? (value.gross / gross) * 100 : 0,
      companyNetPct:
        value.gross > 0 ? (value.companyNet / value.gross) * 100 : 0,
    }));

  const techJobDetailGroups = Array.from(techJobDetailMap.values())
    .sort((a, b) => b.totals.gross - a.totals.gross)
    .map((group) => ({
      ...group,
      jobs: group.jobs.sort((a, b) => a.date.localeCompare(b.date)),
    }));

  const totalReviewAmountNum = dToNum(totalReviewAmount);
  const totalJobsWithoutReviews = Math.max(totalJobs - totalJobsWithReviews, 0);
  const reviewCapturePct =
    totalJobs > 0 ? (totalJobsWithReviews / totalJobs) * 100 : 0;

  const toBreakdownRows = (
    source: Map<
      string,
      { label: string; reviews: number; totalAmount: number }
    >,
  ): ReviewBreakdownRow[] =>
    Array.from(source.values())
      .sort((a, b) => {
        if (b.totalAmount !== a.totalAmount) {
          return b.totalAmount - a.totalAmount;
        }
        return b.reviews - a.reviews;
      })
      .map((row) => ({
        label: row.label,
        reviews: row.reviews,
        totalAmount: row.totalAmount,
        avgAmount: row.reviews > 0 ? row.totalAmount / row.reviews : 0,
        pctOfReviews:
          totalJobsWithReviews > 0
            ? (row.reviews / totalJobsWithReviews) * 100
            : 0,
        pctOfAmount:
          totalReviewAmountNum > 0
            ? (row.totalAmount / totalReviewAmountNum) * 100
            : 0,
      }));

  const reviewTypeRows = toBreakdownRows(reviewTypeAgg);
  const paymentMethodRows = toBreakdownRows(paymentMethodAgg);
  const reviewTechnicianRows = toBreakdownRows(reviewTechnicianAgg);

  const reviewMonthlyRows: ReviewMonthlyRow[] = Array.from(
    reviewMonthAgg.entries(),
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, row]) => {
      const doneJobsInMonth = monthlyAgg.get(key)?.jobs ?? 0;
      return {
        month: row.month,
        reviews: row.reviews,
        totalAmount: row.totalAmount,
        avgAmount: row.reviews > 0 ? row.totalAmount / row.reviews : 0,
        pctOfDoneJobs:
          doneJobsInMonth > 0 ? (row.reviews / doneJobsInMonth) * 100 : 0,
      };
    });

  return {
    title: `${companyName.toUpperCase()} - KLICKTIV FINANCIAL REPORT`,
    company: {
      id: company.id,
      name: companyName,
    },
    scopeLabel,
    reportingPeriod: formatPeriod(periodDates),
    generatedAt: new Date().toLocaleString("en-US"),
    totals: {
      grossRevenue: gross,
      partsCost: parts,
      netRevenue: net,
      companyNet: totalCompanyNet,
      totalTechnicianCommissions: dToNum(totalTechnicianCommissions),
      totalJobsCompleted: totalJobs,
      avgRevenuePerJob,
      companyNetMarginPct,
      totalTips: dToNum(totalTips),
      totalDeposits: dToNum(totalDeposits),
    },
    technicianRows,
    monthlyRows,
    techJobDetailGroups,
    reviewTotals: {
      totalDoneJobs: totalJobs,
      totalJobsWithReviews,
      totalJobsWithoutReviews,
      reviewCapturePct,
      totalReviewAmount: totalReviewAmountNum,
      avgReviewAmount:
        totalJobsWithReviews > 0
          ? totalReviewAmountNum / totalJobsWithReviews
          : 0,
      avgReviewAmountPerDoneJob:
        totalJobs > 0 ? totalReviewAmountNum / totalJobs : 0,
      distinctPaymentMethods: paymentMethodAgg.size,
      distinctReviewTypes: reviewTypeAgg.size,
    },
    reviewTypeRows,
    paymentMethodRows,
    reviewTechnicianRows,
    reviewMonthlyRows,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildReviewTotalsSheet(report: DashboardExportReport, XS: any) {
  const NAVY = "1F3764";
  const BLUE = "2F5496";
  const MED_BLUE = "4472C4";
  const LT_BLUE = "D9E1F2";
  const WHITE = "FFFFFF";
  const BORDER = "B8CCE4";
  const TEXT_DARK = "1A1A2E";

  const bdrThin = (rgb = BORDER) => ({ style: "thin", color: { rgb } });
  const allBdr = (rgb = BORDER) => ({
    top: bdrThin(rgb),
    bottom: bdrThin(rgb),
    left: bdrThin(rgb),
    right: bdrThin(rgb),
  });

  const ws: Record<string, unknown> = {};
  const merges: Array<{
    s: { r: number; c: number };
    e: { r: number; c: number };
  }> = [];
  let r = 0;

  const enc = (row: number, col: number) =>
    XS.utils.encode_cell({ r: row, c: col }) as string;
  const set = (col: number, v: string | number, s: object = {}, z?: string) => {
    const cell: Record<string, unknown> = {
      v,
      t: typeof v === "number" ? "n" : "s",
      s,
    };
    if (z) cell.z = z;
    ws[enc(r, col)] = cell;
  };
  const span = (c1: number, c2: number, r2 = r) =>
    merges.push({ s: { r, c: c1 }, e: { r: r2, c: c2 } });

  const FMT_CURRENCY = "$#,##0.00";
  const FMT_INT = "#,##0";
  const FMT_PCT = "0.0%";

  set(0, `REVIEW TOTALS  -  ${report.scopeLabel}`, {
    fill: { fgColor: { rgb: NAVY } },
    font: { bold: true, color: { rgb: WHITE }, sz: 16, name: "Calibri" },
    alignment: { horizontal: "center", vertical: "center" },
  });
  span(0, 6);
  r++;

  set(
    0,
    `Company: ${report.company.name} (${report.company.id})   |   Reporting Period: ${report.reportingPeriod}   |   Generated: ${report.generatedAt}`,
    {
      fill: { fgColor: { rgb: MED_BLUE } },
      font: { italic: true, color: { rgb: WHITE }, sz: 9, name: "Calibri" },
      alignment: { horizontal: "center", vertical: "center" },
    },
  );
  span(0, 6);
  r++;
  r++;

  set(0, "REVIEW KPI SUMMARY", {
    fill: { fgColor: { rgb: NAVY } },
    font: { bold: true, color: { rgb: WHITE }, sz: 11, name: "Calibri" },
    alignment: { horizontal: "left", vertical: "center" },
    border: allBdr(NAVY),
  });
  span(0, 6);
  r++;

  const summaryRows: Array<{
    label: string;
    value: number;
    fmt: string;
  }> = [
    {
      label: "Done Jobs",
      value: report.reviewTotals.totalDoneJobs,
      fmt: FMT_INT,
    },
    {
      label: "Jobs With Reviews",
      value: report.reviewTotals.totalJobsWithReviews,
      fmt: FMT_INT,
    },
    {
      label: "Jobs Without Reviews",
      value: report.reviewTotals.totalJobsWithoutReviews,
      fmt: FMT_INT,
    },
    {
      label: "Review Coverage",
      value: report.reviewTotals.reviewCapturePct / 100,
      fmt: FMT_PCT,
    },
    {
      label: "Total Review Amount",
      value: report.reviewTotals.totalReviewAmount,
      fmt: FMT_CURRENCY,
    },
    {
      label: "Avg Review Amount",
      value: report.reviewTotals.avgReviewAmount,
      fmt: FMT_CURRENCY,
    },
    {
      label: "Avg Review per Done Job",
      value: report.reviewTotals.avgReviewAmountPerDoneJob,
      fmt: FMT_CURRENCY,
    },
    {
      label: "Distinct Review Types",
      value: report.reviewTotals.distinctReviewTypes,
      fmt: FMT_INT,
    },
    {
      label: "Distinct Payment Methods",
      value: report.reviewTotals.distinctPaymentMethods,
      fmt: FMT_INT,
    },
  ];

  for (let i = 0; i < summaryRows.length; i++) {
    const row = summaryRows[i];
    const bg = i % 2 === 0 ? WHITE : LT_BLUE;
    const base = {
      fill: { fgColor: { rgb: bg } },
      font: { color: { rgb: TEXT_DARK }, sz: 10, name: "Calibri" },
      border: allBdr(),
    };
    set(0, row.label, {
      ...base,
      font: { ...base.font, bold: true },
      alignment: { horizontal: "left", indent: 1 },
    });
    span(0, 3);
    set(
      4,
      row.value,
      {
        ...base,
        alignment: { horizontal: "right" },
      },
      row.fmt,
    );
    span(4, 6);
    r++;
  }

  r++;

  const addBreakdown = (
    title: string,
    rows: ReviewBreakdownRow[],
    totalCount: number,
    totalAmount: number,
  ) => {
    set(0, title, {
      fill: { fgColor: { rgb: NAVY } },
      font: { bold: true, color: { rgb: WHITE }, sz: 11, name: "Calibri" },
      alignment: { horizontal: "left", vertical: "center" },
      border: allBdr(NAVY),
    });
    span(0, 6);
    r++;

    const headers = [
      "Category",
      "Reviews",
      "Total Amount",
      "Avg Amount",
      "% of Reviews",
      "% of Amount",
      "",
    ];
    for (let i = 0; i < headers.length; i++) {
      set(i, headers[i], {
        fill: { fgColor: { rgb: BLUE } },
        font: { bold: true, color: { rgb: WHITE }, sz: 10, name: "Calibri" },
        alignment: { horizontal: "center", vertical: "center" },
        border: allBdr(NAVY),
      });
    }
    r++;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const bg = i % 2 === 0 ? WHITE : LT_BLUE;
      const base = {
        fill: { fgColor: { rgb: bg } },
        font: { color: { rgb: TEXT_DARK }, sz: 10, name: "Calibri" },
        border: allBdr(),
      };
      set(0, row.label, {
        ...base,
        alignment: { horizontal: "left", indent: 1 },
      });
      set(
        1,
        row.reviews,
        { ...base, alignment: { horizontal: "center" } },
        FMT_INT,
      );
      set(
        2,
        row.totalAmount,
        { ...base, alignment: { horizontal: "right" } },
        FMT_CURRENCY,
      );
      set(
        3,
        row.avgAmount,
        { ...base, alignment: { horizontal: "right" } },
        FMT_CURRENCY,
      );
      set(
        4,
        row.pctOfReviews / 100,
        { ...base, alignment: { horizontal: "right" } },
        FMT_PCT,
      );
      set(
        5,
        row.pctOfAmount / 100,
        { ...base, alignment: { horizontal: "right" } },
        FMT_PCT,
      );
      set(6, "", base);
      r++;
    }

    const tot = {
      fill: { fgColor: { rgb: NAVY } },
      font: { bold: true, color: { rgb: WHITE }, sz: 10, name: "Calibri" },
      border: allBdr(NAVY),
      alignment: { horizontal: "right" },
    };
    set(0, "TOTAL", { ...tot, alignment: { horizontal: "left" } });
    set(
      1,
      totalCount,
      { ...tot, alignment: { horizontal: "center" } },
      FMT_INT,
    );
    set(2, totalAmount, { ...tot }, FMT_CURRENCY);
    set(
      3,
      totalCount > 0 ? totalAmount / totalCount : 0,
      { ...tot },
      FMT_CURRENCY,
    );
    set(4, 1, { ...tot }, FMT_PCT);
    set(5, 1, { ...tot }, FMT_PCT);
    set(6, "", tot);
    r++;
    r++;
  };

  addBreakdown(
    "REVIEW TYPE BREAKDOWN",
    report.reviewTypeRows,
    report.reviewTotals.totalJobsWithReviews,
    report.reviewTotals.totalReviewAmount,
  );

  addBreakdown(
    "PAYMENT METHOD BREAKDOWN",
    report.paymentMethodRows,
    report.reviewTotals.totalJobsWithReviews,
    report.reviewTotals.totalReviewAmount,
  );

  addBreakdown(
    "TECHNICIAN REVIEW BREAKDOWN",
    report.reviewTechnicianRows,
    report.reviewTotals.totalJobsWithReviews,
    report.reviewTotals.totalReviewAmount,
  );

  set(0, "MONTHLY REVIEW AMOUNT", {
    fill: { fgColor: { rgb: NAVY } },
    font: { bold: true, color: { rgb: WHITE }, sz: 11, name: "Calibri" },
    alignment: { horizontal: "left", vertical: "center" },
    border: allBdr(NAVY),
  });
  span(0, 6);
  r++;

  const monthHeaders = [
    "Month",
    "Reviews",
    "Total Amount",
    "Avg Amount",
    "Coverage vs Done Jobs",
    "",
    "",
  ];
  for (let i = 0; i < monthHeaders.length; i++) {
    set(i, monthHeaders[i], {
      fill: { fgColor: { rgb: BLUE } },
      font: { bold: true, color: { rgb: WHITE }, sz: 10, name: "Calibri" },
      alignment: { horizontal: "center", vertical: "center" },
      border: allBdr(NAVY),
    });
  }
  r++;

  for (let i = 0; i < report.reviewMonthlyRows.length; i++) {
    const row = report.reviewMonthlyRows[i];
    const bg = i % 2 === 0 ? WHITE : LT_BLUE;
    const base = {
      fill: { fgColor: { rgb: bg } },
      font: { color: { rgb: TEXT_DARK }, sz: 10, name: "Calibri" },
      border: allBdr(),
    };
    set(0, row.month, {
      ...base,
      alignment: { horizontal: "left", indent: 1 },
    });
    set(
      1,
      row.reviews,
      { ...base, alignment: { horizontal: "center" } },
      FMT_INT,
    );
    set(
      2,
      row.totalAmount,
      { ...base, alignment: { horizontal: "right" } },
      FMT_CURRENCY,
    );
    set(
      3,
      row.avgAmount,
      { ...base, alignment: { horizontal: "right" } },
      FMT_CURRENCY,
    );
    set(
      4,
      row.pctOfDoneJobs / 100,
      { ...base, alignment: { horizontal: "right" } },
      FMT_PCT,
    );
    set(5, "", base);
    set(6, "", base);
    r++;
  }

  ws["!ref"] = XS.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: Math.max(0, r - 1), c: 6 },
  });
  ws["!merges"] = merges;
  ws["!cols"] = [
    { wch: 34 },
    { wch: 12 },
    { wch: 18 },
    { wch: 14 },
    { wch: 20 },
    { wch: 8 },
    { wch: 8 },
  ];
  ws["!rows"] = [{ hpt: 38 }, { hpt: 20 }, { hpt: 6 }];
  return ws;
}

export async function exportDashboardReportAsExcel(
  report: DashboardExportReport,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const XS = (await import("xlsx-js-style")) as any;

  // ── Color palette ──────────────────────────────────────────────────────────
  const NAVY = "1F3764";
  const BLUE = "2F5496";
  const MED_BLUE = "4472C4";
  const PALE_BLUE = "EEF3FC";
  const LT_BLUE = "D9E1F2";
  const WHITE = "FFFFFF";
  const BORDER = "B8CCE4";
  const TEXT_DARK = "1A1A2E";
  const TEXT_MID = "546E8A";
  const GREEN = "1E5C1E";

  // ── Border helpers ─────────────────────────────────────────────────────────
  const bdrThin = (rgb = BORDER) => ({ style: "thin", color: { rgb } });
  const bdrMed = (rgb = BORDER) => ({ style: "medium", color: { rgb } });
  const allBdr = (rgb = BORDER) => ({
    top: bdrThin(rgb),
    bottom: bdrThin(rgb),
    left: bdrThin(rgb),
    right: bdrThin(rgb),
  });

  // ── Worksheet state ────────────────────────────────────────────────────────
  const ws: Record<string, unknown> = {};
  const merges: Array<{
    s: { r: number; c: number };
    e: { r: number; c: number };
  }> = [];
  let r = 0;

  const enc = (row: number, col: number) =>
    XS.utils.encode_cell({ r: row, c: col }) as string;
  const set = (col: number, v: string | number, s: object = {}, z?: string) => {
    const cell: Record<string, unknown> = {
      v,
      t: typeof v === "number" ? "n" : "s",
      s,
    };
    if (z) cell.z = z;
    ws[enc(r, col)] = cell;
  };
  const span = (c1: number, c2: number, r2 = r) =>
    merges.push({ s: { r, c: c1 }, e: { r: r2, c: c2 } });

  const FMT_CURRENCY = "$#,##0.00";
  const FMT_INT = "#,##0";
  const FMT_PCT = "0.0%";

  // ── Title ──────────────────────────────────────────────────────────────────
  set(0, report.title, {
    fill: { fgColor: { rgb: NAVY } },
    font: { bold: true, color: { rgb: WHITE }, sz: 16, name: "Calibri" },
    alignment: { horizontal: "center", vertical: "center" },
  });
  span(0, 8);
  r++;

  // ── Subtitle ───────────────────────────────────────────────────────────────
  set(
    0,
    `Company: ${report.company.name} (${report.company.id})   |   Scope: ${report.scopeLabel}   |   Reporting Period: ${report.reportingPeriod}   |   Generated: ${report.generatedAt}`,
    {
      fill: { fgColor: { rgb: MED_BLUE } },
      font: { italic: true, color: { rgb: WHITE }, sz: 9, name: "Calibri" },
      alignment: { horizontal: "center", vertical: "center" },
    },
  );
  span(0, 8);
  r++;

  r++; // spacer

  // ── KPI section header ─────────────────────────────────────────────────────
  set(0, "KEY PERFORMANCE INDICATORS", {
    fill: { fgColor: { rgb: NAVY } },
    font: { bold: true, color: { rgb: WHITE }, sz: 11, name: "Calibri" },
    alignment: { horizontal: "left", vertical: "center" },
    border: allBdr(NAVY),
  });
  span(0, 8);
  r++;

  // ── KPI cards - 3 cards per row, label row + value row ────────────────────
  const kpiRows: Array<Array<{ label: string; value: number; fmt: string }>> = [
    [
      {
        label: "Total Gross Revenue",
        value: report.totals.grossRevenue,
        fmt: FMT_CURRENCY,
      },
      {
        label: "Total Parts & Materials",
        value: report.totals.partsCost,
        fmt: FMT_CURRENCY,
      },
      {
        label: "Total Net Revenue (After Parts)",
        value: report.totals.netRevenue,
        fmt: FMT_CURRENCY,
      },
    ],
    [
      {
        label: "Total Company Net",
        value: report.totals.companyNet,
        fmt: FMT_CURRENCY,
      },
      {
        label: "Total Jobs Completed",
        value: report.totals.totalJobsCompleted,
        fmt: FMT_INT,
      },
      {
        label: "Avg Revenue Per Job",
        value: report.totals.avgRevenuePerJob,
        fmt: FMT_CURRENCY,
      },
    ],
    [
      {
        label: "Company Net Margin",
        value: report.totals.companyNetMarginPct / 100,
        fmt: FMT_PCT,
      },
      {
        label: "Total Technician Commissions",
        value: report.totals.totalTechnicianCommissions,
        fmt: FMT_CURRENCY,
      },
      {
        label: "Total Deposits",
        value: report.totals.totalDeposits,
        fmt: FMT_CURRENCY,
      },
    ],
  ];

  const KPI_SPANS = [
    [0, 2],
    [3, 5],
    [6, 8],
  ] as const;

  for (const kpiRow of kpiRows) {
    // Label row
    for (let i = 0; i < 3; i++) {
      set(KPI_SPANS[i][0], kpiRow[i].label, {
        fill: { fgColor: { rgb: PALE_BLUE } },
        font: {
          italic: true,
          color: { rgb: TEXT_MID },
          sz: 9,
          name: "Calibri",
        },
        alignment: { horizontal: "center", vertical: "bottom" },
        border: { top: bdrThin(), left: bdrThin(BLUE), right: bdrThin(BLUE) },
      });
      span(KPI_SPANS[i][0], KPI_SPANS[i][1]);
    }
    r++;
    // Value row
    for (let i = 0; i < 3; i++) {
      set(
        KPI_SPANS[i][0],
        kpiRow[i].value,
        {
          fill: { fgColor: { rgb: WHITE } },
          font: { bold: true, color: { rgb: NAVY }, sz: 14, name: "Calibri" },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            bottom: bdrMed(BLUE),
            left: bdrThin(BLUE),
            right: bdrThin(BLUE),
          },
        },
        kpiRow[i].fmt,
      );
      span(KPI_SPANS[i][0], KPI_SPANS[i][1]);
    }
    r++;
  }

  set(0, "Total Technician Tips", {
    fill: { fgColor: { rgb: PALE_BLUE } },
    font: {
      italic: true,
      color: { rgb: TEXT_MID },
      sz: 9,
      name: "Calibri",
    },
    alignment: { horizontal: "center", vertical: "bottom" },
    border: { top: bdrThin(), left: bdrThin(BLUE), right: bdrThin(BLUE) },
  });
  span(0, 5);
  set(
    6,
    report.totals.totalTips,
    {
      fill: { fgColor: { rgb: WHITE } },
      font: { bold: true, color: { rgb: NAVY }, sz: 14, name: "Calibri" },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        bottom: bdrMed(BLUE),
        left: bdrThin(BLUE),
        right: bdrThin(BLUE),
      },
    },
    FMT_CURRENCY,
  );
  span(6, 8);
  r++;

  r++; // spacer

  // ── Technician section header ──────────────────────────────────────────────
  set(0, `TECHNICIAN PERFORMANCE  -  ${report.scopeLabel}`, {
    fill: { fgColor: { rgb: NAVY } },
    font: { bold: true, color: { rgb: WHITE }, sz: 11, name: "Calibri" },
    alignment: { horizontal: "left", vertical: "center" },
    border: allBdr(NAVY),
  });
  span(0, 8);
  r++;

  // ── Technician column headers ──────────────────────────────────────────────
  const techColHeaders = [
    "Technician",
    "Jobs",
    "Gross Revenue",
    "Parts",
    "Tips",
    "Net Revenue",
    "Tech/Sub Pay",
    "Company Net",
    "Co. Split",
  ];
  for (let i = 0; i < techColHeaders.length; i++) {
    set(i, techColHeaders[i], {
      fill: { fgColor: { rgb: BLUE } },
      font: { bold: true, color: { rgb: WHITE }, sz: 10, name: "Calibri" },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: allBdr(NAVY),
    });
  }
  r++;

  // ── Technician data rows ───────────────────────────────────────────────────
  for (let idx = 0; idx < report.technicianRows.length; idx++) {
    const tech = report.technicianRows[idx];
    const bg = idx % 2 === 0 ? WHITE : LT_BLUE;
    const base = {
      fill: { fgColor: { rgb: bg } },
      font: { color: { rgb: TEXT_DARK }, sz: 10, name: "Calibri" },
      border: allBdr(),
    };
    const num = { ...base, alignment: { horizontal: "right" } };
    const ctr = { ...base, alignment: { horizontal: "center" } };
    set(0, tech.technician, {
      ...base,
      alignment: { horizontal: "left", indent: 1 },
    });
    set(1, tech.jobs, { ...num }, FMT_INT);
    set(2, tech.grossRevenue, { ...num }, FMT_CURRENCY);
    set(3, tech.parts, { ...num }, FMT_CURRENCY);
    set(4, tech.tips, { ...num }, FMT_CURRENCY);
    set(5, tech.netRevenue, { ...num }, FMT_CURRENCY);
    set(6, tech.techPay, { ...num }, FMT_CURRENCY);
    set(
      7,
      tech.companyNet,
      { ...num, font: { ...base.font, bold: true, color: { rgb: GREEN } } },
      FMT_CURRENCY,
    );
    set(8, tech.splitLabel, { ...ctr });
    r++;
  }

  // ── Totals row ─────────────────────────────────────────────────────────────
  const totalTechPay = report.technicianRows.reduce((s, t) => s + t.techPay, 0);
  const totalTechGross = report.technicianRows.reduce(
    (s, t) => s + t.grossRevenue,
    0,
  );
  const totalTechParts = report.technicianRows.reduce((s, t) => s + t.parts, 0);
  const totalTechTips = report.technicianRows.reduce((s, t) => s + t.tips, 0);
  const totalTechNet = report.technicianRows.reduce(
    (s, t) => s + t.netRevenue,
    0,
  );
  const totalTechCompanyNet = report.technicianRows.reduce(
    (s, t) => s + t.companyNet,
    0,
  );
  const tot = {
    fill: { fgColor: { rgb: NAVY } },
    font: { bold: true, color: { rgb: WHITE }, sz: 10, name: "Calibri" },
    border: allBdr(NAVY),
    alignment: { horizontal: "right" },
  };
  set(0, "TOTAL", { ...tot, alignment: { horizontal: "left" } });
  set(1, report.totals.totalJobsCompleted, { ...tot }, FMT_INT);
  set(2, totalTechGross, { ...tot }, FMT_CURRENCY);
  set(3, totalTechParts, { ...tot }, FMT_CURRENCY);
  set(4, totalTechTips, { ...tot }, FMT_CURRENCY);
  set(5, totalTechNet, { ...tot }, FMT_CURRENCY);
  set(6, totalTechPay, { ...tot }, FMT_CURRENCY);
  set(7, totalTechCompanyNet, { ...tot }, FMT_CURRENCY);
  set(8, `Margin: ${report.totals.companyNetMarginPct.toFixed(1)}%`, {
    ...tot,
    alignment: { horizontal: "center" },
  });
  r++;

  r++; // spacer

  // ── Monthly section header ─────────────────────────────────────────────────
  set(0, "MONTHLY REVENUE COMPARISON", {
    fill: { fgColor: { rgb: NAVY } },
    font: { bold: true, color: { rgb: WHITE }, sz: 11, name: "Calibri" },
    alignment: { horizontal: "left", vertical: "center" },
    border: allBdr(NAVY),
  });
  span(0, 8);
  r++;

  // ── Monthly column headers ─────────────────────────────────────────────────
  const monthlyColHeaders = [
    "Month",
    "Jobs",
    "Gross",
    "Parts",
    "Net",
    "Tech/Sub Pay",
    "Company Net",
    "% of Total",
    "Co Net %",
  ];
  for (let i = 0; i < monthlyColHeaders.length; i++) {
    set(i, monthlyColHeaders[i], {
      fill: { fgColor: { rgb: BLUE } },
      font: { bold: true, color: { rgb: WHITE }, sz: 10, name: "Calibri" },
      alignment: { horizontal: "center", vertical: "center" },
      border: allBdr(NAVY),
    });
  }
  r++;

  // ── Monthly data rows ──────────────────────────────────────────────────────
  for (let idx = 0; idx < report.monthlyRows.length; idx++) {
    const m = report.monthlyRows[idx];
    const bg = idx % 2 === 0 ? WHITE : LT_BLUE;
    const base = {
      fill: { fgColor: { rgb: bg } },
      font: { color: { rgb: TEXT_DARK }, sz: 10, name: "Calibri" },
      border: allBdr(),
    };
    const num = { ...base, alignment: { horizontal: "right" } };
    set(0, m.month, {
      ...base,
      font: { ...base.font, bold: true },
      alignment: { horizontal: "left", indent: 1 },
    });
    set(1, m.jobs, { ...num }, FMT_INT);
    set(2, m.gross, { ...num }, FMT_CURRENCY);
    set(3, m.parts, { ...num }, FMT_CURRENCY);
    set(4, m.net, { ...num }, FMT_CURRENCY);
    set(5, m.techPay, { ...num }, FMT_CURRENCY);
    set(
      6,
      m.companyNet,
      { ...num, font: { ...base.font, bold: true, color: { rgb: GREEN } } },
      FMT_CURRENCY,
    );
    set(7, m.pctOfTotal / 100, { ...num }, FMT_PCT);
    set(8, m.companyNetPct / 100, { ...num }, FMT_PCT);
    r++;
  }

  // ── Sheet metadata ─────────────────────────────────────────────────────────
  ws["!ref"] = XS.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: r - 1, c: 8 },
  });
  ws["!merges"] = merges;
  ws["!cols"] = [
    { wch: 28 }, // A - Technician / Month
    { wch: 7 }, // B - Jobs
    { wch: 17 }, // C - Gross Revenue
    { wch: 14 }, // D - Parts
    { wch: 12 }, // E - Tips
    { wch: 15 }, // F - Net Revenue
    { wch: 15 }, // G - Tech Pay
    { wch: 15 }, // H - Company Net
    { wch: 22 }, // I - Split / Pct
  ];

  // Row heights: title, subtitle, spacer, KPI header, 3×(label+value), spacer,
  //              tech header, tech col-headers - rest inherit default.
  ws["!rows"] = [
    { hpt: 38 }, // title
    { hpt: 20 }, // subtitle
    { hpt: 6 }, // spacer
    { hpt: 22 }, // KPI section header
    { hpt: 16 },
    { hpt: 30 }, // KPI row 1
    { hpt: 16 },
    { hpt: 30 }, // KPI row 2
    { hpt: 16 },
    { hpt: 30 }, // KPI row 3
    { hpt: 6 }, // spacer
    { hpt: 22 }, // tech section header
    { hpt: 28 }, // tech column headers
  ];

  // ── Write & save ───────────────────────────────────────────────────────────
  const wb = XS.utils.book_new();
  XS.utils.book_append_sheet(wb, ws, "Financial Report");

  // ── Job Detail sheet ───────────────────────────────────────────────────────
  const detailWs = buildTechJobDetailSheet(report, XS);
  XS.utils.book_append_sheet(wb, detailWs, "Job Detail");

  // ── Review Totals sheet ───────────────────────────────────────────────────
  const reviewWs = buildReviewTotalsSheet(report, XS);
  XS.utils.book_append_sheet(wb, reviewWs, "Review Totals");

  const output = XS.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(
    new Blob([output], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    makeFileName("excel", report.scopeLabel, report.company.name),
  );
}

interface JsPdfWithAutoTable {
  lastAutoTable?: {
    finalY?: number;
  };
}

export async function exportDashboardReportAsPdf(
  report: DashboardExportReport,
) {
  const [{ default: JsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tbl = autoTable as any;
  const doc = new JsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const docX = doc as unknown as JsPdfWithAutoTable;

  // ── Color palette (RGB) ────────────────────────────────────────────────────
  const MIDNIGHT = [10, 36, 64] as [number, number, number];
  const TEAL_DARK = [4, 120, 87] as [number, number, number];
  const TEAL_COL = [6, 148, 109] as [number, number, number];
  const MINT_PALE = [236, 253, 245] as [number, number, number];
  const MINT_MID = [209, 250, 229] as [number, number, number];
  const GREEN_TXT = [6, 78, 59] as [number, number, number];
  const SLATE_TXT = [51, 65, 85] as [number, number, number];
  const TEXT_DARK = [15, 23, 42] as [number, number, number];
  const WHITE = [255, 255, 255] as [number, number, number];
  const DIVIDER = [167, 243, 208] as [number, number, number];

  const PAGE_W = 841.89;
  const PAGE_H = 595.28;
  const MARGIN = 36;
  const CWIDTH = PAGE_W - MARGIN * 2;

  // ── Helper: draw a full-width banner ──────────────────────────────────────
  const banner = (
    y: number,
    h: number,
    [r, g, b]: [number, number, number],
    text: string,
    opts: {
      size?: number;
      bold?: boolean;
      color?: [number, number, number];
      align?: "left" | "center";
    } = {},
  ) => {
    doc.setFillColor(r, g, b);
    doc.rect(0, y, PAGE_W, h, "F");
    doc.setTextColor(...(opts.color ?? WHITE));
    doc.setFontSize(opts.size ?? 10);
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    const x = opts.align === "left" ? MARGIN + 8 : PAGE_W / 2;
    doc.text(text, x, y + h * 0.65, {
      align: opts.align === "left" ? "left" : "center",
      baseline: "middle",
    });
  };

  // ═══════════════════════════════════════
  //  PAGE 1  -  KPIs + Technician table
  // ═══════════════════════════════════════

  // Title bar
  banner(0, 48, MIDNIGHT, report.title, { size: 18, bold: true });

  // Accent bar - thin teal stripe
  doc.setFillColor(...TEAL_DARK);
  doc.rect(0, 48, PAGE_W, 4, "F");

  // Subtitle bar
  banner(
    52,
    22,
    [20, 60, 80] as [number, number, number],
    `Company: ${report.company.name} (${report.company.id})   ·   Reporting Period: ${report.reportingPeriod}   ·   Scope: ${report.scopeLabel}   ·   Generated: ${report.generatedAt}`,
    { size: 7.5, color: MINT_MID },
  );

  // ── KPI section banner ────────────────────────────────────────────────────
  const kpiY = 82;
  banner(kpiY, 18, TEAL_DARK, "KEY PERFORMANCE INDICATORS", {
    size: 8.5,
    bold: true,
    align: "left",
  });

  // ── KPI grid (3 columns of label+value pairs) ─────────────────────────────
  const kpiItems = [
    {
      label: "Total Gross Revenue",
      value: fmtCurrency(report.totals.grossRevenue),
    },
    {
      label: "Total Parts & Materials",
      value: fmtCurrency(report.totals.partsCost),
    },
    {
      label: "Net Revenue (After Parts)",
      value: fmtCurrency(report.totals.netRevenue),
    },
    {
      label: "Total Company Net",
      value: fmtCurrency(report.totals.companyNet),
    },
    {
      label: "Total Jobs Completed",
      value: String(report.totals.totalJobsCompleted),
    },
    {
      label: "Avg Revenue Per Job",
      value: fmtCurrency(report.totals.avgRevenuePerJob),
    },
    {
      label: "Company Net Margin",
      value: fmtPercent(report.totals.companyNetMarginPct),
    },
    {
      label: "Total Technician Commissions",
      value: fmtCurrency(report.totals.totalTechnicianCommissions),
    },
    {
      label: "Total Deposits",
      value: fmtCurrency(report.totals.totalDeposits),
    },
  ];

  // Build rows: [labelA, valueA, labelB, valueB, labelC, valueC]
  const kpiRows: string[][] = [];
  for (let i = 0; i < kpiItems.length; i += 3) {
    kpiRows.push([
      kpiItems[i]?.label ?? "",
      kpiItems[i]?.value ?? "",
      kpiItems[i + 1]?.label ?? "",
      kpiItems[i + 1]?.value ?? "",
      kpiItems[i + 2]?.label ?? "",
      kpiItems[i + 2]?.value ?? "",
    ]);
  }

  const kpiColW = CWIDTH / 3;
  tbl(doc, {
    startY: kpiY + 18,
    margin: { left: MARGIN, right: MARGIN },
    tableWidth: CWIDTH,
    body: kpiRows,
    theme: "plain",
    styles: {
      lineWidth: 0.4,
      lineColor: DIVIDER,
      cellPadding: { top: 3, bottom: 3, left: 6, right: 6 },
    },
    columnStyles: {
      0: {
        cellWidth: kpiColW * 0.55,
        fontSize: 7,
        textColor: SLATE_TXT,
        fontStyle: "normal",
      },
      1: {
        cellWidth: kpiColW * 0.45,
        fontSize: 10,
        textColor: MIDNIGHT,
        fontStyle: "bold",
        halign: "right",
      },
      2: {
        cellWidth: kpiColW * 0.55,
        fontSize: 7,
        textColor: SLATE_TXT,
        fontStyle: "normal",
      },
      3: {
        cellWidth: kpiColW * 0.45,
        fontSize: 10,
        textColor: MIDNIGHT,
        fontStyle: "bold",
        halign: "right",
      },
      4: {
        cellWidth: kpiColW * 0.55,
        fontSize: 7,
        textColor: SLATE_TXT,
        fontStyle: "normal",
      },
      5: {
        cellWidth: kpiColW * 0.45,
        fontSize: 10,
        textColor: MIDNIGHT,
        fontStyle: "bold",
        halign: "right",
      },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    didParseCell: (data: any) => {
      data.cell.styles.fillColor = data.row.index % 2 === 0 ? WHITE : MINT_PALE;
      // Vertical separator between card groups
      if (data.column.index === 1 || data.column.index === 3) {
        data.cell.styles.lineColor = [120, 200, 160];
      }
    },
  });

  const techTipsKpiY = (docX.lastAutoTable?.finalY ?? kpiY + 90) + 4;
  tbl(doc, {
    startY: techTipsKpiY,
    margin: { left: MARGIN, right: MARGIN },
    tableWidth: CWIDTH,
    body: [["Total Technician Tips", fmtCurrency(report.totals.totalTips)]],
    theme: "grid",
    headStyles: {
      fillColor: TEAL_COL,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 8,
      halign: "left",
    },
    bodyStyles: { fontSize: 9, textColor: TEXT_DARK, cellPadding: 4 },
    styles: { lineWidth: 0.3, lineColor: DIVIDER },
    columnStyles: {
      0: { cellWidth: CWIDTH * 0.67, halign: "left", fontStyle: "bold" },
      1: { cellWidth: CWIDTH * 0.33, halign: "right", fontStyle: "bold" },
    },
  });

  // ── Technician section banner ─────────────────────────────────────────────
  const techBannerY = (docX.lastAutoTable?.finalY ?? kpiY + 90) + 12;
  banner(
    techBannerY,
    18,
    MIDNIGHT,
    `TECHNICIAN PERFORMANCE  -  ${report.scopeLabel}`,
    { size: 8.5, bold: true, align: "left" },
  );

  // ── Technician table ──────────────────────────────────────────────────────
  const totalTechPay = report.technicianRows.reduce((s, t) => s + t.techPay, 0);
  const totalTechGross = report.technicianRows.reduce(
    (s, t) => s + t.grossRevenue,
    0,
  );
  const totalTechParts = report.technicianRows.reduce((s, t) => s + t.parts, 0);
  const totalTechTips = report.technicianRows.reduce((s, t) => s + t.tips, 0);
  const totalTechNet = report.technicianRows.reduce(
    (s, t) => s + t.netRevenue,
    0,
  );
  const totalTechCompanyNet = report.technicianRows.reduce(
    (s, t) => s + t.companyNet,
    0,
  );

  tbl(doc, {
    startY: techBannerY + 18,
    margin: { left: MARGIN, right: MARGIN },
    tableWidth: CWIDTH,
    head: [
      [
        "Technician",
        "Jobs",
        "Gross Revenue",
        "Parts",
        "Tips",
        "Net Revenue",
        "Tech/Sub Pay",
        "Company Net",
        "Co. Split",
      ],
    ],
    body: report.technicianRows.map((row) => [
      row.technician,
      row.jobs,
      fmtCurrency(row.grossRevenue),
      fmtCurrency(row.parts),
      fmtCurrency(row.tips),
      fmtCurrency(row.netRevenue),
      fmtCurrency(row.techPay),
      fmtCurrency(row.companyNet),
      row.splitLabel,
    ]),
    foot: [
      [
        "TOTAL",
        String(report.totals.totalJobsCompleted),
        fmtCurrency(totalTechGross),
        fmtCurrency(totalTechParts),
        fmtCurrency(totalTechTips),
        fmtCurrency(totalTechNet),
        fmtCurrency(totalTechPay),
        fmtCurrency(totalTechCompanyNet),
        `Margin: ${report.totals.companyNetMarginPct.toFixed(1)}%`,
      ],
    ],
    theme: "grid",
    showFoot: "lastPage",
    headStyles: {
      fillColor: TEAL_COL,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
      cellPadding: 4,
    },
    bodyStyles: { fontSize: 8, cellPadding: 3.5, textColor: TEXT_DARK },
    alternateRowStyles: { fillColor: MINT_PALE },
    footStyles: {
      fillColor: MIDNIGHT,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 8,
      halign: "right",
    },
    styles: { lineWidth: 0.3, lineColor: DIVIDER },
    columnStyles: {
      0: { halign: "left", cellWidth: 90 },
      1: { halign: "center", cellWidth: 32 },
      2: { halign: "right", cellWidth: 74 },
      3: { halign: "right", cellWidth: 60 },
      4: { halign: "right", cellWidth: 52 },
      5: { halign: "right", cellWidth: 74 },
      6: { halign: "right", cellWidth: 68 },
      7: { halign: "right", cellWidth: 68 },
      8: { halign: "center" },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    didParseCell: (data: any) => {
      // Company Net column - green bold text in body
      if (data.column.index === 7 && data.row.section === "body") {
        data.cell.styles.textColor = GREEN_TXT;
        data.cell.styles.fontStyle = "bold";
      }
      // Total label in footer - left-align
      if (data.row.section === "foot" && data.column.index === 0) {
        data.cell.styles.halign = "left";
      }
    },
  });

  // ═══════════════════════════════════════
  //  PAGE 2  -  Monthly comparison
  // ═══════════════════════════════════════
  doc.addPage("a4", "landscape");

  // Title bar (repeat branding)
  banner(0, 32, MIDNIGHT, report.title, { size: 13, bold: true });
  doc.setFillColor(...TEAL_DARK);
  doc.rect(0, 32, PAGE_W, 3, "F");

  // Monthly section banner
  banner(43, 18, TEAL_DARK, "MONTHLY REVENUE COMPARISON", {
    size: 8.5,
    bold: true,
    align: "left",
  });

  // Monthly stat strip - jobs + gross inline
  const totalMonthJobs = report.monthlyRows.reduce((s, m) => s + m.jobs, 0);
  const totalMonthGross = report.monthlyRows.reduce((s, m) => s + m.gross, 0);
  const totalMonthParts = report.monthlyRows.reduce((s, m) => s + m.parts, 0);
  const totalMonthNet = report.monthlyRows.reduce((s, m) => s + m.net, 0);
  const totalMonthTechPay = report.monthlyRows.reduce(
    (s, m) => s + m.techPay,
    0,
  );
  const totalMonthCompanyNet = report.monthlyRows.reduce(
    (s, m) => s + m.companyNet,
    0,
  );
  const totalMonthCompanyNetPct =
    totalMonthGross > 0 ? (totalMonthCompanyNet / totalMonthGross) * 100 : 0;
  banner(
    61,
    16,
    [20, 83, 82] as [number, number, number],
    `${report.monthlyRows.length} Month${report.monthlyRows.length !== 1 ? "s" : ""}   ·   ${totalMonthJobs} Total Jobs   ·   ${fmtCurrency(totalMonthGross)} Total Gross   ·   Company: ${report.company.name}`,
    { size: 7.5, color: MINT_MID },
  );

  // ── Monthly table ─────────────────────────────────────────────────────────
  tbl(doc, {
    startY: 85,
    margin: { left: MARGIN, right: MARGIN },
    tableWidth: CWIDTH,
    head: [
      [
        "Month",
        "Jobs",
        "Gross Revenue",
        "Parts & Materials",
        "Net Revenue",
        "Tech/Sub Pay",
        "Company Net",
        "% of Total",
        "Co Net %",
      ],
    ],
    body: report.monthlyRows.map((row) => [
      row.month,
      row.jobs,
      fmtCurrency(row.gross),
      fmtCurrency(row.parts),
      fmtCurrency(row.net),
      fmtCurrency(row.techPay),
      fmtCurrency(row.companyNet),
      fmtPercent(row.pctOfTotal),
      fmtPercent(row.companyNetPct),
    ]),
    foot: [
      [
        "TOTAL",
        String(totalMonthJobs),
        fmtCurrency(totalMonthGross),
        fmtCurrency(totalMonthParts),
        fmtCurrency(totalMonthNet),
        fmtCurrency(totalMonthTechPay),
        fmtCurrency(totalMonthCompanyNet),
        "100.0%",
        fmtPercent(totalMonthCompanyNetPct),
      ],
    ],
    theme: "grid",
    showFoot: "lastPage",
    headStyles: {
      fillColor: TEAL_COL,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "center",
      cellPadding: 5,
    },
    bodyStyles: { fontSize: 8.5, cellPadding: 4, textColor: TEXT_DARK },
    alternateRowStyles: { fillColor: MINT_PALE },
    footStyles: {
      fillColor: MIDNIGHT,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "right",
    },
    styles: { lineWidth: 0.3, lineColor: DIVIDER },
    columnStyles: {
      0: { halign: "left", fontStyle: "bold", cellWidth: 90 },
      1: { halign: "center", cellWidth: 36 },
      2: { halign: "right", cellWidth: 84 },
      3: { halign: "right", cellWidth: 84 },
      4: { halign: "right", cellWidth: 84 },
      5: { halign: "right", cellWidth: 80 },
      6: { halign: "right", cellWidth: 80 },
      7: { halign: "right", cellWidth: 56 },
      8: { halign: "right", cellWidth: 56 },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    didParseCell: (data: any) => {
      // Company Net - green bold in body
      if (data.column.index === 6 && data.row.section === "body") {
        data.cell.styles.textColor = GREEN_TXT;
        data.cell.styles.fontStyle = "bold";
      }
      // % of Total - teal text
      if (data.column.index === 7 && data.row.section === "body") {
        data.cell.styles.textColor = TEAL_DARK;
      }
      // Footer first col - left-align
      if (data.row.section === "foot" && data.column.index === 0) {
        data.cell.styles.halign = "left";
      }
    },
  });

  // ═══════════════════════════════════════
  //  PAGE 3  -  Review totals
  // ═══════════════════════════════════════
  doc.addPage("a4", "landscape");

  banner(0, 32, MIDNIGHT, report.title, { size: 13, bold: true });
  doc.setFillColor(...TEAL_DARK);
  doc.rect(0, 32, PAGE_W, 3, "F");

  banner(43, 18, TEAL_DARK, `REVIEW TOTALS  -  ${report.scopeLabel}`, {
    size: 8.5,
    bold: true,
    align: "left",
  });

  const reviewKpis = [
    ["Done Jobs", String(report.reviewTotals.totalDoneJobs)],
    ["Jobs With Reviews", String(report.reviewTotals.totalJobsWithReviews)],
    [
      "Jobs Without Reviews",
      String(report.reviewTotals.totalJobsWithoutReviews),
    ],
    ["Review Coverage", fmtPercent(report.reviewTotals.reviewCapturePct)],
    ["Total Review Amount", fmtCurrency(report.reviewTotals.totalReviewAmount)],
    ["Avg Review Amount", fmtCurrency(report.reviewTotals.avgReviewAmount)],
    [
      "Avg Review per Done Job",
      fmtCurrency(report.reviewTotals.avgReviewAmountPerDoneJob),
    ],
    ["Distinct Review Types", String(report.reviewTotals.distinctReviewTypes)],
    [
      "Distinct Payment Methods",
      String(report.reviewTotals.distinctPaymentMethods),
    ],
  ];

  const reviewRows: string[][] = [];
  for (let i = 0; i < reviewKpis.length; i += 3) {
    reviewRows.push([
      reviewKpis[i]?.[0] ?? "",
      reviewKpis[i]?.[1] ?? "",
      reviewKpis[i + 1]?.[0] ?? "",
      reviewKpis[i + 1]?.[1] ?? "",
      reviewKpis[i + 2]?.[0] ?? "",
      reviewKpis[i + 2]?.[1] ?? "",
    ]);
  }

  const reviewKpiColW = CWIDTH / 3;
  tbl(doc, {
    startY: 63,
    margin: { left: MARGIN, right: MARGIN },
    tableWidth: CWIDTH,
    body: reviewRows,
    theme: "plain",
    styles: {
      lineWidth: 0.4,
      lineColor: DIVIDER,
      cellPadding: { top: 3, bottom: 3, left: 6, right: 6 },
    },
    columnStyles: {
      0: {
        cellWidth: reviewKpiColW * 0.55,
        fontSize: 7,
        textColor: SLATE_TXT,
      },
      1: {
        cellWidth: reviewKpiColW * 0.45,
        fontSize: 10,
        textColor: MIDNIGHT,
        fontStyle: "bold",
        halign: "right",
      },
      2: {
        cellWidth: reviewKpiColW * 0.55,
        fontSize: 7,
        textColor: SLATE_TXT,
      },
      3: {
        cellWidth: reviewKpiColW * 0.45,
        fontSize: 10,
        textColor: MIDNIGHT,
        fontStyle: "bold",
        halign: "right",
      },
      4: {
        cellWidth: reviewKpiColW * 0.55,
        fontSize: 7,
        textColor: SLATE_TXT,
      },
      5: {
        cellWidth: reviewKpiColW * 0.45,
        fontSize: 10,
        textColor: MIDNIGHT,
        fontStyle: "bold",
        halign: "right",
      },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    didParseCell: (data: any) => {
      data.cell.styles.fillColor = data.row.index % 2 === 0 ? WHITE : MINT_PALE;
    },
  });

  const reviewBreakdownStartY = (docX.lastAutoTable?.finalY ?? 140) + 12;
  tbl(doc, {
    startY: reviewBreakdownStartY,
    margin: { left: MARGIN, right: MARGIN },
    tableWidth: CWIDTH,
    head: [["Review Type", "Reviews", "Total Amount", "Avg Amount"]],
    body: report.reviewTypeRows
      .slice(0, 8)
      .map((row) => [
        row.label,
        String(row.reviews),
        fmtCurrency(row.totalAmount),
        fmtCurrency(row.avgAmount),
      ]),
    theme: "grid",
    headStyles: {
      fillColor: TEAL_COL,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
    },
    bodyStyles: { fontSize: 8, textColor: TEXT_DARK },
    alternateRowStyles: { fillColor: MINT_PALE },
    styles: { lineWidth: 0.3, lineColor: DIVIDER },
    columnStyles: {
      0: { halign: "left", cellWidth: 190 },
      1: { halign: "center", cellWidth: 60 },
      2: { halign: "right", cellWidth: 95 },
      3: { halign: "right", cellWidth: 95 },
    },
  });

  tbl(doc, {
    startY: reviewBreakdownStartY,
    margin: { left: PAGE_W / 2 + 6, right: MARGIN },
    tableWidth: CWIDTH / 2 - 6,
    head: [["Payment Method", "Reviews", "Total Amount", "Avg Amount"]],
    body: report.paymentMethodRows
      .slice(0, 8)
      .map((row) => [
        row.label,
        String(row.reviews),
        fmtCurrency(row.totalAmount),
        fmtCurrency(row.avgAmount),
      ]),
    theme: "grid",
    headStyles: {
      fillColor: TEAL_COL,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
    },
    bodyStyles: { fontSize: 8, textColor: TEXT_DARK },
    alternateRowStyles: { fillColor: MINT_PALE },
    styles: { lineWidth: 0.3, lineColor: DIVIDER },
    columnStyles: {
      0: { halign: "left", cellWidth: 145 },
      1: { halign: "center", cellWidth: 44 },
      2: { halign: "right", cellWidth: 70 },
      3: { halign: "right", cellWidth: 70 },
    },
  });

  const reviewTechnicianStartY =
    (docX.lastAutoTable?.finalY ?? reviewBreakdownStartY) + 14;
  tbl(doc, {
    startY: reviewTechnicianStartY,
    margin: { left: MARGIN, right: MARGIN },
    tableWidth: CWIDTH,
    head: [["Technician", "Reviews", "Total Amount", "Avg Amount"]],
    body: report.reviewTechnicianRows
      .slice(0, 10)
      .map((row) => [
        row.label,
        String(row.reviews),
        fmtCurrency(row.totalAmount),
        fmtCurrency(row.avgAmount),
      ]),
    theme: "grid",
    headStyles: {
      fillColor: TEAL_COL,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
    },
    bodyStyles: { fontSize: 8, textColor: TEXT_DARK },
    alternateRowStyles: { fillColor: MINT_PALE },
    styles: { lineWidth: 0.3, lineColor: DIVIDER },
    columnStyles: {
      0: { halign: "left", cellWidth: 280 },
      1: { halign: "center", cellWidth: 72 },
      2: { halign: "right", cellWidth: 120 },
      3: { halign: "right", cellWidth: 120 },
    },
  });

  appendPdfTechJobDetailPages({
    doc,
    tbl,
    report,
    fmtCurrency,
    banner,
    palette: {
      MIDNIGHT,
      TEAL_DARK,
      TEAL_COL,
      MINT_PALE,
      MINT_MID,
      GREEN_TXT,
      TEXT_DARK,
      DIVIDER,
      WHITE,
    },
    layout: {
      PAGE_W,
      MARGIN,
      CWIDTH,
    },
  });

  // ── Footer on every page ──────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(...MINT_PALE);
    doc.rect(0, PAGE_H - 18, PAGE_W, 18, "F");
    doc.setTextColor(...SLATE_TXT);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("KLICKTIV  ·  Confidential Financial Report", MARGIN, PAGE_H - 6);
    doc.text(`Page ${p} of ${totalPages}`, PAGE_W - MARGIN, PAGE_H - 6, {
      align: "right",
    });
  }

  doc.save(makeFileName("pdf", report.scopeLabel, report.company.name));
}
