import type { TranslationKey } from "@/i18n/translations";

export type View = "home" | "ingredients" | "menus" | "overview" | "settings";

export interface NavItem {
  view: View;
  labelKey: TranslationKey;
}

export const NAV_ITEMS: NavItem[] = [
  { view: "home", labelKey: "nav.home" },
  { view: "ingredients", labelKey: "nav.ingredients" },
  { view: "menus", labelKey: "nav.menus" },
  { view: "overview", labelKey: "nav.overview" },
  { view: "settings", labelKey: "nav.settings" },
];
