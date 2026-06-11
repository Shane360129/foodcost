import { useRef, useState } from "react";
import {
  Database,
  Download,
  Languages,
  Monitor,
  Moon,
  Palette,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/common/PageHeader";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { CloudSync } from "./CloudSync";
import { clearAllData } from "@/lib/db";
import { loadSeedData } from "@/lib/seed";
import {
  downloadBackup,
  importBackup,
  parseBackup,
} from "@/lib/backup";
import { useSettings, type Theme } from "@/lib/settings";
import { cn } from "@/lib/utils";
import type { Lang } from "@/i18n/translations";

const CURRENCIES = ["NT$", "$", "¥", "€", "£", "RM", "฿", "₩"];

function Segment<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: typeof Sun }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg border border-border bg-background p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            value === opt.value
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {opt.icon && <opt.icon className="h-4 w-4" />}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function SettingsPage() {
  const { t, lang, setLang, theme, setTheme, currency, setCurrency } =
    useSettings();
  const fileRef = useRef<HTMLInputElement>(null);
  const modeRef = useRef<"replace" | "merge">("replace");
  const [confirmReset, setConfirmReset] = useState(false);

  const triggerImport = (mode: "replace" | "merge") => {
    modeRef.current = mode;
    fileRef.current?.click();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const backup = parseBackup(text);
      const res = await importBackup(backup, modeRef.current);
      toast.success(t("toast.imported", { ing: res.ingredients, menu: res.menus }));
    } catch {
      toast.error(t("toast.importFailed"));
    }
  };

  const handleExport = async () => {
    await downloadBackup();
    toast.success(t("toast.exported"));
  };

  const handleSeed = async () => {
    await loadSeedData("all");
    toast.success(t("toast.sampleLoaded"));
  };

  const handleReset = async () => {
    await clearAllData();
    toast.success(t("toast.cleared"));
  };

  return (
    <div>
      <PageHeader title={t("set.title")} subtitle={t("set.subtitle")} />

      <div className="grid gap-6">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="h-4 w-4 text-primary" />
              {t("set.appearance")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Label className="flex items-center gap-2">
                <Languages className="h-4 w-4 text-muted-foreground" />
                {t("set.language")}
              </Label>
              <Segment<Lang>
                value={lang}
                onChange={setLang}
                options={[
                  { value: "zh", label: "中文" },
                  { value: "en", label: "English" },
                ]}
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Label className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-muted-foreground" />
                {t("set.theme")}
              </Label>
              <Segment<Theme>
                value={theme}
                onChange={setTheme}
                options={[
                  { value: "dark", label: t("set.theme.dark"), icon: Moon },
                  { value: "light", label: t("set.theme.light"), icon: Sun },
                  { value: "system", label: t("set.theme.system"), icon: Monitor },
                ]}
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <Label className="flex items-center gap-2 pt-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                {t("set.currency")}
              </Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-24"
                    maxLength={4}
                  />
                  <div className="flex flex-wrap gap-1">
                    {CURRENCIES.map((c) => (
                      <button
                        key={c}
                        onClick={() => setCurrency(c)}
                        className={cn(
                          "rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                          currency === c
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("set.currencyHint")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4 text-primary" />
              {t("set.data")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DataRow
              title={t("set.loadSample")}
              hint={t("set.loadSampleHint")}
              action={
                <Button variant="outline" onClick={handleSeed}>
                  <Sparkles className="h-4 w-4" />
                  {t("set.loadSample")}
                </Button>
              }
            />
            <DataRow
              title={t("set.export")}
              hint={t("set.exportHint")}
              action={
                <Button variant="outline" onClick={handleExport}>
                  <Download className="h-4 w-4" />
                  {t("set.export")}
                </Button>
              }
            />
            <DataRow
              title={t("set.import")}
              hint={t("set.importHint")}
              action={
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => triggerImport("merge")}
                  >
                    <Upload className="h-4 w-4" />
                    {t("set.importMerge")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => triggerImport("replace")}
                  >
                    <Upload className="h-4 w-4" />
                    {t("set.importReplace")}
                  </Button>
                </div>
              }
            />
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={onFile}
            />
          </CardContent>
        </Card>

        {/* Cloud sync (Supabase) */}
        <CloudSync />

        {/* Danger zone */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <Trash2 className="h-4 w-4" />
              {t("set.danger")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataRow
              title={t("set.reset")}
              hint={t("set.resetHint")}
              action={
                <Button
                  variant="destructive"
                  onClick={() => setConfirmReset(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  {t("set.reset")}
                </Button>
              }
            />
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("set.about")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t("set.aboutDesc")}</p>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title={t("set.reset")}
        description={t("set.resetConfirm")}
        confirmLabel={t("set.reset")}
        onConfirm={handleReset}
      />
    </div>
  );
}

function DataRow({
  title,
  hint,
  action,
}: {
  title: string;
  hint: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-background/40 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}
