import { AlertTriangle } from "lucide-react";
import { HealthBadge } from "@/components/common/HealthBadge";
import {
  FOOD_COST_TARGET,
  foodCostHealth,
  type CostHealth,
} from "@/lib/calc";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { useSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";
import type { MenuCost } from "@/types";

const RATIO_COLOR: Record<CostHealth, string> = {
  good: "text-success",
  warning: "text-warning",
  bad: "text-destructive",
  unknown: "text-muted-foreground",
};

function Stat({
  label,
  value,
  sub,
  valueClass,
}: {
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className={cn("tnum mt-1 text-xl font-bold tracking-tight", valueClass)}>
        {value}
      </div>
      {sub && <div className="tnum mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function CostMetrics({ cost }: { cost: MenuCost }) {
  const { t, currency } = useSettings();
  const hasPrice = cost.price > 0;
  const health = foodCostHealth(cost.foodCostRatio, hasPrice);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Stat
          label={t("metric.ingredientCost")}
          value={formatCurrency(cost.ingredientCost, currency)}
        />
        <Stat
          label={t("metric.foodCostRatio")}
          value={hasPrice ? formatPercent(cost.foodCostRatio) : "—"}
          valueClass={RATIO_COLOR[health]}
          sub={`${t("home.benchFoodCost")} ${Math.round(
            FOOD_COST_TARGET.min * 100,
          )}–${Math.round(FOOD_COST_TARGET.max * 100)}%`}
        />
        <Stat
          label={t("metric.grossProfit")}
          value={hasPrice ? formatCurrency(cost.grossProfit, currency) : "—"}
          valueClass={cost.grossProfit < 0 ? "text-destructive" : undefined}
        />
        <Stat
          label={t("metric.grossMargin")}
          value={hasPrice ? formatPercent(cost.grossMargin) : "—"}
          valueClass={cost.grossMargin < 0 ? "text-destructive" : undefined}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background/40 px-3 py-2.5">
        <div className="text-xs font-medium text-muted-foreground">
          {t("metric.breakEven")}
        </div>
        <div className="tnum text-sm font-semibold">
          {cost.breakEvenUnits != null ? (
            <>
              {formatNumber(cost.breakEvenUnits)}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                {t("metric.breakEvenUnit")}
              </span>
            </>
          ) : (
            <span className="text-xs font-normal text-muted-foreground">
              {t("metric.breakEvenNA")}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <HealthBadge health={health} />
        {cost.hasMissingIngredient && (
          <span className="inline-flex items-center gap-1 text-xs text-warning">
            <AlertTriangle className="h-3.5 w-3.5" />
            {t("menu.ingredientMissing")}
          </span>
        )}
      </div>
    </div>
  );
}
