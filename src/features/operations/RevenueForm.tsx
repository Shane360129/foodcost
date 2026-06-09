import { useEffect, useState } from "react";
import { Info } from "lucide-react";
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
import { upsertRevenue } from "@/lib/db";
import { todayISO } from "@/lib/dates";
import { useSettings } from "@/lib/settings";
import type { DailyRevenue } from "@/types";

export function RevenueForm({
  open,
  onOpenChange,
  editing,
  defaultDate,
  existingDates,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: DailyRevenue | null;
  defaultDate?: string;
  existingDates: Set<string>;
}) {
  const { t, currency } = useSettings();
  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (!open) return;
    setShowErrors(false);
    setDate(editing?.date ?? defaultDate ?? todayISO());
    setAmount(editing?.revenue ? String(editing.revenue) : "");
    setNote(editing?.note ?? "");
  }, [open, editing, defaultDate]);

  const willOverwrite = !editing && existingDates.has(date);
  const amountError = showErrors && !(Number(amount) > 0);

  const handleSave = async () => {
    if (!(Number(amount) > 0) || !date) {
      setShowErrors(true);
      return;
    }
    await upsertRevenue(date, Number(amount), note.trim() || undefined);
    toast.success(t("toast.revenueSaved"));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editing ? t("op.revenueEditTitle") : t("op.revenueTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("common.date")} htmlFor="rev-date" required>
              <Input
                id="rev-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={!!editing}
              />
            </Field>
            <Field
              label={`${t("op.colRevenue")}（${currency}）`}
              htmlFor="rev-amount"
              required
              hint={t("op.revenueHint")}
              error={amountError ? t("common.required") : undefined}
            >
              <Input
                id="rev-amount"
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

          {willOverwrite && (
            <p className="flex items-center gap-1.5 rounded-md bg-warning/10 px-3 py-2 text-xs text-warning">
              <Info className="h-3.5 w-3.5" />
              {t("op.revenueExists")}
            </p>
          )}

          <Field label={t("common.note")} htmlFor="rev-note">
            <Textarea
              id="rev-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("op.revenueNotePlaceholder")}
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
