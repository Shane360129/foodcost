import { useMemo, useState } from "react";
import { Carrot, Pencil, Plus, Search, Sprout, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { IngredientForm } from "./IngredientForm";
import { useIngredients, useIngredientUsage, useMenus } from "@/hooks/useData";
import { deleteIngredient } from "@/lib/db";
import { loadSeedData } from "@/lib/seed";
import { categoryLabel } from "@/lib/categories";
import { formatCurrency } from "@/lib/format";
import { useSettings } from "@/lib/settings";
import type { Ingredient } from "@/types";

const ALL = "__all__";

export function IngredientsPage() {
  const { t, lang, currency } = useSettings();
  const ingredients = useIngredients();
  const menus = useMenus();
  const usage = useIngredientUsage(menus);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>(ALL);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [toDelete, setToDelete] = useState<Ingredient | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const ing of ingredients ?? []) if (ing.category) set.add(ing.category);
    return [...set];
  }, [ingredients]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (ingredients ?? [])
      .filter((i) => (category === ALL ? true : i.category === category))
      .filter((i) =>
        q
          ? i.name.toLowerCase().includes(q) ||
            (i.nameEn ?? "").toLowerCase().includes(q)
          : true,
      )
      .sort((a, b) => a.name.localeCompare(b.name, lang === "zh" ? "zh-Hant" : "en"));
  }, [ingredients, query, category, lang]);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (ing: Ingredient) => {
    setEditing(ing);
    setFormOpen(true);
  };

  const handleSeed = async () => {
    const res = await loadSeedData("ingredients");
    toast.success(
      res.ingredientsAdded > 0
        ? t("ing.seedLoaded", { n: res.ingredientsAdded })
        : t("ing.seedNone"),
    );
  };

  const confirmDelete = async () => {
    if (!toDelete?.id) return;
    await deleteIngredient(toDelete.id);
    toast.success(t("toast.deleted"));
  };

  const isLoading = ingredients === undefined;
  const isEmpty = !isLoading && (ingredients?.length ?? 0) === 0;

  return (
    <div>
      <PageHeader
        title={t("ing.title")}
        subtitle={t("ing.subtitle")}
        actions={
          <>
            <Button variant="outline" onClick={handleSeed}>
              <Sprout className="h-4 w-4" />
              {t("ing.loadSeed")}
            </Button>
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" />
              {t("ing.add")}
            </Button>
          </>
        }
      />

      {isEmpty ? (
        <EmptyState
          icon={Carrot}
          title={t("ing.empty")}
          description={t("ing.emptyDesc")}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={handleSeed}>
                <Sprout className="h-4 w-4" />
                {t("ing.loadSeed")}
              </Button>
              <Button variant="outline" onClick={openAdd}>
                <Plus className="h-4 w-4" />
                {t("ing.add")}
              </Button>
            </div>
          }
        />
      ) : (
        <Card>
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("ing.searchPlaceholder")}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-3">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t("common.all")}</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {categoryLabel(c, t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="hidden whitespace-nowrap text-sm text-muted-foreground sm:inline">
                {t("ing.count", { n: filtered.length })}
              </span>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.name")}</TableHead>
                <TableHead>{t("common.category")}</TableHead>
                <TableHead>{t("common.unit")}</TableHead>
                <TableHead className="text-right">{t("common.unitCost")}</TableHead>
                <TableHead>{t("common.supplier")}</TableHead>
                <TableHead className="w-[88px] text-right">
                  {t("common.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((ing) => {
                const used = usage.get(ing.id!) ?? 0;
                return (
                  <TableRow key={ing.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{ing.name}</div>
                      {ing.nameEn && (
                        <div className="text-xs text-muted-foreground">
                          {ing.nameEn}
                        </div>
                      )}
                      {used > 0 && (
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          {t("ing.usedBy", { n: used })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {ing.category ? (
                        <Badge variant="secondary">
                          {categoryLabel(ing.category, t)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {t(`unit.${ing.unit}`)}
                    </TableCell>
                    <TableCell className="tnum text-right font-medium">
                      {formatCurrency(ing.unitCost, currency)}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate text-sm text-muted-foreground">
                      {ing.supplier || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(ing)}
                          aria-label={t("common.edit")}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setToDelete(ing)}
                          aria-label={t("common.delete")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <IngredientForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
      />

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={t("common.delete")}
        description={`${t("common.deleteConfirm", { name: toDelete?.name ?? "" })} ${
          (usage.get(toDelete?.id ?? -1) ?? 0) > 0 ? t("ing.deleteWarn") : ""
        }`}
        confirmLabel={t("common.delete")}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
