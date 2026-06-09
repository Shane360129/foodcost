import type { BackupFile, Ingredient, MenuItem, MetaRow } from "@/types";
import { db } from "@/lib/db";

const BACKUP_VERSION = 1;

/** Read all data out of IndexedDB into a serialisable backup object. */
export async function buildBackup(): Promise<BackupFile> {
  const [ingredients, menus, meta] = await Promise.all([
    db.ingredients.toArray(),
    db.menus.toArray(),
    db.meta.toArray(),
  ]);
  return {
    app: "foodcost",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    ingredients,
    menus,
    meta,
  };
}

/** Trigger a browser download of the current data as a JSON file. */
export async function downloadBackup(): Promise<void> {
  const backup = await buildBackup();
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);
  const a = document.createElement("a");
  a.href = url;
  a.download = `foodcost-backup-${date}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Parse + validate a backup file's text. Throws on an unrecognised shape. */
export function parseBackup(text: string): BackupFile {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("INVALID_JSON");
  }
  const obj = data as Partial<BackupFile>;
  if (
    !obj ||
    obj.app !== "foodcost" ||
    !Array.isArray(obj.ingredients) ||
    !Array.isArray(obj.menus)
  ) {
    throw new Error("INVALID_BACKUP");
  }
  return obj as BackupFile;
}

export interface ImportResult {
  ingredients: number;
  menus: number;
}

/**
 * Import a backup.
 *  - "replace": wipe existing data and restore exactly, preserving ids so
 *    recipe references stay valid. Best for moving to a new machine.
 *  - "merge": keep existing data, append the backup, remapping ingredient ids
 *    to avoid collisions and de-duplicating by seedKey.
 */
export async function importBackup(
  backup: BackupFile,
  mode: "replace" | "merge",
): Promise<ImportResult> {
  return db.transaction("rw", db.ingredients, db.menus, db.meta, async () => {
    if (mode === "replace") {
      await db.ingredients.clear();
      await db.menus.clear();
      await db.ingredients.bulkAdd(backup.ingredients);
      await db.menus.bulkAdd(backup.menus);
      if (backup.meta?.length) {
        await db.meta.bulkPut(backup.meta as MetaRow[]);
      }
      return {
        ingredients: backup.ingredients.length,
        menus: backup.menus.length,
      };
    }

    // merge
    const existing = await db.ingredients.toArray();
    const existingBySeed = new Map<string, number>();
    for (const ing of existing) {
      if (ing.seedKey) existingBySeed.set(ing.seedKey, ing.id!);
    }

    const idMap = new Map<number, number>(); // old id -> new id
    let ingredientsAdded = 0;
    for (const ing of backup.ingredients) {
      const oldId = ing.id;
      if (ing.seedKey && existingBySeed.has(ing.seedKey)) {
        if (oldId != null) idMap.set(oldId, existingBySeed.get(ing.seedKey)!);
        continue;
      }
      const { id: _drop, ...rest } = ing;
      const newId = (await db.ingredients.add(rest as Ingredient)) as number;
      if (oldId != null) idMap.set(oldId, newId);
      ingredientsAdded++;
    }

    const existingMenus = await db.menus.toArray();
    const existingMenuSeeds = new Set(
      existingMenus.map((m) => m.seedKey).filter(Boolean),
    );

    let menusAdded = 0;
    for (const menu of backup.menus) {
      if (menu.seedKey && existingMenuSeeds.has(menu.seedKey)) continue;
      const { id: _drop, ...rest } = menu;
      const remapped: MenuItem = {
        ...(rest as MenuItem),
        recipe: menu.recipe
          .map((line) => {
            const mapped = idMap.get(line.ingredientId) ?? line.ingredientId;
            return { ingredientId: mapped, quantity: line.quantity };
          }),
      };
      await db.menus.add(remapped);
      menusAdded++;
    }

    return { ingredients: ingredientsAdded, menus: menusAdded };
  });
}
