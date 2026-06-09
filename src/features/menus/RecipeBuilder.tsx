import { useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { lineCost } from "@/lib/calc";
import { categoryLabel } from "@/lib/categories";
import { formatCurrency, unitLabel } from "@/lib/format";
import { useSettings } from "@/lib/settings";
import type { Ingredient, RecipeLine } from "@/types";

export function RecipeBuilder({
  value,
  onChange,
  ingredients,
  ingredientMap,
}: {
  value: RecipeLine[];
  onChange: (lines: RecipeLine[]) => void;
  ingredients: Ingredient[];
  ingredientMap: Map<number, Ingredient>;
}) {
  const { t, lang, currency } = useSettings();

  const grouped = useMemo(() => {
    const map = new Map<string, Ingredient[]>();
    for (const ing of ingredients) {
      const key = ing.category ?? "other";
      const arr = map.get(key) ?? [];
      arr.push(ing);
      map.set(key, arr);
    }
    return [...map.entries()];
  }, [ingredients]);

  const update = (index: number, patch: Partial<RecipeLine>) => {
    onChange(value.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };
  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };
  const add = () => {
    onChange([...value, { ingredientId: 0, quantity: 0 }]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">
          {t("menu.recipe")}
        </span>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="h-4 w-4" />
          {t("menu.addLine")}
        </Button>
      </div>

      {value.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
          {t("menu.noLines")}
        </p>
      ) : (
        <div className="space-y-2">
          {value.map((line, index) => {
            const ing = ingredientMap.get(line.ingredientId);
            const sub = lineCost(line, ing);
            return (
              <div
                key={index}
                className="flex items-center gap-2 rounded-lg border border-border bg-background/40 p-2"
              >
                <div className="min-w-0 flex-1">
                  <Select
                    value={line.ingredientId ? String(line.ingredientId) : ""}
                    onValueChange={(v) =>
                      update(index, { ingredientId: Number(v) })
                    }
                  >
                    <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0">
                      <SelectValue placeholder={t("menu.pickIngredient")} />
                    </SelectTrigger>
                    <SelectContent>
                      {grouped.map(([cat, items]) => (
                        <SelectGroup key={cat}>
                          <SelectLabel>{categoryLabel(cat, t)}</SelectLabel>
                          {items.map((i) => (
                            <SelectItem key={i.id} value={String(i.id)}>
                              {i.name}
                              {lang === "en" && i.nameEn ? ` · ${i.nameEn}` : ""}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={line.quantity || ""}
                  onChange={(e) =>
                    update(index, { quantity: Number(e.target.value) || 0 })
                  }
                  className="tnum w-20 text-right"
                  placeholder="0"
                />

                <span className="w-12 shrink-0 text-xs text-muted-foreground">
                  {ing ? unitLabel(ing.unit, lang) : ""}
                </span>

                <span className="tnum w-20 shrink-0 text-right text-sm font-medium">
                  {formatCurrency(sub, currency)}
                </span>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => remove(index)}
                  aria-label={t("common.delete")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
