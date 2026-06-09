import type {
  BackupFile,
  Ingredient,
  MenuItem,
  MetaRow,
  Purchase,
  Supplier,
} from "@/types";
import { db } from "@/lib/db";

const BACKUP_VERSION = 2;

/** Read all data out of IndexedDB into a serialisable backup object. */
export async function buildBackup(): Promise<BackupFile> {
  const [ingredients, menus, suppliers, purchases, revenues, meta] =
    await Promise.all([
      db.ingredients.toArray(),
      db.menus.toArray(),
      db.suppliers.toArray(),
      db.purchases.toArray(),
      db.revenues.toArray(),
      db.meta.toArray(),
    ]);
  return {
    app: "foodcost",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    ingredients,
    menus,
    suppliers,
    purchases,
    revenues,
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
  const suppliers = backup.suppliers ?? [];
  const purchases = backup.purchases ?? [];
  const revenues = backup.revenues ?? [];

  return db.transaction(
    "rw",
    [db.ingredients, db.menus, db.suppliers, db.purchases, db.revenues, db.meta],
    async () => {
      if (mode === "replace") {
        await Promise.all([
          db.ingredients.clear(),
          db.menus.clear(),
          db.suppliers.clear(),
          db.purchases.clear(),
          db.revenues.clear(),
        ]);
        await db.suppliers.bulkAdd(suppliers);
        await db.ingredients.bulkAdd(backup.ingredients);
        await db.menus.bulkAdd(backup.menus);
        await db.purchases.bulkAdd(purchases);
        await db.revenues.bulkAdd(revenues);
        if (backup.meta?.length) {
          await db.meta.bulkPut(backup.meta as MetaRow[]);
        }
        return {
          ingredients: backup.ingredients.length,
          menus: backup.menus.length,
        };
      }

      // --- merge: remap ids to avoid collisions ---

      // Suppliers
      const existingSuppliers = await db.suppliers.toArray();
      const supplierBySeed = new Map<string, number>();
      for (const s of existingSuppliers) {
        if (s.seedKey) supplierBySeed.set(s.seedKey, s.id!);
      }
      const supplierIdMap = new Map<number, number>();
      for (const sup of suppliers) {
        const oldId = sup.id;
        if (sup.seedKey && supplierBySeed.has(sup.seedKey)) {
          if (oldId != null) supplierIdMap.set(oldId, supplierBySeed.get(sup.seedKey)!);
          continue;
        }
        const { id: _drop, ...rest } = sup;
        const newId = (await db.suppliers.add(rest as Supplier)) as number;
        if (oldId != null) supplierIdMap.set(oldId, newId);
      }
      const mapSupplier = (id?: number) =>
        id != null ? (supplierIdMap.get(id) ?? id) : undefined;

      // Ingredients
      const existing = await db.ingredients.toArray();
      const existingBySeed = new Map<string, number>();
      for (const ing of existing) {
        if (ing.seedKey) existingBySeed.set(ing.seedKey, ing.id!);
      }
      const idMap = new Map<number, number>();
      let ingredientsAdded = 0;
      for (const ing of backup.ingredients) {
        const oldId = ing.id;
        if (ing.seedKey && existingBySeed.has(ing.seedKey)) {
          if (oldId != null) idMap.set(oldId, existingBySeed.get(ing.seedKey)!);
          continue;
        }
        const { id: _drop, ...rest } = ing;
        const newId = (await db.ingredients.add({
          ...(rest as Ingredient),
          supplierId: mapSupplier(ing.supplierId),
        })) as number;
        if (oldId != null) idMap.set(oldId, newId);
        ingredientsAdded++;
      }

      // Menus
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
          recipe: menu.recipe.map((line) => ({
            ingredientId: idMap.get(line.ingredientId) ?? line.ingredientId,
            quantity: line.quantity,
          })),
        };
        await db.menus.add(remapped);
        menusAdded++;
      }

      // Purchases (append, remapping supplier + ingredient ids)
      for (const p of purchases) {
        const { id: _drop, ...rest } = p;
        await db.purchases.add({
          ...(rest as Purchase),
          supplierId: mapSupplier(p.supplierId),
          ingredientId:
            p.ingredientId != null
              ? (idMap.get(p.ingredientId) ?? p.ingredientId)
              : undefined,
        });
      }

      // Revenues (keyed by date; keep existing day on conflict)
      const existingDates = new Set((await db.revenues.toArray()).map((r) => r.date));
      for (const rev of revenues) {
        if (existingDates.has(rev.date)) continue;
        await db.revenues.add(rev);
      }

      return { ingredients: ingredientsAdded, menus: menusAdded };
    },
  );
}
