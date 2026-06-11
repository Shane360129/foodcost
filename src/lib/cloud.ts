import { buildBackup, importBackup, type ImportResult } from "@/lib/backup";
import type { BackupFile } from "@/types";

// ---------------------------------------------------------------------------
// Cloud sync via a user-owned free Supabase project.
//
// This is a "bring your own key" integration: the app is a static frontend, so
// it cannot hold a server secret. The user creates their own free Supabase
// project and pastes the Project URL + anon public key. We talk to the
// Supabase REST API (PostgREST) directly with fetch — no SDK dependency.
//
// The whole dataset is stored as ONE snapshot row (jsonb) keyed by a workspace
// id, mirroring the local JSON backup. Push = upsert, Pull = fetch + restore.
// ---------------------------------------------------------------------------

const URL_KEY = "foodcost.cloud.url";
const KEY_KEY = "foodcost.cloud.key";
const WS_KEY = "foodcost.cloud.workspace";

export const CLOUD_TABLE = "foodcost_snapshots";

/** SQL the user runs once in Supabase → SQL editor to create the table. */
export const CLOUD_SETUP_SQL = `create table if not exists foodcost_snapshots (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table foodcost_snapshots enable row level security;

create policy "foodcost anon access" on foodcost_snapshots
  for all to anon using (true) with check (true);`;

export interface CloudConfig {
  url: string;
  anonKey: string;
  workspace: string;
}

export function getCloudConfig(): CloudConfig {
  return {
    url: localStorage.getItem(URL_KEY) ?? "",
    anonKey: localStorage.getItem(KEY_KEY) ?? "",
    workspace: localStorage.getItem(WS_KEY) || "default",
  };
}

export function setCloudConfig(cfg: CloudConfig): void {
  localStorage.setItem(URL_KEY, cfg.url.trim());
  localStorage.setItem(KEY_KEY, cfg.anonKey.trim());
  localStorage.setItem(WS_KEY, cfg.workspace.trim() || "default");
}

export function clearCloudConfig(): void {
  localStorage.removeItem(URL_KEY);
  localStorage.removeItem(KEY_KEY);
  localStorage.removeItem(WS_KEY);
}

export function isCloudConfigured(cfg = getCloudConfig()): boolean {
  return Boolean(cfg.url && cfg.anonKey);
}

function restUrl(cfg: CloudConfig, path: string): string {
  const base = cfg.url.trim().replace(/\/+$/, "");
  return `${base}/rest/v1/${path}`;
}

function headers(cfg: CloudConfig, extra: Record<string, string> = {}) {
  return {
    apikey: cfg.anonKey,
    Authorization: `Bearer ${cfg.anonKey}`,
    ...extra,
  };
}

/** Normalise a failed response into a short, mappable error code/message. */
async function toError(res: Response): Promise<Error> {
  let detail = "";
  try {
    const body = await res.json();
    detail = body.message || body.hint || body.error || JSON.stringify(body);
  } catch {
    detail = await res.text().catch(() => "");
  }
  if (res.status === 401 || res.status === 403) return new Error("AUTH");
  if (
    res.status === 404 ||
    /relation .* does not exist|could not find the table|does not exist/i.test(
      detail,
    )
  ) {
    return new Error("NO_TABLE");
  }
  return new Error(detail || `HTTP ${res.status}`);
}

/** Verify URL + key + table are reachable. Throws a coded Error otherwise. */
export async function testCloud(cfg: CloudConfig = getCloudConfig()): Promise<void> {
  if (!isCloudConfigured(cfg)) throw new Error("NO_CONFIG");
  const res = await fetch(restUrl(cfg, `${CLOUD_TABLE}?select=id&limit=1`), {
    headers: headers(cfg),
  });
  if (!res.ok) throw await toError(res);
}

export interface PushResult {
  updatedAt: string;
}

/** Upload the full local dataset as one snapshot row (upsert by workspace). */
export async function pushSnapshot(
  cfg: CloudConfig = getCloudConfig(),
): Promise<PushResult> {
  if (!isCloudConfigured(cfg)) throw new Error("NO_CONFIG");
  const backup = await buildBackup();
  const updated_at = new Date().toISOString();
  const row = { id: cfg.workspace, data: backup, updated_at };
  const res = await fetch(restUrl(cfg, CLOUD_TABLE), {
    method: "POST",
    headers: headers(cfg, {
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    }),
    body: JSON.stringify(row),
  });
  if (!res.ok) throw await toError(res);
  return { updatedAt: updated_at };
}

export interface PullResult extends ImportResult {
  updatedAt?: string;
}

/** Fetch the cloud snapshot for the workspace and restore it locally. */
export async function pullSnapshot(
  mode: "replace" | "merge" = "replace",
  cfg: CloudConfig = getCloudConfig(),
): Promise<PullResult> {
  if (!isCloudConfigured(cfg)) throw new Error("NO_CONFIG");
  const path = `${CLOUD_TABLE}?id=eq.${encodeURIComponent(
    cfg.workspace,
  )}&select=data,updated_at`;
  const res = await fetch(restUrl(cfg, path), { headers: headers(cfg) });
  if (!res.ok) throw await toError(res);
  const rows = (await res.json()) as { data: BackupFile; updated_at: string }[];
  if (!Array.isArray(rows) || rows.length === 0) throw new Error("EMPTY");
  const backup = rows[0].data;
  if (!backup || backup.app !== "foodcost") throw new Error("INVALID");
  const result = await importBackup(backup, mode);
  return { ...result, updatedAt: rows[0].updated_at };
}
