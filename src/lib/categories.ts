import type { TranslationKey } from "@/i18n/translations";

const KNOWN_CATEGORIES = new Set([
  "meat",
  "seafood",
  "vegetable",
  "dairy",
  "staple",
  "seasoning",
  "noodle",
  "pasta",
  "rice",
  "other",
]);

export const INGREDIENT_CATEGORIES = [
  "meat",
  "seafood",
  "vegetable",
  "dairy",
  "staple",
  "seasoning",
  "other",
] as const;

export const MENU_CATEGORIES = [
  "noodle",
  "pasta",
  "rice",
  "meat",
  "seafood",
  "other",
] as const;

/** Localised label for a category key, falling back to free text. */
export function categoryLabel(
  cat: string | undefined,
  t: (key: TranslationKey) => string,
): string {
  if (!cat) return t("cat.uncategorized");
  if (KNOWN_CATEGORIES.has(cat)) return t(`cat.${cat}` as TranslationKey);
  return cat;
}
