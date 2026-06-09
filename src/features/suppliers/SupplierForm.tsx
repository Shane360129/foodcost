import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { Field } from "@/components/common/Field";
import { createSupplier, updateSupplier } from "@/lib/db";
import { useSettings } from "@/lib/settings";
import type { Supplier } from "@/types";

const schema = z.object({
  name: z.string().trim().min(1),
  contact: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  note: z.string().trim().optional(),
});

type FormValues = z.infer<typeof schema>;

export function SupplierForm({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Supplier | null;
}) {
  const { t } = useSettings();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", contact: "", phone: "", note: "" },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: editing?.name ?? "",
      contact: editing?.contact ?? "",
      phone: editing?.phone ?? "",
      note: editing?.note ?? "",
    });
  }, [open, editing, reset]);

  const onSubmit = async (values: FormValues) => {
    const data = {
      name: values.name.trim(),
      contact: values.contact?.trim() || undefined,
      phone: values.phone?.trim() || undefined,
      note: values.note?.trim() || undefined,
    };
    if (editing?.id != null) {
      await updateSupplier(editing.id, data);
    } else {
      await createSupplier(data);
    }
    toast.success(t("toast.saved"));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editing ? t("sup.editTitle") : t("sup.addTitle")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field
            label={t("common.name")}
            htmlFor="sup-name"
            required
            error={errors.name && t("common.required")}
          >
            <Input
              id="sup-name"
              autoFocus
              placeholder={t("sup.namePlaceholder")}
              {...register("name")}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("common.contact")} htmlFor="sup-contact">
              <Input
                id="sup-contact"
                placeholder={t("sup.contactPlaceholder")}
                {...register("contact")}
              />
            </Field>
            <Field label={t("common.phone")} htmlFor="sup-phone">
              <Input
                id="sup-phone"
                placeholder={t("sup.phonePlaceholder")}
                {...register("phone")}
              />
            </Field>
          </div>
          <Field label={t("common.note")} htmlFor="sup-note">
            <Textarea
              id="sup-note"
              rows={2}
              placeholder={t("sup.notePlaceholder")}
              {...register("note")}
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
