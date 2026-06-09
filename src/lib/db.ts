import Dexie, { type Table } from "dexie";
import type { Ingredient, MenuItem, MetaRow } from "@/types";

/**
 * IndexedDB schema (via Dexie). Everything lives client-side; there is no
 * backend. Use the JSON backup feature to move data between machines.
 */
export class FoodCostDB extends Dexie {
  ingredients!: Table<Ingredient, number>;
  menus!: Table<MenuItem, number>;
  meta!: Table<MetaRow, string>;

  constructor() {
    super("foodcost");
    this.version(1).stores({
      ingredients: "++id, name, category, seedKey",
      menus: "++id, name, category, seedKey",
      meta: "key",
    });
  }
}

export const db = new FoodCostDB();

const now = () => Date.now();

// --- Ingredients -----------------------------------------------------------

export async function createIngredient(
  data: Omit<Ingredient, "id" | "createdAt" | "updatedAt">,
): Promise<number> {
  const ts = now();
  return db.ingredients.add({ ...data, createdAt: ts, updatedAt: ts });
}

export async function updateIngredient(
  id: number,
  data: Partial<Omit<Ingredient, "id" | "createdAt">>,
): Promise<void> {
  await db.ingredients.update(id, { ...data, updatedAt: now() });
}

/** Delete an ingredient and strip it from any recipe that references it. */
export async function deleteIngredient(id: number): Promise<void> {
  await db.transaction("rw", db.ingredients, db.menus, async () => {
    await db.ingredients.delete(id);
    const affected = await db.menus
      .filter((m) => m.recipe.some((line) => line.ingredientId === id))
      .toArray();
    for (const menu of affected) {
      await db.menus.update(menu.id!, {
        recipe: menu.recipe.filter((line) => line.ingredientId !== id),
        updatedAt: now(),
      });
    }
  });
}

// --- Menus -----------------------------------------------------------------

export async function createMenu(
  data: Omit<MenuItem, "id" | "createdAt" | "updatedAt">,
): Promise<number> {
  const ts = now();
  return db.menus.add({ ...data, createdAt: ts, updatedAt: ts });
}

export async function updateMenu(
  id: number,
  data: Partial<Omit<MenuItem, "id" | "createdAt">>,
): Promise<void> {
  await db.menus.update(id, { ...data, updatedAt: now() });
}

export async function deleteMenu(id: number): Promise<void> {
  await db.menus.delete(id);
}

// --- Meta (settings) -------------------------------------------------------

export async function getMeta<T>(key: string, fallback: T): Promise<T> {
  const row = await db.meta.get(key);
  return row ? (row.value as T) : fallback;
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  await db.meta.put({ key, value });
}

/** Wipe all user data (used by "reset" in settings). */
export async function clearAllData(): Promise<void> {
  await db.transaction("rw", db.ingredients, db.menus, async () => {
    await db.ingredients.clear();
    await db.menus.clear();
  });
}
