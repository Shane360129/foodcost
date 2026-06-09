import type { Ingredient, MenuCost, MenuItem, RecipeLine } from "@/types";
import { safeNumber } from "@/lib/utils";

/** Industry reference band for food-cost ratio (cost ÷ price). */
export const FOOD_COST_TARGET = { min: 0.28, max: 0.35 } as const;

export type CostHealth = "good" | "warning" | "bad" | "unknown";

/** Cost of a single recipe line. Returns 0 for a missing ingredient. */
export function lineCost(
  line: RecipeLine,
  ingredient: Ingredient | undefined,
): number {
  if (!ingredient) return 0;
  return safeNumber(line.quantity * ingredient.unitCost);
}

/** Compute all cost figures for a dish given a lookup of ingredients by id. */
export function computeMenuCost(
  menu: Pick<MenuItem, "price" | "fixedCost" | "recipe">,
  ingredientsById: Map<number, Ingredient>,
): MenuCost {
  let ingredientCost = 0;
  let hasMissingIngredient = false;

  for (const line of menu.recipe) {
    const ing = ingredientsById.get(line.ingredientId);
    if (!ing) {
      hasMissingIngredient = true;
      continue;
    }
    ingredientCost += lineCost(line, ing);
  }

  const price = safeNumber(menu.price);
  const foodCostRatio = price > 0 ? ingredientCost / price : 0;
  const grossProfit = price - ingredientCost;
  const grossMargin = price > 0 ? grossProfit / price : 0;

  const fixedCost = safeNumber(menu.fixedCost ?? 0);
  const breakEvenUnits =
    fixedCost > 0 && grossProfit > 0
      ? Math.ceil(fixedCost / grossProfit)
      : null;

  return {
    ingredientCost,
    price,
    foodCostRatio,
    grossProfit,
    grossMargin,
    breakEvenUnits,
    hasMissingIngredient,
  };
}

/**
 * Back-calculate a selling price from a target food-cost ratio.
 * e.g. cost 60, target 30% → suggested price 200.
 */
export function suggestPriceFromFoodCostRatio(
  ingredientCost: number,
  targetRatio: number,
): number {
  if (targetRatio <= 0) return 0;
  return safeNumber(ingredientCost / targetRatio);
}

/** Round a price up to a "nice" charging step (e.g. nearest 5 or 10). */
export function roundPriceUp(price: number, step = 5): number {
  if (step <= 0) return Math.round(price);
  return Math.ceil(safeNumber(price) / step) * step;
}

/** Classify a food-cost ratio against the industry target band. */
export function foodCostHealth(ratio: number, hasPrice: boolean): CostHealth {
  if (!hasPrice) return "unknown";
  if (ratio <= FOOD_COST_TARGET.max) return "good";
  if (ratio <= 0.45) return "warning";
  return "bad";
}
