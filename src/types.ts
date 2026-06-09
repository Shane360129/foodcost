// ---------------------------------------------------------------------------
// Domain types for the Restaurant Menu Cost Calculator
// ---------------------------------------------------------------------------

/** Units an ingredient can be measured in. */
export type Unit = "g" | "ml" | "piece" | "portion";

export const UNITS: Unit[] = ["g", "ml", "piece", "portion"];

/** A raw ingredient in the master list. Unit cost is "cost per 1 unit". */
export interface Ingredient {
  id?: number;
  /** Display name (primary language / Chinese). */
  name: string;
  /** Optional English name for the bilingual UI. */
  nameEn?: string;
  unit: Unit;
  /** Cost of one `unit` of this ingredient, in the app currency. */
  unitCost: number;
  /** Linked supplier (vendor) id, if any. */
  supplierId?: number;
  /** Free-text purchasing note (pack size, price memo, ...). */
  supplier?: string;
  /** Optional grouping bucket (meat, seafood, ...). */
  category?: string;
  /** Stable key for seeded items, used to avoid duplicate loads. */
  seedKey?: string;
  createdAt: number;
  updatedAt: number;
}

/** One line of a recipe: an ingredient plus how much of it the dish uses. */
export interface RecipeLine {
  ingredientId: number;
  /** Quantity expressed in the ingredient's own unit. */
  quantity: number;
}

/** A menu dish: a sellable item built from recipe lines. */
export interface MenuItem {
  id?: number;
  name: string;
  nameEn?: string;
  category?: string;
  /** Selling price (tax-exclusive), in the app currency. */
  price: number;
  /** Optional monthly fixed cost allocated to this dish for break-even. */
  fixedCost?: number;
  /** Recipe lines that make up the dish. */
  recipe: RecipeLine[];
  note?: string;
  seedKey?: string;
  createdAt: number;
  updatedAt: number;
}

/** A supplier / vendor you purchase ingredients from. */
export interface Supplier {
  id?: number;
  name: string;
  /** Contact person. */
  contact?: string;
  phone?: string;
  note?: string;
  seedKey?: string;
  createdAt: number;
  updatedAt: number;
}

/** A single purchase (goods-in) record. Amount is the money spent. */
export interface Purchase {
  id?: number;
  /** Local date, "YYYY-MM-DD". */
  date: string;
  supplierId?: number;
  /** Which product/ingredient was bought (optional). */
  ingredientId?: number;
  /** Total money spent on this line, in the app currency. */
  amount: number;
  /** Optional quantity bought, in the ingredient's unit. */
  quantity?: number;
  note?: string;
  createdAt: number;
  updatedAt: number;
}

/** One day's takings. Keyed by date (one row per day). */
export interface DailyRevenue {
  /** Local date, "YYYY-MM-DD" — primary key. */
  date: string;
  revenue: number;
  note?: string;
  createdAt: number;
  updatedAt: number;
}

/** Key/value store for app settings (theme, language, currency...). */
export interface MetaRow {
  key: string;
  value: unknown;
}

/** Computed cost figures for a single dish. */
export interface MenuCost {
  /** Sum of (line quantity × ingredient unit cost). */
  ingredientCost: number;
  price: number;
  /** ingredientCost / price (0..1). Industry target ≈ 0.28–0.35. */
  foodCostRatio: number;
  /** price − ingredientCost. */
  grossProfit: number;
  /** grossProfit / price (0..1). */
  grossMargin: number;
  /** fixedCost / grossProfit, rounded up. null when not computable. */
  breakEvenUnits: number | null;
  /** True when any recipe line points at a missing ingredient. */
  hasMissingIngredient: boolean;
}

/** Shape of an exported JSON backup file. */
export interface BackupFile {
  app: "foodcost";
  version: number;
  exportedAt: string;
  ingredients: Ingredient[];
  menus: MenuItem[];
  suppliers?: Supplier[];
  purchases?: Purchase[];
  revenues?: DailyRevenue[];
  meta?: MetaRow[];
}
