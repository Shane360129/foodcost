import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "@/components/common/Field";
import { createPurchase, updatePurchase } from "@/lib/db";
import { categoryLabel } from "@/lib/categories";
import { todayISO } from "@/lib/dates";
import { unitLabel } from "@/lib/format";
import { useSettings } from "@/lib/settings";
import type { Ingredient, Purchase, Supplier } from "@/types";

const NONE = "__none__";

export function PurchaseForm({
  open,
  onOpenChange,
  editing,
  defaultDate,
  suppliers,
  ingredients,
  ingredientMap,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Purchase | null;
  defaultDate?: string;
  suppliers: Supplier[];
  ingredients: Ingredient[];
  ingredientMap: Map<number, Ingredient>;
}) {
  const { t, lang } = useSettings();
  const [date, setDate] = useState(todayISO());
  const [supplierId, setSupplierId] = useState<string>(NONE);
  const [ingredientId, setIngredientId] = useState<string>(NONE);
  const [amount, setAmount] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (!open) return;
    setShowErrors(false);
    setDate(editing?.date ?? defaultDate ?? todayISO());
    setSupplierId(editing?.supplierId != null ? String(editing.supplierId) : NONE);
    setIngredientId(
      editing?.ingredientId != null ? String(editing.ingredientId) : NONE,
    );
    setAmount(editing?.amount ? String(editing.amount) : "");
    setQuantity(editing?.quantity ? String(editing.quantity) : "");
    setNote(editing?.note ?? "");
  }, [open, editing, defaultDate]);

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

  const selectedUnit =
    ingredientId !== NONE ? ingredientMap.get(Number(ingredientId))?.unit : undefined;

  const amountError = showErrors && !(Number(amount) > 0);

  const handleSave = async () => {
    if (!(Number(amount) > 0) || !date) {
      setShowErrors(true);
      return;
    }
    const data = {
      date,
      supplierId: supplierId === NONE ? undefined : Number(supplierId),
      ingredientId: ingredientId === NONE ? undefined : Number(ingredientId),
      amount: Number(amount),
      quantity: quantity ? Number(quantity) : undefined,
      note: note.trim() || undefined,
    };
    if (editing?.id != null) {
      await updatePurchase(editing.id, data);
    } else {
      await createPurchase(data);
    }
    toast.success(t("toast.purchaseSaved"));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editing ? t("op.purchaseEditTitle") : t("op.purchaseTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("common.date")} htmlFor="pur-date" required>
              <Input
                id="pur-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            <Field
              label={t("common.amount")}
              htmlFor="pur-amount"
              required
              hint={t("op.amountHint")}
              error={amountError ? t("common.required") : undefined}
            >
              <Input
                id="pur-amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="tnum"
                placeholder="0"
                autoFocus
              />
            </Field>
          </div>

          <Field label={t("op.supplier")}>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>{t("ing.noSupplier")}</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("op.item")}>
              <Select value={ingredientId} onValueChange={setIngredientId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>{t("op.itemNone")}</SelectItem>
                  {grouped.map(([cat, items]) => (
                    <SelectGroup key={cat}>
                      <SelectLabel>{categoryLabel(cat, t)}</SelectLabel>
                      {items.map((i) => (
                        <SelectItem key={i.id} value={String(i.id)}>
                          {i.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("op.quantity")}>
              <div className="relative">
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="tnum pr-10"
                  placeholder="0"
                />
                {selectedUnit && (
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    {unitLabel(selectedUnit, lang)}
                  </span>
                )}
              </div>
            </Field>
          </div>

          <Field label={t("common.note")} htmlFor="pur-note">
            <Textarea
              id="pur-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("op.purchaseNotePlaceholder")}
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave}>{t("common.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
