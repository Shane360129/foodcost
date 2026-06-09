import { Fragment, useMemo, useState } from "react";
import {
  Banknote,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Coins,
  Pencil,
  Percent,
  Plus,
  Receipt,
  Sparkles,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PurchaseForm } from "./PurchaseForm";
import { RevenueForm } from "./RevenueForm";
import {
  useIngredientMap,
  useIngredients,
  usePurchases,
  useRevenues,
  useSupplierMap,
  useSuppliers,
} from "@/hooks/useData";
import { deletePurchase } from "@/lib/db";
import { loadSeedData } from "@/lib/seed";
import {
  buildDailyRows,
  filterByMonth,
  purchasesBySupplier,
  summarize,
} from "@/lib/operations";
import {
  addMonths,
  currentMonthKey,
  daysInMonth,
  formatDateShort,
  formatMonthLabel,
  weekdayLabel,
} from "@/lib/dates";
import { formatCurrency, formatPercent } from "@/lib/format";
import { useSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";
import type { DailyRevenue, Purchase } from "@/types";

const ratioColor = (r: number | null) =>
  r == null
    ? "text-muted-foreground"
    : r <= 0.35
      ? "text-success"
      : r <= 0.45
        ? "text-warning"
        : "text-destructive";

function SummaryCard({
  icon: Icon,
  label,
  value,
  hint,
  valueClass,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  hint?: string;
  valueClass?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Icon className="h-4 w-4" />
          {label}
        </div>
        <div className={cn("tnum mt-1 text-2xl font-bold tracking-tight", valueClass)}>
          {value}
        </div>
        {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}

export function OperationsPage() {
  const { t, lang, currency } = useSettings();
  const purchases = usePurchases();
  const revenues = useRevenues();
  const suppliers = useSuppliers();
  const ingredients = useIngredients();
  const supplierMap = useSupplierMap(suppliers);
  const ingredientMap = useIngredientMap(ingredients);

  const [month, setMonth] = useState(currentMonthKey());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [purchaseDate, setPurchaseDate] = useState<string | undefined>();
  const [revenueOpen, setRevenueOpen] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState<DailyRevenue | null>(null);
  const [revenueDate, setRevenueDate] = useState<string | undefined>();
  const [toDeletePurchase, setToDeletePurchase] = useState<Purchase | null>(null);

  const monthPurchases = useMemo(
    () => filterByMonth(purchases ?? [], month),
    [purchases, month],
  );
  const monthRevenues = useMemo(
    () => filterByMonth(revenues ?? [], month),
    [revenues, month],
  );
  const rows = useMemo(
    () => buildDailyRows(monthPurchases, monthRevenues),
    [monthPurchases, monthRevenues],
  );
  const summary = useMemo(() => summarize(rows), [rows]);
  const bySupplier = useMemo(
    () => purchasesBySupplier(monthPurchases),
    [monthPurchases],
  );

  const rowByDate = useMemo(
    () => new Map(rows.map((r) => [r.date, r] as const)),
    [rows],
  );
  const existingDates = useMemo(
    () => new Set((revenues ?? []).map((r) => r.date)),
    [revenues],
  );
  const revenueByDate = useMemo(
    () => new Map((revenues ?? []).map((r) => [r.date, r] as const)),
    [revenues],
  );

  const scaleMax = Math.max(
    1,
    ...rows.map((r) => Math.max(r.revenue, r.purchase)),
  );
  const monthDays = daysInMonth(month);

  const openAddPurchase = (date?: string) => {
    setEditingPurchase(null);
    setPurchaseDate(date);
    setPurchaseOpen(true);
  };
  const openEditPurchase = (p: Purchase) => {
    setEditingPurchase(p);
    setPurchaseDate(undefined);
    setPurchaseOpen(true);
  };
  const openRevenue = (date?: string) => {
    const existing = date ? (revenueByDate.get(date) ?? null) : null;
    setEditingRevenue(existing);
    setRevenueDate(date);
    setRevenueOpen(true);
  };

  const handleSeed = async () => {
    await loadSeedData("all");
    toast.success(t("toast.sampleLoaded"));
  };

  const confirmDeletePurchase = async () => {
    if (!toDeletePurchase?.id) return;
    await deletePurchase(toDeletePurchase.id);
    toast.success(t("toast.deleted"));
  };

  const isLoading =
    purchases === undefined || revenues === undefined || suppliers === undefined;
  const isEmpty =
    !isLoading &&
    (purchases?.length ?? 0) === 0 &&
    (revenues?.length ?? 0) === 0;

  return (
    <div>
      <PageHeader
        title={t("op.title")}
        subtitle={t("op.subtitle")}
        actions={
          <>
            <Button variant="outline" onClick={() => openRevenue()}>
              <Banknote className="h-4 w-4" />
              {t("op.addRevenue")}
            </Button>
            <Button onClick={() => openAddPurchase()}>
              <Plus className="h-4 w-4" />
              {t("op.addPurchase")}
            </Button>
          </>
        }
      />

      {isEmpty ? (
        <EmptyState
          icon={Receipt}
          title={t("op.empty")}
          description={t("op.emptyDesc")}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={handleSeed}>
                <Sparkles className="h-4 w-4" />
                {t("set.loadSample")}
              </Button>
              <Button variant="outline" onClick={() => openAddPurchase()}>
                <Plus className="h-4 w-4" />
                {t("op.addPurchase")}
              </Button>
            </div>
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Month switcher */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setMonth((m) => addMonths(m, -1))}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-[7rem] text-center text-sm font-semibold">
                {formatMonthLabel(month, lang)}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setMonth((m) => addMonths(m, 1))}
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              {month !== currentMonthKey() && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMonth(currentMonthKey())}
                >
                  {t("common.today")}
                </Button>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <SummaryCard
              icon={Coins}
              label={t("op.monthPurchase")}
              value={formatCurrency(summary.purchaseTotal, currency)}
            />
            <SummaryCard
              icon={Wallet}
              label={t("op.monthRevenue")}
              value={formatCurrency(summary.revenueTotal, currency)}
            />
            <SummaryCard
              icon={Percent}
              label={t("op.monthCostRatio")}
              value={
                summary.costRatio != null
                  ? formatPercent(summary.costRatio)
                  : "—"
              }
              hint={t("op.costRatioHint")}
              valueClass={ratioColor(summary.costRatio)}
            />
            <SummaryCard
              icon={TrendingUp}
              label={t("op.monthProfit")}
              value={formatCurrency(summary.grossProfit, currency)}
              valueClass={
                summary.grossProfit < 0 ? "text-destructive" : "text-success"
              }
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Trend */}
            <Card className="lg:col-span-2">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    {t("op.trend")}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded-sm bg-primary/25" />
                      {t("op.colRevenue")}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
                      {t("op.colPurchase")}
                    </span>
                  </div>
                </div>
                <div className="flex h-32 items-end gap-[3px]">
                  {monthDays.map((date) => {
                    const row = rowByDate.get(date);
                    const rev = row?.revenue ?? 0;
                    const pur = row?.purchase ?? 0;
                    const hOuter = (rev / scaleMax) * 100;
                    const hInner = rev > 0 ? Math.min(100, (pur / rev) * 100) : 0;
                    const purOnly = rev === 0 && pur > 0;
                    return (
                      <div
                        key={date}
                        className="flex h-full flex-1 flex-col justify-end"
                        title={`${formatDateShort(date)} · ${t("op.colRevenue")} ${formatCurrency(rev, currency)} · ${t("op.colPurchase")} ${formatCurrency(pur, currency)}`}
                      >
                        {purOnly ? (
                          <div
                            className="w-full rounded-t bg-destructive/60"
                            style={{ height: `${(pur / scaleMax) * 100}%` }}
                          />
                        ) : (
                          <div
                            className="relative w-full rounded-t bg-primary/20"
                            style={{ height: `${hOuter}%` }}
                          >
                            <div
                              className="absolute inset-x-0 bottom-0 rounded-t bg-primary"
                              style={{ height: `${hInner}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* By supplier */}
            <Card>
              <CardContent className="p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Receipt className="h-4 w-4 text-primary" />
                  {t("op.bySupplier")}
                </div>
                {bySupplier.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("op.noData")}</p>
                ) : (
                  <div className="space-y-2.5">
                    {bySupplier.map((s) => {
                      const pct =
                        summary.purchaseTotal > 0
                          ? s.amount / summary.purchaseTotal
                          : 0;
                      const name =
                        s.supplierId != null
                          ? (supplierMap.get(s.supplierId)?.name ??
                            t("ing.noSupplier"))
                          : t("ing.noSupplier");
                      return (
                        <div key={s.supplierId ?? "none"}>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="truncate text-foreground">{name}</span>
                            <span className="tnum shrink-0 text-muted-foreground">
                              {formatCurrency(s.amount, currency)} ·{" "}
                              {formatPercent(pct, 0)}
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${pct * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Daily ledger */}
          <Card>
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="text-sm font-semibold">{t("op.ledger")}</div>
              <div className="hidden text-xs text-muted-foreground sm:block">
                {t("op.expandHint")}
              </div>
            </div>
            {rows.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                {t("op.noData")}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>{t("op.colDate")}</TableHead>
                    <TableHead className="text-right">{t("op.colPurchase")}</TableHead>
                    <TableHead className="text-right">{t("op.colRevenue")}</TableHead>
                    <TableHead className="text-right">{t("op.colRatio")}</TableHead>
                    <TableHead className="w-[120px] text-right">
                      {t("common.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const open = expanded === row.date;
                    const dayPurchases = monthPurchases.filter(
                      (p) => p.date === row.date,
                    );
                    return (
                      <Fragment key={row.date}>
                        <TableRow
                          className="cursor-pointer"
                          onClick={() => setExpanded(open ? null : row.date)}
                        >
                          <TableCell>
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 text-muted-foreground transition-transform",
                                !open && "-rotate-90",
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-foreground">
                              {formatDateShort(row.date)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {weekdayLabel(row.date, lang)} ·{" "}
                              {t("op.purchaseRecords", { n: row.purchaseCount })}
                            </div>
                          </TableCell>
                          <TableCell className="tnum text-right">
                            {formatCurrency(row.purchase, currency)}
                          </TableCell>
                          <TableCell className="tnum text-right">
                            {row.hasRevenue ? (
                              formatCurrency(row.revenue, currency)
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {t("op.noRevenue")}
                              </span>
                            )}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "tnum text-right font-semibold",
                              ratioColor(row.costRatio),
                            )}
                          >
                            {row.costRatio != null
                              ? formatPercent(row.costRatio)
                              : "—"}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8"
                                onClick={() => openRevenue(row.date)}
                              >
                                <Banknote className="h-3.5 w-3.5" />
                                {t("op.colRevenue")}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openAddPurchase(row.date)}
                                aria-label={t("op.addPurchase")}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>

                        {open && (
                          <TableRow className="bg-muted/20 hover:bg-muted/20">
                            <TableCell />
                            <TableCell colSpan={5} className="py-3">
                              {dayPurchases.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                  {t("op.noData")}
                                </p>
                              ) : (
                                <div className="space-y-1.5">
                                  {dayPurchases.map((p) => {
                                    const sup =
                                      p.supplierId != null
                                        ? supplierMap.get(p.supplierId)
                                        : undefined;
                                    const ing =
                                      p.ingredientId != null
                                        ? ingredientMap.get(p.ingredientId)
                                        : undefined;
                                    return (
                                      <div
                                        key={p.id}
                                        className="flex items-center gap-2 rounded-md border border-border bg-background/60 px-3 py-2 text-sm"
                                      >
                                        <Badge variant="secondary" className="shrink-0">
                                          {sup?.name ?? t("ing.noSupplier")}
                                        </Badge>
                                        <span className="min-w-0 flex-1 truncate text-muted-foreground">
                                          {ing?.name ?? t("op.itemNone")}
                                          {p.note ? ` · ${p.note}` : ""}
                                        </span>
                                        <span className="tnum shrink-0 font-medium">
                                          {formatCurrency(p.amount, currency)}
                                        </span>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 shrink-0"
                                          onClick={() => openEditPurchase(p)}
                                          aria-label={t("common.edit")}
                                        >
                                          <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                                          onClick={() => setToDeletePurchase(p)}
                                          aria-label={t("common.delete")}
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      )}

      {suppliers && ingredients && (
        <PurchaseForm
          open={purchaseOpen}
          onOpenChange={setPurchaseOpen}
          editing={editingPurchase}
          defaultDate={purchaseDate}
          suppliers={suppliers}
          ingredients={ingredients}
          ingredientMap={ingredientMap}
        />
      )}

      <RevenueForm
        open={revenueOpen}
        onOpenChange={setRevenueOpen}
        editing={editingRevenue}
        defaultDate={revenueDate}
        existingDates={existingDates}
      />

      <ConfirmDialog
        open={toDeletePurchase !== null}
        onOpenChange={(o) => !o && setToDeletePurchase(null)}
        title={t("common.delete")}
        description={t("op.deletePurchaseConfirm")}
        confirmLabel={t("common.delete")}
        onConfirm={confirmDeletePurchase}
      />
    </div>
  );
}
