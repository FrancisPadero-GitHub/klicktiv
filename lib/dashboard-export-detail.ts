import type { DashboardExportReport } from "@/lib/dashboard-export";

type RgbColor = [number, number, number];

interface PdfDetailPageOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tbl: any;
  report: DashboardExportReport;
  fmtCurrency: (value: number) => string;
  banner: (
    y: number,
    h: number,
    color: RgbColor,
    text: string,
    opts?: {
      size?: number;
      bold?: boolean;
      color?: RgbColor;
      align?: "left" | "center";
    },
  ) => void;
  palette: {
    MIDNIGHT: RgbColor;
    TEAL_DARK: RgbColor;
    TEAL_COL: RgbColor;
    MINT_PALE: RgbColor;
    MINT_MID: RgbColor;
    GREEN_TXT: RgbColor;
    TEXT_DARK: RgbColor;
    DIVIDER: RgbColor;
    WHITE: RgbColor;
  };
  layout: {
    PAGE_W: number;
    MARGIN: number;
    CWIDTH: number;
  };
}

export function buildTechJobDetailSheet(
  report: DashboardExportReport,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  XS: any,
) {
  const NAVY = "1F3764";
  const BLUE = "2F5496";
  const MED_BLUE = "4472C4";
  const LT_BLUE = "D9E1F2";
  const WHITE = "FFFFFF";
  const BORDER = "B8CCE4";
  const TEXT_DARK = "1A1A2E";
  const GREEN = "1E5C1E";

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

  const set = (
    col: number,
    v: string | number | null | undefined,
    s: object = {},
    z?: string,
  ) => {
    // Handle invalid values to prevent Excel corruption
    let val = v;
    let type: "n" | "s" = "s";

    if (v === null || v === undefined) {
      val = "";
    } else if (typeof v === "number") {
      if (isNaN(v) || !isFinite(v)) {
        val = 0;
      }
      type = "n";
    }

    const cell: Record<string, unknown> = {
      v: val,
      t: type,
      s,
    };
    if (z) cell.z = z;
    ws[enc(r, col)] = cell;
  };
  const span = (c1: number, c2: number, r2 = r) =>
    merges.push({ s: { r, c: c1 }, e: { r: r2, c: c2 } });

  const FMT_CURRENCY = "$#,##0.00";

  set(0, `TECHNICIAN JOB DETAIL  -  ${report.scopeLabel}`, {
    fill: { fgColor: { rgb: NAVY } },
    font: { bold: true, color: { rgb: WHITE }, sz: 16, name: "Calibri" },
    alignment: { horizontal: "center", vertical: "center" },
  });
  span(0, 11);
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
  span(0, 11);
  r++;
  r++;

  for (const group of report.techJobDetailGroups) {
    const rate = group.commissionRate;

    set(0, `\u25BA  ${group.technician.toUpperCase()}  (${group.splitLabel})`, {
      fill: { fgColor: { rgb: MED_BLUE } },
      font: { bold: true, color: { rgb: WHITE }, sz: 11, name: "Calibri" },
      alignment: { horizontal: "left", vertical: "center", indent: 1 },
      border: allBdr(NAVY),
    });
    span(0, 11);
    r++;

    const colHeaders = [
      "Date",
      "Address",
      "Gross/Subtotal",
      "Deposits",
      "Payment Status",
      "Tip",
      "Parts Costs",
      "Net (After Parts)",
      `Tech Pay (${rate}%)`,
      `Company Net (${100 - rate}%)`,
      "Review Amount",
      "Month",
    ];
    const colHdr = {
      fill: { fgColor: { rgb: BLUE } },
      font: { bold: true, color: { rgb: WHITE }, sz: 10, name: "Calibri" },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: allBdr(NAVY),
    };
    for (let i = 0; i < colHeaders.length; i++) set(i, colHeaders[i], colHdr);
    r++;

    for (let idx = 0; idx < group.jobs.length; idx++) {
      const job = group.jobs[idx];
      const bg = idx % 2 === 0 ? WHITE : LT_BLUE;
      const base = {
        fill: { fgColor: { rgb: bg } },
        font: { color: { rgb: TEXT_DARK }, sz: 10, name: "Calibri" },
        border: allBdr(),
      };
      const num = { ...base, alignment: { horizontal: "right" } };
      const ctr = { ...base, alignment: { horizontal: "center" } };
      set(0, job.date, ctr);
      set(1, job.address, {
        ...base,
        alignment: { horizontal: "left", indent: 1 },
      });
      set(2, job.gross || 0, { ...num }, FMT_CURRENCY);
      set(3, job.deposits || 0, { ...num }, FMT_CURRENCY);
      set(4, job.paymentStatus.toUpperCase(), ctr);
      set(5, job.tip || 0, { ...num }, FMT_CURRENCY);
      set(6, job.parts || 0, { ...num }, FMT_CURRENCY);
      set(7, job.netAfterParts || 0, { ...num }, FMT_CURRENCY);
      set(8, job.techPay || 0, { ...num }, FMT_CURRENCY);
      set(
        9,
        job.companyNet || 0,
        { ...num, font: { ...base.font, bold: true, color: { rgb: GREEN } } },
        FMT_CURRENCY,
      );
      set(10, job.reviewAmount || 0, { ...num }, FMT_CURRENCY);
      set(11, job.month, ctr);
      r++;
    }

    const tot = {
      fill: { fgColor: { rgb: NAVY } },
      font: { bold: true, color: { rgb: WHITE }, sz: 10, name: "Calibri" },
      border: allBdr(NAVY),
      alignment: { horizontal: "right" },
    };
    set(0, `TOTAL  -  ${group.technician} (${group.jobs.length} jobs)`, {
      ...tot,
      alignment: { horizontal: "left", indent: 1 },
    });
    span(0, 1);
    set(2, group.totals.gross, { ...tot }, FMT_CURRENCY);
    set(3, group.totals.deposits, { ...tot }, FMT_CURRENCY);
    set(4, "-", { ...tot, alignment: { horizontal: "center" } });
    set(5, group.totals.tip, { ...tot }, FMT_CURRENCY);
    set(6, group.totals.parts, { ...tot }, FMT_CURRENCY);
    set(7, group.totals.netAfterParts, { ...tot }, FMT_CURRENCY);
    set(8, group.totals.techPay, { ...tot }, FMT_CURRENCY);
    set(9, group.totals.companyNet, { ...tot }, FMT_CURRENCY);
    set(10, group.totals.reviewAmount, { ...tot }, FMT_CURRENCY);
    set(11, `${group.jobs.length} jobs`, {
      ...tot,
      alignment: { horizontal: "center" },
    });
    r++;
    r++;
  }

  ws["!ref"] = XS.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: r - 1, c: 11 },
  });
  ws["!merges"] = merges;
  ws["!cols"] = [
    { wch: 13 },
    { wch: 34 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 13 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 12 },
  ];
  ws["!rows"] = [{ hpt: 38 }, { hpt: 20 }, { hpt: 6 }];
  return ws;
}

