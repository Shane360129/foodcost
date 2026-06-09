import type { DailyRevenue, Purchase } from "@/types";
import { monthKeyOf } from "@/lib/dates";

/** One day's rolled-up purchasing vs takings. */
export interface DailyRow {
  date: string;
  /** Sum of purchase amounts on this day. */
  purchase: number;
  /** Revenue recorded for this day (0 when none). */
  revenue: number;
  hasRevenue: boolean;
  /** purchase / revenue, or null when no revenue. */
  costRatio: number | null;
  note?: string;
  purchaseCount: number;
}

export function filterByMonth<T extends { date: string }>(
  rows: T[],
  monthKey: string,
): T[] {
  return rows.filter((r) => monthKeyOf(r.date) === monthKey);
}

/** Merge purchases + revenues into one descending-by-date daily ledger. */
export function buildDailyRows(
  purchases: Purchase[],
  revenues: DailyRevenue[],
): DailyRow[] {
  const map = new Map<string, DailyRow>();
  const get = (date: string): DailyRow => {
    let row = map.get(date);
    if (!row) {
      row = {
        date,
        purchase: 0,
        revenue: 0,
        hasRevenue: false,
        costRatio: null,
        purchaseCount: 0,
      };
      map.set(date, row);
    }
    return row;
  };

  for (const p of purchases) {
    const row = get(p.date);
    row.purchase += p.amount || 0;
    row.purchaseCount += 1;
  }
  for (const rev of revenues) {
    const row = get(rev.date);
    row.revenue = rev.revenue || 0;
    row.hasRevenue = true;
    row.note = rev.note;
  }
  for (const row of map.values()) {
    row.costRatio = row.revenue > 0 ? row.purchase / row.revenue : null;
  }

  return [...map.values()].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export interface OpsSummary {
  purchaseTotal: number;
  revenueTotal: number;
  /** purchaseTotal / revenueTotal, or null. */
  costRatio: number | null;
  grossProfit: number;
  days: number;
}

export function summarize(rows: DailyRow[]): OpsSummary {
  let purchaseTotal = 0;
  let revenueTotal = 0;
  for (const r of rows) {
    purchaseTotal += r.purchase;
    revenueTotal += r.revenue;
  }
  return {
    purchaseTotal,
    revenueTotal,
    costRatio: revenueTotal > 0 ? purchaseTotal / revenueTotal : null,
    grossProfit: revenueTotal - purchaseTotal,
    days: rows.length,
  };
}

export interface SupplierTotal {
  supplierId: number | undefined;
  amount: number;
  count: number;
}

/** Total purchase amount grouped by supplier, descending by amount. */
export function purchasesBySupplier(purchases: Purchase[]): SupplierTotal[] {
  const map = new Map<number | undefined, SupplierTotal>();
  for (const p of purchases) {
    const key = p.supplierId;
    const row = map.get(key) ?? { supplierId: key, amount: 0, count: 0 };
    row.amount += p.amount || 0;
    row.count += 1;
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount);
}
