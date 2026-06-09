import { formatCurrency, formatPercent } from "@/lib/format";

export interface ReportRow {
  name: string;
  nameEn?: string;
  category?: string;
  price: number;
  cost: number;
  foodCostRatio: number;
  grossProfit: number;
  grossMargin: number;
  flagged: boolean;
}

export interface ReportLabels {
  title: string;
  generatedAt: string;
  logoHint: string;
  footer: string;
  summary: string;
  colIndex: string;
  colName: string;
  colPrice: string;
  colCost: string;
  colFoodCost: string;
  colProfit: string;
  colMargin: string;
  summaryDishes: string;
  summaryAvgFoodCost: string;
  summaryAvgMargin: string;
}

export interface ReportInput {
  labels: ReportLabels;
  rows: ReportRow[];
  currency: string;
  summary: { dishes: number; avgFoodCost: number; avgMargin: number };
  fileName?: string;
}

function esc(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      (({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }) as Record<string, string>)[c],
  );
}

const C = {
  text: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  accent: "#047857",
  accentSoft: "#ecfdf5",
  flagBg: "#fef2f2",
  danger: "#b91c1c",
  warning: "#b45309",
  success: "#047857",
  zebra: "#f8fafc",
};

function buildReportHtml(input: ReportInput): string {
  const { labels, rows, currency, summary } = input;
  const money = (n: number) => esc(formatCurrency(n, currency));
  const pct = (n: number) => esc(formatPercent(n));

  const ratioColor = (r: number) =>
    r <= 0.35 ? C.success : r <= 0.45 ? C.warning : C.danger;

  const rowsHtml = rows
    .map((r, i) => {
      const bg = r.flagged ? C.flagBg : i % 2 ? C.zebra : "#ffffff";
      const marginColor = r.flagged ? C.danger : C.text;
      return `
      <tr style="background:${bg}">
        <td style="padding:9px 10px;color:${C.muted};font-variant-numeric:tabular-nums;">${i + 1}</td>
        <td style="padding:9px 10px;">
          <div style="font-weight:600;color:${C.text};">${esc(r.name)}</div>
          ${r.nameEn ? `<div style="font-size:11px;color:${C.muted};">${esc(r.nameEn)}</div>` : ""}
        </td>
        <td style="padding:9px 10px;text-align:right;font-variant-numeric:tabular-nums;">${money(r.price)}</td>
        <td style="padding:9px 10px;text-align:right;font-variant-numeric:tabular-nums;">${money(r.cost)}</td>
        <td style="padding:9px 10px;text-align:right;font-variant-numeric:tabular-nums;color:${ratioColor(r.foodCostRatio)};font-weight:600;">${pct(r.foodCostRatio)}</td>
        <td style="padding:9px 10px;text-align:right;font-variant-numeric:tabular-nums;">${money(r.grossProfit)}</td>
        <td style="padding:9px 10px;text-align:right;font-variant-numeric:tabular-nums;color:${marginColor};font-weight:600;">${pct(r.grossMargin)}</td>
      </tr>`;
    })
    .join("");

  const th = (label: string, align = "left") =>
    `<th style="padding:10px;text-align:${align};font-size:11px;text-transform:uppercase;letter-spacing:0.04em;color:${C.muted};border-bottom:2px solid ${C.border};font-weight:700;">${esc(label)}</th>`;

  const summaryCard = (label: string, value: string) => `
    <div style="flex:1;border:1px solid ${C.border};border-radius:10px;padding:12px 14px;background:#ffffff;">
      <div style="font-size:11px;color:${C.muted};">${esc(label)}</div>
      <div style="font-size:22px;font-weight:800;color:${C.text};font-variant-numeric:tabular-nums;margin-top:2px;">${esc(value)}</div>
    </div>`;

  return `
  <div style="width:794px;box-sizing:border-box;padding:40px;background:#ffffff;color:${C.text};
       font-family:'Inter','Noto Sans TC','PingFang TC','Microsoft JhengHei',sans-serif;">
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid ${C.accent};padding-bottom:16px;">
      <div style="display:flex;align-items:center;gap:14px;">
        <div style="width:54px;height:54px;border:2px dashed ${C.border};border-radius:12px;display:flex;align-items:center;justify-content:center;color:${C.muted};font-size:9px;text-align:center;line-height:1.2;">${esc(labels.logoHint)}</div>
        <div>
          <div style="font-size:24px;font-weight:800;letter-spacing:-0.01em;">${esc(labels.title)}</div>
          <div style="font-size:12px;color:${C.muted};margin-top:2px;">${esc(labels.generatedAt)}: ${esc(
            new Date().toLocaleString(),
          )}</div>
        </div>
      </div>
      <div style="text-align:right;color:${C.accent};font-weight:800;font-size:13px;">FoodCost<br/><span style="color:${C.muted};font-weight:600;font-size:10px;letter-spacing:0.14em;">MENU COSTING</span></div>
    </div>

    <!-- Summary -->
    <div style="display:flex;gap:12px;margin:20px 0 22px;">
      ${summaryCard(labels.summaryDishes, String(summary.dishes))}
      ${summaryCard(labels.summaryAvgFoodCost, formatPercent(summary.avgFoodCost))}
      ${summaryCard(labels.summaryAvgMargin, formatPercent(summary.avgMargin))}
    </div>

    <!-- Table -->
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr>
          ${th(labels.colIndex)}
          ${th(labels.colName)}
          ${th(labels.colPrice, "right")}
          ${th(labels.colCost, "right")}
          ${th(labels.colFoodCost, "right")}
          ${th(labels.colProfit, "right")}
          ${th(labels.colMargin, "right")}
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>

    <!-- Footer -->
    <div style="margin-top:28px;padding-top:14px;border-top:1px solid ${C.border};font-size:11px;color:${C.muted};text-align:center;">
      ${esc(labels.footer)}
    </div>
  </div>`;
}

/** Render the report HTML to a canvas and save it as a multi-page A4 PDF. */
export async function exportReportPdf(input: ReportInput): Promise<void> {
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-10000px";
  host.style.top = "0";
  host.style.zIndex = "-1";
  host.innerHTML = buildReportHtml(input);
  document.body.appendChild(host);

  try {
    // Load the heavy PDF libraries on demand so they stay out of the main bundle.
    const [{ jsPDF }, html2canvasMod] = await Promise.all([
      import("jspdf"),
      import("html2canvas"),
    ]);
    const html2canvas = html2canvasMod.default;

    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
    const target = host.firstElementChild as HTMLElement;
    const canvas = await html2canvas(target, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
    });

    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const date = new Date().toISOString().slice(0, 10);
    pdf.save(input.fileName ?? `menu-cost-report-${date}.pdf`);
  } finally {
    document.body.removeChild(host);
  }
}
