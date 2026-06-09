import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ClipboardList,
  Download,
  Loader2,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { useIngredientMap, useIngredients, useMenus } from "@/hooks/useData";
import { computeMenuCost, foodCostHealth } from "@/lib/calc";
import { categoryLabel } from "@/lib/categories";
import { formatCurrency, formatPercent } from "@/lib/format";
import { exportReportPdf, type ReportRow } from "@/lib/pdf";
import { useSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";
import type { MenuCost, MenuItem } from "@/types";

type SortKey = "name" | "price" | "cost" | "foodCostRatio" | "grossMargin" | "grossProfit";

interface Row {
  menu: MenuItem;
  cost: MenuCost;
}

export function OverviewPage() {
  const { t, lang, currency } = useSettings();
  const menus = useMenus();
  const ingredients = useIngredients();
  const ingredientMap = useIngredientMap(ingredients);

  const [threshold, setThreshold] = useState(55);
  const [sortKey, setSortKey] = useState<SortKey>("grossMargin");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [exporting, setExporting] = useState(false);

  const rows: Row[] = useMemo(
    () =>
      (menus ?? []).map((menu) => ({
        menu,
        cost: computeMenuCost(menu, ingredientMap),
      })),
    [menus, ingredientMap],
  );

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    const valueOf = (r: Row): number => {
      switch (sortKey) {
        case "price":
          return r.cost.price;
        case "cost":
          return r.cost.ingredientCost;
        case "foodCostRatio":
          return r.cost.foodCostRatio;
        case "grossMargin":
          return r.cost.grossMargin;
        case "grossProfit":
          return r.cost.grossProfit;
        default:
          return 0;
      }
    };
    return [...rows].sort((a, b) => {
      if (sortKey === "name") {
        return (
          a.menu.name.localeCompare(
            b.menu.name,
            lang === "zh" ? "zh-Hant" : "en",
          ) * dir
        );
      }
      return (valueOf(a) - valueOf(b)) * dir;
    });
  }, [rows, sortKey, sortDir, lang]);

  const priced = rows.filter((r) => r.cost.price > 0);
  const summary = useMemo(() => {
    const n = priced.length;
    const avgFoodCost =
      n > 0 ? priced.reduce((s, r) => s + r.cost.foodCostRatio, 0) / n : 0;
    const avgMargin =
      n > 0 ? priced.reduce((s, r) => s + r.cost.grossMargin, 0) / n : 0;
    return { dishes: rows.length, avgFoodCost, avgMargin };
  }, [rows.length, priced]);

  const isFlagged = (r: Row) =>
    r.cost.price > 0 && r.cost.grossMargin < threshold / 100;
  const flaggedCount = sorted.filter(isFlagged).length;

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "asc");
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const reportRows: ReportRow[] = sorted.map((r) => ({
        name: r.menu.name,
        nameEn: r.menu.nameEn,
        category: r.menu.category,
        price: r.cost.price,
        cost: r.cost.ingredientCost,
        foodCostRatio: r.cost.foodCostRatio,
        grossProfit: r.cost.grossProfit,
        grossMargin: r.cost.grossMargin,
        flagged: isFlagged(r),
      }));
      await exportReportPdf({
        currency,
        rows: reportRows,
        summary,
        labels: {
          title: t("pdf.title"),
          generatedAt: t("pdf.generatedAt"),
          logoHint: t("pdf.logoHint"),
          footer: t("pdf.footer"),
          summary: t("pdf.summary"),
          colIndex: "#",
          colName: t("ov.colName"),
          colPrice: t("ov.colPrice"),
          colCost: t("ov.colCost"),
          colFoodCost: t("ov.colFoodCost"),
          colProfit: t("ov.colProfit"),
          colMargin: t("ov.colMargin"),
          summaryDishes: t("ov.summaryDishes"),
          summaryAvgFoodCost: t("ov.summaryAvgFoodCost"),
          summaryAvgMargin: t("ov.summaryAvgMargin"),
        },
      });
    } catch (err) {
      console.error(err);
      toast.error(t("toast.pdfFailed"));
    } finally {
      setExporting(false);
    }
  };

  const isLoading = menus === undefined;
  const isEmpty = !isLoading && rows.length === 0;

  const SortHead = ({
    label,
    sk,
    align = "left",
  }: {
    label: string;
    sk: SortKey;
    align?: "left" | "right";
  }) => {
    const active = sortKey === sk;
    const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
    return (
      <TableHead className={cn(align === "right" && "text-right")}>
        <button
          onClick={() => toggleSort(sk)}
          className={cn(
            "inline-flex items-center gap-1 hover:text-foreground",
            align === "right" && "flex-row-reverse",
            active && "text-foreground",
          )}
        >
          {label}
          <Icon className="h-3 w-3" />
        </button>
      </TableHead>
    );
  };

  return (
    <div>
      <PageHeader
        title={t("ov.title")}
        subtitle={t("ov.subtitle")}
        actions={
          <Button onClick={handleExport} disabled={exporting || isEmpty}>
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {exporting ? t("ov.exporting") : t("ov.exportPdf")}
          </Button>
        }
      />

      {isEmpty ? (
        <EmptyState icon={ClipboardList} title={t("ov.empty")} />
      ) : (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs font-medium text-muted-foreground">
                  {t("ov.summaryDishes")}
                </div>
                <div className="tnum mt-1 text-2xl font-bold">
                  {summary.dishes}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs font-medium text-muted-foreground">
                  {t("ov.summaryAvgFoodCost")}
                </div>
                <div className="tnum mt-1 text-2xl font-bold">
                  {formatPercent(summary.avgFoodCost)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs font-medium text-muted-foreground">
                  {t("ov.summaryAvgMargin")}
                </div>
                <div className="tnum mt-1 text-2xl font-bold">
                  {formatPercent(summary.avgMargin)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls + flag status */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                flaggedCount > 0
                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                  : "border-success/30 bg-success/10 text-success",
              )}
            >
              {flaggedCount > 0 ? (
                <>
                  <TriangleAlert className="h-4 w-4" />
                  {t("ov.flaggedCount", { n: flaggedCount })}
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  {t("ov.allHealthy")}
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">
                {t("ov.flagThreshold")}
              </label>
              <div className="relative w-20">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={threshold}
                  onChange={(e) =>
                    setThreshold(
                      Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                    )
                  }
                  className="tnum pr-7"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortHead label={t("ov.colName")} sk="name" />
                  <TableHead>{t("ov.colCategory")}</TableHead>
                  <SortHead label={t("ov.colCost")} sk="cost" align="right" />
                  <SortHead label={t("ov.colPrice")} sk="price" align="right" />
                  <SortHead
                    label={t("ov.colFoodCost")}
                    sk="foodCostRatio"
                    align="right"
                  />
                  <SortHead
                    label={t("ov.colProfit")}
                    sk="grossProfit"
                    align="right"
                  />
                  <SortHead
                    label={t("ov.colMargin")}
                    sk="grossMargin"
                    align="right"
                  />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((r) => {
                  const flagged = isFlagged(r);
                  const hasPrice = r.cost.price > 0;
                  const health = foodCostHealth(r.cost.foodCostRatio, hasPrice);
                  return (
                    <TableRow
                      key={r.menu.id}
                      className={cn(flagged && "bg-destructive/[0.06]")}
                    >
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {r.menu.name}
                        </div>
                        {r.menu.nameEn && (
                          <div className="text-xs text-muted-foreground">
                            {r.menu.nameEn}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {r.menu.category ? (
                          <Badge variant="secondary">
                            {categoryLabel(r.menu.category, t)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="tnum text-right">
                        {formatCurrency(r.cost.ingredientCost, currency)}
                      </TableCell>
                      <TableCell className="tnum text-right">
                        {hasPrice
                          ? formatCurrency(r.cost.price, currency)
                          : "—"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "tnum text-right font-medium",
                          health === "good" && "text-success",
                          health === "warning" && "text-warning",
                          health === "bad" && "text-destructive",
                        )}
                      >
                        {hasPrice ? formatPercent(r.cost.foodCostRatio) : "—"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "tnum text-right",
                          r.cost.grossProfit < 0 && "text-destructive",
                        )}
                      >
                        {hasPrice
                          ? formatCurrency(r.cost.grossProfit, currency)
                          : "—"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "tnum text-right font-semibold",
                          flagged ? "text-destructive" : "text-foreground",
                        )}
                      >
                        {hasPrice ? formatPercent(r.cost.grossMargin) : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
}
