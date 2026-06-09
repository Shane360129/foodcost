import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type {
  DailyRevenue,
  Ingredient,
  MenuItem,
  Purchase,
  Supplier,
} from "@/types";

/** All ingredients, sorted by name. `undefined` while loading. */
export function useIngredients(): Ingredient[] | undefined {
  return useLiveQuery(() => db.ingredients.toArray(), []);
}

/** All menus. `undefined` while loading. */
export function useMenus(): MenuItem[] | undefined {
  return useLiveQuery(() => db.menus.toArray(), []);
}

/** All suppliers. `undefined` while loading. */
export function useSuppliers(): Supplier[] | undefined {
  return useLiveQuery(() => db.suppliers.toArray(), []);
}

/** All purchase records. `undefined` while loading. */
export function usePurchases(): Purchase[] | undefined {
  return useLiveQuery(() => db.purchases.toArray(), []);
}

/** All daily-revenue rows. `undefined` while loading. */
export function useRevenues(): DailyRevenue[] | undefined {
  return useLiveQuery(() => db.revenues.toArray(), []);
}

/** Lookup of supplier by id. */
export function useSupplierMap(
  suppliers: Supplier[] | undefined,
): Map<number, Supplier> {
  return useMemo(
    () => new Map((suppliers ?? []).map((s) => [s.id!, s] as const)),
    [suppliers],
  );
}

/** Lookup of ingredient by id, derived from the live ingredient list. */
export function useIngredientMap(
  ingredients: Ingredient[] | undefined,
): Map<number, Ingredient> {
  return useMemo(
    () => new Map((ingredients ?? []).map((i) => [i.id!, i] as const)),
    [ingredients],
  );
}

/** Count of how many menus reference each ingredient id. */
export function useIngredientUsage(
  menus: MenuItem[] | undefined,
): Map<number, number> {
  return useMemo(() => {
    const counts = new Map<number, number>();
    for (const menu of menus ?? []) {
      const seen = new Set<number>();
      for (const line of menu.recipe) {
        if (seen.has(line.ingredientId)) continue;
        seen.add(line.ingredientId);
        counts.set(line.ingredientId, (counts.get(line.ingredientId) ?? 0) + 1);
      }
    }
    return counts;
  }, [menus]);
}
