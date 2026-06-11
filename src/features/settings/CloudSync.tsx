import { useState } from "react";
import {
  Check,
  ChevronDown,
  Cloud,
  Copy,
  DownloadCloud,
  Loader2,
  Plug,
  Trash2,
  TriangleAlert,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/common/Field";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  CLOUD_SETUP_SQL,
  clearCloudConfig,
  getCloudConfig,
  pullSnapshot,
  pushSnapshot,
  setCloudConfig,
  testCloud,
  type CloudConfig,
} from "@/lib/cloud";
import { useSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/i18n/translations";

type Busy = null | "test" | "push" | "pull";

export function CloudSync() {
  const { t } = useSettings();
  const initial = getCloudConfig();
  const [url, setUrl] = useState(initial.url);
  const [anonKey, setAnonKey] = useState(initial.anonKey);
  const [workspace, setWorkspace] = useState(initial.workspace);
  const [busy, setBusy] = useState<Busy>(null);
  const [showHelp, setShowHelp] = useState(!initial.url);
  const [copied, setCopied] = useState(false);
  const [confirmPull, setConfirmPull] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const configured = Boolean(url.trim() && anonKey.trim());
  const current = (): CloudConfig => ({ url, anonKey, workspace });

  const persist = () => setCloudConfig(current());

  const explain = (e: unknown): string => {
    const code = e instanceof Error ? e.message : String(e);
    const map: Record<string, TranslationKey> = {
      NO_CONFIG: "toast.cloudErrNoConfig",
      AUTH: "toast.cloudErrAuth",
      NO_TABLE: "toast.cloudErrNoTable",
      EMPTY: "toast.cloudErrEmpty",
      INVALID: "toast.importFailed",
    };
    return map[code] ? t(map[code]) : t("toast.cloudErr", { msg: code });
  };

  const saveConfig = () => {
    persist();
    toast.success(t("toast.cloudSaved"));
  };

  const doTest = async () => {
    setBusy("test");
    try {
      persist();
      await testCloud(current());
      toast.success(t("toast.cloudTested"));
    } catch (e) {
      toast.error(explain(e));
    } finally {
      setBusy(null);
    }
  };

  const doPush = async () => {
    setBusy("push");
    try {
      persist();
      const res = await pushSnapshot(current());
      setLastSync(new Date(res.updatedAt).toLocaleString());
      toast.success(t("toast.cloudPushed"));
    } catch (e) {
      toast.error(explain(e));
    } finally {
      setBusy(null);
    }
  };

  const doPull = async () => {
    setBusy("pull");
    try {
      persist();
      const res = await pullSnapshot("replace", current());
      if (res.updatedAt) setLastSync(new Date(res.updatedAt).toLocaleString());
      toast.success(
        t("toast.cloudPulled", { ing: res.ingredients, menu: res.menus }),
      );
    } catch (e) {
      toast.error(explain(e));
    } finally {
      setBusy(null);
    }
  };

  const doClear = () => {
    clearCloudConfig();
    setUrl("");
    setAnonKey("");
    setWorkspace("default");
    setLastSync(null);
    toast.success(t("toast.cloudCleared"));
  };

  const copySql = async () => {
    try {
      await navigator.clipboard.writeText(CLOUD_SETUP_SQL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Cloud className="h-4 w-4 text-primary" />
          {t("set.cloud")}
          <Badge
            variant={configured ? "success" : "muted"}
            className="ml-1 font-normal"
          >
            {configured ? t("set.cloudStatusOn") : t("set.cloudStatusOff")}
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{t("set.cloudDesc")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field label={t("set.cloudUrl")} htmlFor="cloud-url">
          <Input
            id="cloud-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://xxxx.supabase.co"
            autoComplete="off"
            spellCheck={false}
          />
        </Field>
        <Field label={t("set.cloudKey")} htmlFor="cloud-key">
          <Input
            id="cloud-key"
            type="password"
            value={anonKey}
            onChange={(e) => setAnonKey(e.target.value)}
            placeholder="eyJhbGciOi…"
            autoComplete="off"
            spellCheck={false}
          />
        </Field>
        <Field
          label={t("set.cloudWorkspace")}
          htmlFor="cloud-ws"
          hint={t("set.cloudWorkspaceHint")}
        >
          <Input
            id="cloud-ws"
            value={workspace}
            onChange={(e) => setWorkspace(e.target.value)}
            placeholder="default"
            className="max-w-xs"
            autoComplete="off"
            spellCheck={false}
          />
        </Field>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={doTest} disabled={busy !== null}>
            {busy === "test" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plug className="h-4 w-4" />
            )}
            {t("set.cloudTest")}
          </Button>
          <Button variant="outline" onClick={saveConfig} disabled={busy !== null}>
            {t("set.cloudSave")}
          </Button>
          <div className="grow" />
          <Button onClick={doPush} disabled={busy !== null || !configured}>
            {busy === "push" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UploadCloud className="h-4 w-4" />
            )}
            {t("set.cloudPush")}
          </Button>
          <Button
            variant="outline"
            onClick={() => setConfirmPull(true)}
            disabled={busy !== null || !configured}
          >
            {busy === "pull" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <DownloadCloud className="h-4 w-4" />
            )}
            {t("set.cloudPull")}
          </Button>
        </div>

        {lastSync && (
          <p className="tnum text-xs text-muted-foreground">
            {t("set.cloudLastSync", { time: lastSync })}
          </p>
        )}

        <p className="flex items-start gap-1.5 rounded-md bg-warning/10 px-3 py-2 text-xs text-warning">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {t("set.cloudPrivacy")}
        </p>

        {/* Setup help */}
        <div className="rounded-lg border border-border">
          <button
            onClick={() => setShowHelp((s) => !s)}
            className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium"
          >
            {t("set.cloudHelp")}
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                showHelp && "rotate-180",
              )}
            />
          </button>
          {showHelp && (
            <div className="space-y-3 border-t border-border px-3 py-3 text-sm">
              <ol className="list-decimal space-y-1.5 pl-4 text-muted-foreground">
                <li>{t("set.cloudStep1")}</li>
                <li>{t("set.cloudStep2")}</li>
                <li>{t("set.cloudStep3")}</li>
              </ol>
              <div className="relative">
                <pre className="tnum overflow-x-auto rounded-md border border-border bg-muted/40 p-3 text-[11px] leading-relaxed text-foreground">
                  {CLOUD_SETUP_SQL}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute right-2 top-2 h-7"
                  onClick={copySql}
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? t("set.cloudCopied") : t("set.cloudCopySql")}
                </Button>
              </div>
            </div>
          )}
        </div>

        {(url || anonKey) && (
          <button
            onClick={doClear}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t("set.cloudClear")}
          </button>
        )}
      </CardContent>

      <ConfirmDialog
        open={confirmPull}
        onOpenChange={setConfirmPull}
        title={t("set.cloudPull")}
        description={t("set.cloudPullConfirm")}
        confirmLabel={t("set.cloudPull")}
        onConfirm={doPull}
      />
    </Card>
  );
}
