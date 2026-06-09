import { useMemo, useState } from "react";
import {
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { HealthBadge } from "@/components/common/HealthBadge";
import { MenuEditor } from "./MenuEditor";
import { useIngredientMap, useIngredients, useMenus } from "@/hooks/useData";
import { computeMenuCost, foodCostHealth } from "@/lib/calc";
import { deleteMenu } from "@/lib/db";
import { loadSeedData } from "@/lib/seed";
import { categoryLabel } from "@/lib/categories";
import { formatCurrency, formatPercent } from "@/lib/format";
import { useSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";
import type { MenuItem } from "@/types";

export function MenusPage() {
  const { t, lang, currency } = useSettings();
  const menus = useMenus();
  const ingredients = useIngredients();
  const ingredientMap = useIngredientMap(ingredients);

  const [query, setQuery] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [toDelete, setToDelete] = useState<MenuItem | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (menus ?? [])
      .filter((m) =>
        q
          ? m.name.toLowerCase().includes(q) ||
            (m.nameEn ?? "").toLowerCase().includes(q)
          : true,
      )
      .map((menu) => ({ menu, cost: computeMenuCost(menu, ingredientMap) }))
      .sort((a, b) =>
        a.menu.name.localeCompare(b.menu.name, lang === "zh" ? "zh-Hant" : "en"),
      );
  }, [menus, query, ingredientMap, lang]);

  const openAdd = () => {
    setEditing(null);
    setEditorOpen(true);
  };
  const openEdit = (menu: MenuItem) => {
    setEditing(menu);
    setEditorOpen(true);
  };

  const handleSeed = async () => {
    await loadSeedData("all");
    toast.success(t("toast.sampleLoaded"));
  };

  const confirmDelete = async () => {
    if (!toDelete?.id) return;
    await deleteMenu(toDelete.id);
    toast.success(t("toast.deleted"));
  };

  const isLoading = menus === undefined;
  const isEmpty = !isLoading && (menus?.length ?? 0) === 0;

  return (
    <div>
      <PageHeader
        title={t("menu.title")}
        subtitle={t("menu.subtitle")}
        actions={
          <>
            <Button variant="outline" onClick={handleSeed}>
              <Sparkles className="h-4 w-4" />
              {t("set.loadSample")}
            </Button>
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" />
              {t("menu.add")}
            </Button>
          </>
        }
      />

      {isEmpty ? (
        <EmptyState
          icon={UtensilsCrossed}
          title={t("menu.empty")}
          description={t("menu.emptyDesc")}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={handleSeed}>
                <Sparkles className="h-4 w-4" />
                {t("set.loadSample")}
              </Button>
              <Button variant="outline" onClick={openAdd}>
                <Plus className="h-4 w-4" />
                {t("menu.add")}
              </Button>
            </div>
          }
        />
      ) : (
        <>
          <div className="relative mb-4 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("menu.searchPlaceholder")}
              className="pl-9"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map(({ menu, cost }) => {
              const hasPrice = cost.price > 0;
              const health = foodCostHealth(cost.foodCostRatio, hasPrice);
              return (
                <Card
                  key={menu.id}
                  className="group flex cursor-pointer flex-col transition-colors hover:border-primary/40"
                  onClick={() => openEdit(menu)}
                >
                  <div className="flex items-start justify-between gap-2 p-4 pb-3">
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-foreground">
                        {menu.name}
                      </div>
                      {menu.nameEn && (
                        <div className="truncate text-xs text-muted-foreground">
                          {menu.nameEn}
                        </div>
                      )}
                    </div>
                    {menu.category && (
                      <Badge variant="secondary" className="shrink-0">
                        {categoryLabel(menu.category, t)}
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 px-4">
                    <div>
                      <div className="text-[11px] text-muted-foreground">
                        {t("common.price")}
                      </div>
                      <div className="tnum font-semibold">
                        {formatCurrency(cost.price, currency)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-muted-foreground">
                        {t("ov.colFoodCost")}
                      </div>
                      <div
                        className={cn(
                          "tnum font-semibold",
                          health === "good" && "text-success",
                          health === "warning" && "text-warning",
                          health === "bad" && "text-destructive",
                        )}
                      >
                        {hasPrice ? formatPercent(cost.foodCostRatio) : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-muted-foreground">
                        {t("metric.grossMargin")}
                      </div>
                      <div className="tnum font-semibold">
                        {hasPrice ? formatPercent(cost.grossMargin) : "—"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border px-4 py-2.5">
                    <span className="text-xs text-muted-foreground">
                      {menu.recipe.length} · {t("nav.ingredients")}
                    </span>
                    <div className="flex items-center gap-1">
                      <HealthBadge health={health} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(menu);
                        }}
                        aria-label={t("common.edit")}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setToDelete(menu);
                        }}
                        aria-label={t("common.delete")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {ingredients && (
        <MenuEditor
          open={editorOpen}
          onOpenChange={setEditorOpen}
          editing={editing}
          ingredients={ingredients}
          ingredientMap={ingredientMap}
        />
      )}

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={t("common.delete")}
        description={t("common.deleteConfirm", { name: toDelete?.name ?? "" })}
        confirmLabel={t("common.delete")}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