export function appendPdfTechJobDetailPages({
  doc,
  tbl,
  report,
  fmtCurrency,
  banner,
  palette,
  layout,
}: PdfDetailPageOptions) {
  const {
    MIDNIGHT,
    TEAL_DARK,
    TEAL_COL,
    MINT_PALE,
    MINT_MID,
    GREEN_TXT,
    TEXT_DARK,
    DIVIDER,
    WHITE,
  } = palette;
  const { PAGE_W, MARGIN, CWIDTH } = layout;

  for (const group of report.techJobDetailGroups) {
    doc.addPage("a4", "landscape");

    banner(0, 36, MIDNIGHT, `TECHNICIAN JOB DETAIL  -  ${report.scopeLabel}`, {
      size: 13,
      bold: true,
    });
    doc.setFillColor(...TEAL_DARK);
    doc.rect(0, 36, PAGE_W, 3, "F");

    banner(
      47,
      20,
      [20, 60, 80],
      `${report.company.name} (${report.company.id})  ·  ${group.technician.toUpperCase()}  ·  ${group.splitLabel}  ·  ${group.jobs.length} Jobs   -   ${report.reportingPeriod}`,
      { size: 7.5, color: MINT_MID },
    );

    tbl(doc, {
      startY: 75,
      margin: { left: MARGIN, right: MARGIN },
      tableWidth: CWIDTH,
      head: [
        [
          "Date",
          "Address",
          "Gross/Subtotal",
          "Deposits",
          "Payment Status",
          "Tip",
          "Parts Costs",
          "Net (After Parts)",
          `Tech Pay (${group.commissionRate}%)`,
          `Company Net (${100 - group.commissionRate}%)`,
          "Review Amount",
          "Month",
        ],
      ],
      body: group.jobs.map((job) => [
        job.date,
        job.address,
        fmtCurrency(job.gross),
        fmtCurrency(job.deposits),
        job.paymentStatus.toUpperCase(),
        fmtCurrency(job.tip),
        fmtCurrency(job.parts),
        fmtCurrency(job.netAfterParts),
        fmtCurrency(job.techPay),
        fmtCurrency(job.companyNet),
        fmtCurrency(job.reviewAmount),
        job.month,
      ]),
      foot: [
        [
          `TOTAL (${group.jobs.length} jobs)`,
          "",
          fmtCurrency(group.totals.gross),
          fmtCurrency(group.totals.deposits),
          "-",
          fmtCurrency(group.totals.tip),
          fmtCurrency(group.totals.parts),
          fmtCurrency(group.totals.netAfterParts),
          fmtCurrency(group.totals.techPay),
          fmtCurrency(group.totals.companyNet),
          fmtCurrency(group.totals.reviewAmount),
          "",
        ],
      ],
      theme: "grid",
      showFoot: "lastPage",
      headStyles: {
        fillColor: TEAL_COL,
        textColor: WHITE,
        fontStyle: "bold",
        fontSize: 7.5,
        halign: "center",
        cellPadding: 4,
      },
      bodyStyles: { fontSize: 7.5, cellPadding: 3, textColor: TEXT_DARK },
      alternateRowStyles: { fillColor: MINT_PALE },
      footStyles: {
        fillColor: MIDNIGHT,
        textColor: WHITE,
        fontStyle: "bold",
        fontSize: 7.5,
        halign: "right",
      },
      styles: { lineWidth: 0.3, lineColor: DIVIDER },
      columnStyles: {
        0: { halign: "center", cellWidth: 58 },
        1: { halign: "left", cellWidth: 142 },
        2: { halign: "right", cellWidth: 62 },
        3: { halign: "right", cellWidth: 54 },
        4: { halign: "center", cellWidth: 52 },
        5: { halign: "right", cellWidth: 46 },
        6: { halign: "right", cellWidth: 54 },
        7: { halign: "right", cellWidth: 64 },
        8: { halign: "right", cellWidth: 62 },
        9: { halign: "right", cellWidth: 62 },
        10: { halign: "right", cellWidth: 60 },
        11: { halign: "center", cellWidth: 39 },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      didParseCell: (data: any) => {
        if (data.column.index === 9 && data.row.section === "body") {
          data.cell.styles.textColor = GREEN_TXT;
          data.cell.styles.fontStyle = "bold";
        }
        if (data.row.section === "foot" && data.column.index === 0) {
          data.cell.styles.halign = "left";
        }
      },
    });
  }
}
