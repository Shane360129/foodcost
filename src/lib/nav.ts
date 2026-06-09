import type { TranslationKey } from "@/i18n/translations";

export type View =
  | "home"
  | "ingredients"
  | "suppliers"
  | "operations"
  | "menus"
  | "overview"
  | "settings";

export interface NavItem {
  view: View;
  labelKey: TranslationKey;
}

export const NAV_ITEMS: NavItem[] = [
  { view: "home", labelKey: "nav.home" },
  { view: "ingredients", labelKey: "nav.ingredients" },
  { view: "suppliers", labelKey: "nav.suppliers" },
  { view: "operations", labelKey: "nav.operations" },
  { view: "menus", labelKey: "nav.menus" },
  { view: "overview", labelKey: "nav.overview" },
  { view: "settings", labelKey: "nav.settings" },
];
