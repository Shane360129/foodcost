import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "@/components/common/Field";
import { CostMetrics } from "./CostMetrics";
import { PricingAssistant } from "./PricingAssistant";
import { RecipeBuilder } from "./RecipeBuilder";
import { computeMenuCost } from "@/lib/calc";
import { createMenu, updateMenu } from "@/lib/db";
import { MENU_CATEGORIES, categoryLabel } from "@/lib/categories";
import { useSettings } from "@/lib/settings";
import type { Ingredient, MenuItem, RecipeLine } from "@/types";

const NONE = "__none__";

interface EditorState {
  name: string;
  nameEn: string;
  category: string;
  price: string;
  fixedCost: string;
  note: string;
  recipe: RecipeLine[];
}

const empty: EditorState = {
  name: "",
  nameEn: "",
  category: NONE,
  price: "",
  fixedCost: "",
  note: "",
  recipe: [],
};

export function MenuEditor({
  open,
  onOpenChange,
  editing,
  ingredients,
  ingredientMap,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: MenuItem | null;
  ingredients: Ingredient[];
  ingredientMap: Map<number, Ingredient>;
}) {
  const { t } = useSettings();
  const [state, setState] = useState<EditorState>(empty);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (!open) return;
    setShowErrors(false);
    setState(
      editing
        ? {
            name: editing.name,
            nameEn: editing.nameEn ?? "",
            category: editing.category ?? NONE,
            price: editing.price ? String(editing.price) : "",
            fixedCost: editing.fixedCost ? String(editing.fixedCost) : "",
            note: editing.note ?? "",
            recipe: editing.recipe.map((l) => ({ ...l })),
          }
        : empty,
    );
  }, [open, editing]);

  const set = <K extends keyof EditorState>(key: K, val: EditorState[K]) =>
    setState((s) => ({ ...s, [key]: val }));

  const cost = useMemo(
    () =>
      computeMenuCost(
        {
          price: Number(state.price) || 0,
          fixedCost: state.fixedCost ? Number(state.fixedCost) : undefined,
          recipe: state.recipe,
        },
        ingredientMap,
      ),
    [state.price, state.fixedCost, state.recipe, ingredientMap],
  );

  const nameError = showErrors && !state.name.trim();

  const handleSave = async () => {
    if (!state.name.trim()) {
      setShowErrors(true);
      toast.error(t("menu.saveFirst"));
      return;
    }
    const data = {
      name: state.name.trim(),
      nameEn: state.nameEn.trim() || undefined,
      category: state.category === NONE ? undefined : state.category,
      price: Number(state.price) || 0,
      fixedCost: state.fixedCost ? Number(state.fixedCost) : undefined,
      note: state.note.trim() || undefined,
      recipe: state.recipe.filter((l) => l.ingredientId > 0),
    };
    if (editing?.id != null) {
      await updateMenu(editing.id, data);
    } else {
      await createMenu(data);
    }
    toast.success(t("toast.saved"));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {editing ? t("menu.editTitle") : t("menu.addTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left: details + recipe */}
          <div className="space-y-4 lg:col-span-3">
            <Field
              label={t("common.name")}
              htmlFor="menu-name"
              required
              error={nameError ? t("common.required") : undefined}
            >
              <Input
                id="menu-name"
                value={state.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder={t("menu.namePlaceholder")}
                autoFocus
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t("common.nameEn")} htmlFor="menu-nameEn">
                <Input
                  id="menu-nameEn"
                  value={state.nameEn}
                  onChange={(e) => set("nameEn", e.target.value)}
                  placeholder="e.g. Beef Noodle"
                />
              </Field>
              <Field label={t("common.category")}>
                <Select
                  value={state.category}
                  onValueChange={(v) => set("category", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>{t("cat.uncategorized")}</SelectItem>
                    {MENU_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {categoryLabel(c, t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t("common.price")} htmlFor="menu-price">
                <Input
                  id="menu-price"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={state.price}
                  onChange={(e) => set("price", e.target.value)}
                  className="tnum"
                  placeholder="0"
                />
              </Field>
              <Field
                label={t("menu.fixedCost")}
                htmlFor="menu-fixed"
                hint={t("menu.fixedCostHint")}
              >
                <Input
                  id="menu-fixed"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={state.fixedCost}
                  onChange={(e) => set("fixedCost", e.target.value)}
                  className="tnum"
                  placeholder="0"
                />
              </Field>
            </div>

            <RecipeBuilder
              value={state.recipe}
              onChange={(recipe) => set("recipe", recipe)}
              ingredients={ingredients}
              ingredientMap={ingredientMap}
            />

            <Field label={t("common.note")} htmlFor="menu-note">
              <Textarea
                id="menu-note"
                rows={2}
                value={state.note}
                onChange={(e) => set("note", e.target.value)}
                placeholder={t("menu.notePlaceholder")}
              />
            </Field>
          </div>

          {/* Right: live metrics + pricing assistant */}
          <div className="space-y-4 lg:col-span-2">
            <CostMetrics cost={cost} />
            <PricingAssistant
              ingredientCost={cost.ingredientCost}
              onApply={(price) => set("price", String(price))}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave}>{t("common.save")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
