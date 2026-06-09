import type { Lang } from "@/i18n/translations";

/** Local date as "YYYY-MM-DD". */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

/** "YYYY-MM-DD" → "YYYY-MM". */
export function monthKeyOf(dateISO: string): string {
  return dateISO.slice(0, 7);
}

export function currentMonthKey(): string {
  return todayISO().slice(0, 7);
}

/** Shift a "YYYY-MM" key by a number of months. */
export function addMonths(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthLabel(monthKey: string, lang: Lang): string {
  const [y, m] = monthKey.split("-").map(Number);
  if (lang === "zh") return `${y}年${m}月`;
  const names = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${names[m - 1]} ${y}`;
}

/** Short "M/D" label. */
export function formatDateShort(dateISO: string): string {
  const [, m, d] = dateISO.split("-").map(Number);
  return `${m}/${d}`;
}

export function weekdayLabel(dateISO: string, lang: Lang): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const wd = new Date(y, m - 1, d).getDay();
  const zh = ["日", "一", "二", "三", "四", "五", "六"];
  const en = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return lang === "zh" ? `週${zh[wd]}` : en[wd];
}

/** All "YYYY-MM-DD" dates in a month, ascending. */
export function daysInMonth(monthKey: string): string[] {
  const [y, m] = monthKey.split("-").map(Number);
  const count = new Date(y, m, 0).getDate();
  const out: string[] = [];
  for (let i = 1; i <= count; i++) {
    out.push(`${monthKey}-${String(i).padStart(2, "0")}`);
  }
  return out;
}
