import { useState } from "react";
import { Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  roundPriceUp,
  suggestPriceFromFoodCostRatio,
} from "@/lib/calc";
import { formatCurrency } from "@/lib/format";
import { useSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

const PRESETS = [28, 30, 33, 35];

export function PricingAssistant({
  ingredientCost,
  onApply,
}: {
  ingredientCost: number;
  onApply: (price: number) => void;
}) {
  const { t, currency } = useSettings();
  const [ratio, setRatio] = useState(30);

  const hasCost = ingredientCost > 0;
  const raw = hasCost
    ? suggestPriceFromFoodCostRatio(ingredientCost, ratio / 100)
    : 0;
  const rounded = roundPriceUp(raw, 5);

  return (
    <div className="space-y-3 rounded-xl border border-primary/25 bg-primary/[0.06] p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          {t("price.title")}
        </h3>
      </div>
      <p className="text-xs text-muted-foreground">{t("price.desc")}</p>

      <div className="space-y-1.5">
        <Label htmlFor="target-ratio">{t("price.targetRatio")}</Label>
        <div className="flex items-center gap-2">
          <div className="relative w-24">
            <Input
              id="target-ratio"
              type="number"
              min="1"
              max="100"
              step="1"
              value={ratio}
              onChange={(e) =>
                setRatio(Math.min(100, Math.max(1, Number(e.target.value) || 0)))
              }
              className="tnum pr-7"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              %
            </span>
          </div>
          <div className="flex gap-1">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setRatio(p)}
                className={cn(
                  "rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                  ratio === p
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {p}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {hasCost ? (
        <div className="flex items-end justify-between gap-3 pt-1">
          <div>
            <div className="text-xs text-muted-foreground">
              {t("price.suggested")}
            </div>
            <div className="tnum text-2xl font-bold text-foreground">
              {formatCurrency(rounded, currency)}
            </div>
            <div className="tnum text-xs text-muted-foreground">
              ≈ {formatCurrency(raw, currency)}
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => onApply(rounded)}
            className="shrink-0"
          >
            <Wand2 className="h-4 w-4" />
            {t("price.apply")}
          </Button>
        </div>
      ) : (
        <p className="pt-1 text-xs text-muted-foreground">{t("price.needCost")}</p>
      )}
    </div>
  );
}
