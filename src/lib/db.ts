import Dexie, { type Table } from "dexie";
import type {
  DailyRevenue,
  Ingredient,
  MenuItem,
  MetaRow,
  Purchase,
  Supplier,
} from "@/types";

/**
 * IndexedDB schema (via Dexie). Everything lives client-side; there is no
 * backend. Use the JSON backup feature to move data between machines.
 */
export class FoodCostDB extends Dexie {
  ingredients!: Table<Ingredient, number>;
  menus!: Table<MenuItem, number>;
  suppliers!: Table<Supplier, number>;
  purchases!: Table<Purchase, number>;
  revenues!: Table<DailyRevenue, string>;
  meta!: Table<MetaRow, string>;

  constructor() {
    super("foodcost");
    this.version(1).stores({
      ingredients: "++id, name, category, seedKey",
      menus: "++id, name, category, seedKey",
      meta: "key",
    });
    // v2 adds suppliers, purchases and daily revenue (purchasing control).
    this.version(2).stores({
      ingredients: "++id, name, category, seedKey, supplierId",
      menus: "++id, name, category, seedKey",
      meta: "key",
      suppliers: "++id, name, seedKey",
      purchases: "++id, date, supplierId, ingredientId",
      revenues: "date",
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

/** Delete an ingredient, strip it from recipes, and unlink it from purchases. */
export async function deleteIngredient(id: number): Promise<void> {
  await db.transaction(
    "rw",
    db.ingredients,
    db.menus,
    db.purchases,
    async () => {
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
      await db.purchases
        .where("ingredientId")
        .equals(id)
        .modify({ ingredientId: undefined, updatedAt: now() });
    },
  );
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

// --- Suppliers -------------------------------------------------------------

export async function createSupplier(
  data: Omit<Supplier, "id" | "createdAt" | "updatedAt">,
): Promise<number> {
  const ts = now();
  return db.suppliers.add({ ...data, createdAt: ts, updatedAt: ts });
}

export async function updateSupplier(
  id: number,
  data: Partial<Omit<Supplier, "id" | "createdAt">>,
): Promise<void> {
  await db.suppliers.update(id, { ...data, updatedAt: now() });
}

/** Delete a supplier and unlink it from ingredients and purchases. */
export async function deleteSupplier(id: number): Promise<void> {
  await db.transaction(
    "rw",
    db.suppliers,
    db.ingredients,
    db.purchases,
    async () => {
      await db.suppliers.delete(id);
      await db.ingredients
        .where("supplierId")
        .equals(id)
        .modify({ supplierId: undefined, updatedAt: now() });
      await db.purchases
        .where("supplierId")
        .equals(id)
        .modify({ supplierId: undefined, updatedAt: now() });
    },
  );
}

// --- Purchases -------------------------------------------------------------

export async function createPurchase(
  data: Omit<Purchase, "id" | "createdAt" | "updatedAt">,
): Promise<number> {
  const ts = now();
  return db.purchases.add({ ...data, createdAt: ts, updatedAt: ts });
}

export async function updatePurchase(
  id: number,
  data: Partial<Omit<Purchase, "id" | "createdAt">>,
): Promise<void> {
  await db.purchases.update(id, { ...data, updatedAt: now() });
}

export async function deletePurchase(id: number): Promise<void> {
  await db.purchases.delete(id);
}

// --- Daily revenue (keyed by date) -----------------------------------------

/** Insert or update a day's revenue (one row per date). */
export async function upsertRevenue(
  date: string,
  revenue: number,
  note?: string,
): Promise<void> {
  const existing = await db.revenues.get(date);
  const ts = now();
  await db.revenues.put({
    date,
    revenue,
    note,
    createdAt: existing?.createdAt ?? ts,
    updatedAt: ts,
  });
}

export async function deleteRevenue(date: string): Promise<void> {
  await db.revenues.delete(date);
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
  await db.transaction(
    "rw",
    [db.ingredients, db.menus, db.suppliers, db.purchases, db.revenues],
    async () => {
      await db.ingredients.clear();
      await db.menus.clear();
      await db.suppliers.clear();
      await db.purchases.clear();
      await db.revenues.clear();
    },
  );
}
