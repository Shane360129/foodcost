import type { Unit } from "@/types";

const numberLocale = "en-US"; // stable grouping; symbol is prepended separately

/** Format a monetary amount with a currency symbol. */
export function formatCurrency(value: number, symbol = "NT$"): string {
  const n = Number.isFinite(value) ? value : 0;
  const body = n.toLocaleString(numberLocale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${symbol}${body}`;
}

/** Format a plain number with optional fixed decimals. */
export function formatNumber(value: number, digits = 0): string {
  const n = Number.isFinite(value) ? value : 0;
  return n.toLocaleString(numberLocale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** Format a 0..1 fraction as a percentage string. */
export function formatPercent(value: number, digits = 1): string {
  const n = Number.isFinite(value) ? value : 0;
  return `${(n * 100).toFixed(digits)}%`;
}

/** Short unit labels for display next to quantities. */
export const UNIT_LABELS: Record<Unit, { zh: string; en: string }> = {
  g: { zh: "公克", en: "g" },
  ml: { zh: "毫升", en: "ml" },
  piece: { zh: "個", en: "pc" },
  portion: { zh: "份", en: "portion" },
};

export function unitLabel(unit: Unit, lang: "zh" | "en"): string {
  return UNIT_LABELS[unit][lang];
}
