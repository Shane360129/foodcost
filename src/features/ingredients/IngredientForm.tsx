import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "@/components/common/Field";
import { createIngredient, updateIngredient } from "@/lib/db";
import { INGREDIENT_CATEGORIES, categoryLabel } from "@/lib/categories";
import { useSettings } from "@/lib/settings";
import { UNITS, type Ingredient, type Unit } from "@/types";

const NONE = "__none__";

const schema = z.object({
  name: z.string().trim().min(1),
  nameEn: z.string().trim().optional(),
  unit: z.enum(["g", "ml", "piece", "portion"]),
  unitCost: z.coerce.number().min(0).finite(),
  category: z.string().optional(),
  supplier: z.string().trim().optional(),
});

type FormValues = z.input<typeof schema>;

export function IngredientForm({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Ingredient | null;
}) {
  const { t } = useSettings();
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      nameEn: "",
      unit: "g",
      unitCost: 0,
      category: NONE,
      supplier: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: editing?.name ?? "",
      nameEn: editing?.nameEn ?? "",
      unit: editing?.unit ?? "g",
      unitCost: editing?.unitCost ?? 0,
      category: editing?.category ?? NONE,
      supplier: editing?.supplier ?? "",
    });
  }, [open, editing, reset]);

  const unit = watch("unit") as Unit;

  const onSubmit = async (values: FormValues) => {
    const data = {
      name: values.name.trim(),
      nameEn: values.nameEn?.trim() || undefined,
      unit: values.unit,
      unitCost: Number(values.unitCost) || 0,
      category: values.category === NONE ? undefined : values.category,
      supplier: values.supplier?.trim() || undefined,
    };
    if (editing?.id != null) {
      await updateIngredient(editing.id, data);
    } else {
      await createIngredient(data);
    }
    toast.success(t("toast.saved"));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editing ? t("ing.editTitle") : t("ing.addTitle")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field
            label={t("common.name")}
            htmlFor="ing-name"
            required
            error={errors.name && t("common.required")}
          >
            <Input
              id="ing-name"
              placeholder={t("ing.namePlaceholder")}
              autoFocus
              {...register("name")}
            />
          </Field>

          <Field label={t("common.nameEn")} htmlFor="ing-nameEn">
            <Input id="ing-nameEn" placeholder="e.g. Beef shank" {...register("nameEn")} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("common.unit")}>
              <Controller
                control={control}
                name="unit"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((u) => (
                        <SelectItem key={u} value={u}>
                          {t(`unit.${u}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field
              label={t("common.unitCost")}
              htmlFor="ing-cost"
              hint={t("ing.costHint", { unit: t(`unit.${unit}`) })}
              error={errors.unitCost && t("common.required")}
            >
              <Input
                id="ing-cost"
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                className="tnum"
                {...register("unitCost")}
              />
            </Field>
          </div>

          <Field label={t("common.category")}>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select value={field.value || NONE} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>{t("cat.uncategorized")}</SelectItem>
                    {INGREDIENT_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {categoryLabel(c, t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field label={t("common.supplier")} htmlFor="ing-supplier">
            <Textarea
              id="ing-supplier"
              rows={2}
              placeholder={t("ing.supplierPlaceholder")}
              {...register("supplier")}
            />
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit">{t("common.save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
