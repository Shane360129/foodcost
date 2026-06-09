import type { Unit } from "@/types";
import { db } from "@/lib/db";

export interface SeedIngredient {
  key: string;
  name: string;
  nameEn: string;
  unit: Unit;
  /** Cost per single unit, in NT$ (editable after loading). */
  unitCost: number;
  category: string;
  supplier?: string;
}

export interface SeedMenu {
  key: string;
  name: string;
  nameEn: string;
  category: string;
  price: number;
  fixedCost?: number;
  note?: string;
  /** Recipe lines referencing seed ingredients by key. */
  recipe: { key: string; quantity: number }[];
}

// Category keys map to localized labels in the i18n table.
export const SEED_INGREDIENTS: SeedIngredient[] = [
  // 肉類 Meat
  { key: "beef_shank", name: "牛腱", nameEn: "Beef shank", unit: "g", unitCost: 0.35, category: "meat" },
  { key: "beef_rib", name: "牛肋條", nameEn: "Beef short rib", unit: "g", unitCost: 0.45, category: "meat" },
  { key: "beef_mince", name: "牛絞肉", nameEn: "Ground beef", unit: "g", unitCost: 0.28, category: "meat" },
  { key: "chicken_breast", name: "雞胸肉", nameEn: "Chicken breast", unit: "g", unitCost: 0.18, category: "meat" },
  { key: "chicken_thigh", name: "雞腿肉", nameEn: "Chicken thigh", unit: "g", unitCost: 0.16, category: "meat" },
  { key: "pork_mince", name: "豬絞肉", nameEn: "Ground pork", unit: "g", unitCost: 0.2, category: "meat" },
  { key: "pork_belly", name: "豬五花", nameEn: "Pork belly", unit: "g", unitCost: 0.28, category: "meat" },
  { key: "bacon", name: "培根", nameEn: "Bacon", unit: "g", unitCost: 0.45, category: "meat" },
  { key: "ham", name: "火腿", nameEn: "Ham", unit: "g", unitCost: 0.4, category: "meat" },

  // 海鮮 Seafood
  { key: "shrimp", name: "蝦仁", nameEn: "Shrimp", unit: "g", unitCost: 0.5, category: "seafood" },
  { key: "squid", name: "透抽", nameEn: "Squid", unit: "g", unitCost: 0.45, category: "seafood" },
  { key: "clam", name: "蛤蜊", nameEn: "Clam", unit: "g", unitCost: 0.12, category: "seafood" },
  { key: "mussel", name: "淡菜", nameEn: "Mussel", unit: "g", unitCost: 0.18, category: "seafood" },
  { key: "salmon", name: "鮭魚", nameEn: "Salmon", unit: "g", unitCost: 0.7, category: "seafood" },
  { key: "tilapia", name: "鯛魚片", nameEn: "Tilapia fillet", unit: "g", unitCost: 0.25, category: "seafood" },
  { key: "scallop", name: "干貝", nameEn: "Scallop", unit: "g", unitCost: 1.2, category: "seafood" },

  // 蔬菜 Vegetables
  { key: "onion", name: "洋蔥", nameEn: "Onion", unit: "g", unitCost: 0.05, category: "vegetable" },
  { key: "carrot", name: "紅蘿蔔", nameEn: "Carrot", unit: "g", unitCost: 0.04, category: "vegetable" },
  { key: "potato", name: "馬鈴薯", nameEn: "Potato", unit: "g", unitCost: 0.05, category: "vegetable" },
  { key: "tomato", name: "番茄", nameEn: "Tomato", unit: "g", unitCost: 0.06, category: "vegetable" },
  { key: "garlic", name: "蒜頭", nameEn: "Garlic", unit: "g", unitCost: 0.12, category: "vegetable" },
  { key: "ginger", name: "薑", nameEn: "Ginger", unit: "g", unitCost: 0.1, category: "vegetable" },
  { key: "scallion", name: "青蔥", nameEn: "Green onion", unit: "g", unitCost: 0.08, category: "vegetable" },
  { key: "cabbage", name: "高麗菜", nameEn: "Cabbage", unit: "g", unitCost: 0.03, category: "vegetable" },
  { key: "bell_pepper", name: "青椒", nameEn: "Bell pepper", unit: "g", unitCost: 0.08, category: "vegetable" },
  { key: "shiitake", name: "香菇", nameEn: "Shiitake mushroom", unit: "g", unitCost: 0.2, category: "vegetable" },
  { key: "button_mushroom", name: "蘑菇", nameEn: "Button mushroom", unit: "g", unitCost: 0.15, category: "vegetable" },
  { key: "spinach", name: "菠菜", nameEn: "Spinach", unit: "g", unitCost: 0.07, category: "vegetable" },
  { key: "bokchoy", name: "小白菜", nameEn: "Bok choy", unit: "g", unitCost: 0.05, category: "vegetable" },
  { key: "corn", name: "玉米", nameEn: "Corn", unit: "g", unitCost: 0.06, category: "vegetable" },
  { key: "peas", name: "青豆", nameEn: "Green peas", unit: "g", unitCost: 0.1, category: "vegetable" },
  { key: "celery", name: "西芹", nameEn: "Celery", unit: "g", unitCost: 0.06, category: "vegetable" },
  { key: "chili", name: "辣椒", nameEn: "Chili", unit: "g", unitCost: 0.15, category: "vegetable" },
  { key: "basil", name: "九層塔", nameEn: "Basil", unit: "g", unitCost: 0.2, category: "vegetable" },

  // 蛋奶 Dairy & egg
  { key: "egg", name: "雞蛋", nameEn: "Egg", unit: "piece", unitCost: 6, category: "dairy" },
  { key: "milk", name: "鮮奶", nameEn: "Milk", unit: "ml", unitCost: 0.06, category: "dairy" },
  { key: "cream", name: "鮮奶油", nameEn: "Heavy cream", unit: "ml", unitCost: 0.15, category: "dairy" },
  { key: "butter", name: "奶油", nameEn: "Butter", unit: "g", unitCost: 0.25, category: "dairy" },
  { key: "cheddar", name: "切達起司", nameEn: "Cheddar cheese", unit: "g", unitCost: 0.4, category: "dairy" },
  { key: "parmesan", name: "帕瑪森起司", nameEn: "Parmesan", unit: "g", unitCost: 0.8, category: "dairy" },
  { key: "mozzarella", name: "莫札瑞拉", nameEn: "Mozzarella", unit: "g", unitCost: 0.5, category: "dairy" },

  // 主食 Staples
  { key: "rice", name: "白米", nameEn: "White rice", unit: "g", unitCost: 0.04, category: "staple" },
  { key: "arborio", name: "燉飯米", nameEn: "Arborio rice", unit: "g", unitCost: 0.15, category: "staple" },
  { key: "spaghetti", name: "義大利麵", nameEn: "Spaghetti", unit: "g", unitCost: 0.12, category: "staple" },
  { key: "noodles", name: "麵條", nameEn: "Wheat noodles", unit: "g", unitCost: 0.08, category: "staple" },
  { key: "flour", name: "中筋麵粉", nameEn: "Flour", unit: "g", unitCost: 0.03, category: "staple" },
  { key: "bread", name: "麵包", nameEn: "Bread", unit: "g", unitCost: 0.1, category: "staple" },

  // 調味料 / 油 Seasoning & oil
  { key: "olive_oil", name: "橄欖油", nameEn: "Olive oil", unit: "ml", unitCost: 0.25, category: "seasoning" },
  { key: "veg_oil", name: "沙拉油", nameEn: "Vegetable oil", unit: "ml", unitCost: 0.08, category: "seasoning" },
  { key: "soy_sauce", name: "醬油", nameEn: "Soy sauce", unit: "ml", unitCost: 0.05, category: "seasoning" },
  { key: "salt", name: "鹽", nameEn: "Salt", unit: "g", unitCost: 0.01, category: "seasoning" },
  { key: "sugar", name: "糖", nameEn: "Sugar", unit: "g", unitCost: 0.02, category: "seasoning" },
  { key: "rock_sugar", name: "冰糖", nameEn: "Rock sugar", unit: "g", unitCost: 0.04, category: "seasoning" },
  { key: "rice_wine", name: "米酒", nameEn: "Rice wine", unit: "ml", unitCost: 0.06, category: "seasoning" },
  { key: "white_wine", name: "白酒", nameEn: "White wine", unit: "ml", unitCost: 0.12, category: "seasoning" },
  { key: "oyster_sauce", name: "蠔油", nameEn: "Oyster sauce", unit: "ml", unitCost: 0.08, category: "seasoning" },
  { key: "tomato_paste", name: "番茄糊", nameEn: "Tomato paste", unit: "g", unitCost: 0.12, category: "seasoning" },
  { key: "canned_tomato", name: "整顆番茄罐頭", nameEn: "Canned tomato", unit: "g", unitCost: 0.06, category: "seasoning" },
  { key: "black_pepper", name: "黑胡椒", nameEn: "Black pepper", unit: "g", unitCost: 0.3, category: "seasoning" },
  { key: "white_pepper", name: "白胡椒", nameEn: "White pepper", unit: "g", unitCost: 0.3, category: "seasoning" },
  { key: "bean_paste", name: "辣豆瓣醬", nameEn: "Spicy bean paste", unit: "g", unitCost: 0.1, category: "seasoning" },
  { key: "stock", name: "高湯", nameEn: "Stock", unit: "ml", unitCost: 0.03, category: "seasoning" },
  { key: "bay_leaf", name: "月桂葉", nameEn: "Bay leaf", unit: "piece", unitCost: 2, category: "seasoning" },
  { key: "star_anise", name: "八角", nameEn: "Star anise", unit: "g", unitCost: 0.4, category: "seasoning" },
  { key: "italian_herbs", name: "義式香料", nameEn: "Italian herbs", unit: "g", unitCost: 0.5, category: "seasoning" },
  { key: "saffron", name: "番紅花", nameEn: "Saffron", unit: "g", unitCost: 30, category: "seasoning" },
];

export const SEED_MENUS: SeedMenu[] = [
  {
    key: "braised_beef_noodle",
    name: "紅燒牛肉麵",
    nameEn: "Braised Beef Noodle Soup",
    category: "noodle",
    price: 220,
    fixedCost: 60000,
    note: "經典招牌。牛腱燉煮三小時，湯頭辣豆瓣為底。",
    recipe: [
      { key: "beef_shank", quantity: 220 },
      { key: "noodles", quantity: 180 },
      { key: "onion", quantity: 50 },
      { key: "carrot", quantity: 40 },
      { key: "garlic", quantity: 15 },
      { key: "ginger", quantity: 15 },
      { key: "scallion", quantity: 20 },
      { key: "tomato", quantity: 60 },
      { key: "bean_paste", quantity: 30 },
      { key: "soy_sauce", quantity: 30 },
      { key: "rice_wine", quantity: 20 },
      { key: "rock_sugar", quantity: 10 },
      { key: "star_anise", quantity: 3 },
      { key: "stock", quantity: 400 },
      { key: "bokchoy", quantity: 50 },
    ],
  },
  {
    key: "spaghetti_bolognese",
    name: "義大利肉醬麵",
    nameEn: "Spaghetti Bolognese",
    category: "pasta",
    price: 240,
    fixedCost: 60000,
    note: "牛豬混合絞肉慢燉肉醬，撒上帕瑪森起司。",
    recipe: [
      { key: "spaghetti", quantity: 120 },
      { key: "beef_mince", quantity: 80 },
      { key: "pork_mince", quantity: 60 },
      { key: "onion", quantity: 60 },
      { key: "carrot", quantity: 40 },
      { key: "celery", quantity: 30 },
      { key: "garlic", quantity: 10 },
      { key: "canned_tomato", quantity: 200 },
      { key: "tomato_paste", quantity: 30 },
      { key: "olive_oil", quantity: 15 },
      { key: "white_wine", quantity: 30 },
      { key: "parmesan", quantity: 15 },
      { key: "italian_herbs", quantity: 3 },
      { key: "salt", quantity: 3 },
      { key: "black_pepper", quantity: 2 },
    ],
  },
  {
    key: "seafood_risotto",
    name: "海鮮燉飯",
    nameEn: "Seafood Risotto",
    category: "rice",
    price: 320,
    fixedCost: 60000,
    note: "番紅花燉飯，蝦、透抽、蛤蜊、淡菜四種海鮮。",
    recipe: [
      { key: "arborio", quantity: 90 },
      { key: "shrimp", quantity: 80 },
      { key: "squid", quantity: 80 },
      { key: "clam", quantity: 100 },
      { key: "mussel", quantity: 80 },
      { key: "onion", quantity: 40 },
      { key: "garlic", quantity: 10 },
      { key: "white_wine", quantity: 40 },
      { key: "olive_oil", quantity: 20 },
      { key: "butter", quantity: 20 },
      { key: "parmesan", quantity: 20 },
      { key: "saffron", quantity: 0.2 },
      { key: "stock", quantity: 500 },
      { key: "salt", quantity: 2 },
      { key: "black_pepper", quantity: 1 },
    ],
  },
];

export interface SeedResult {
  ingredientsAdded: number;
  menusAdded: number;
}

export type SeedScope = "ingredients" | "all";

/**
 * Load seed data. Idempotent on `seedKey`: ingredients/menus that were already
 * loaded (by key) are skipped, so the button is safe to press more than once.
 */
export async function loadSeedData(scope: SeedScope = "all"): Promise<SeedResult> {
  const ts = Date.now();
  let ingredientsAdded = 0;
  let menusAdded = 0;

  await db.transaction("rw", db.ingredients, db.menus, async () => {
    // Map existing seed ingredients by key so we can resolve recipe references.
    const existing = await db.ingredients.toArray();
    const idByKey = new Map<string, number>();
    for (const ing of existing) {
      if (ing.seedKey) idByKey.set(ing.seedKey, ing.id!);
    }

    for (const seed of SEED_INGREDIENTS) {
      if (idByKey.has(seed.key)) continue;
      const id = await db.ingredients.add({
        name: seed.name,
        nameEn: seed.nameEn,
        unit: seed.unit,
        unitCost: seed.unitCost,
        category: seed.category,
        supplier: seed.supplier,
        seedKey: seed.key,
        createdAt: ts,
        updatedAt: ts,
      });
      idByKey.set(seed.key, id as number);
      ingredientsAdded++;
    }

    if (scope === "all") {
      const existingMenus = await db.menus.toArray();
      const menuKeys = new Set(
        existingMenus.map((m) => m.seedKey).filter(Boolean),
      );

      for (const menu of SEED_MENUS) {
        if (menuKeys.has(menu.key)) continue;
        const recipe = menu.recipe
          .map((line) => {
            const id = idByKey.get(line.key);
            return id ? { ingredientId: id, quantity: line.quantity } : null;
          })
          .filter((line): line is { ingredientId: number; quantity: number } =>
            Boolean(line),
          );

        await db.menus.add({
          name: menu.name,
          nameEn: menu.nameEn,
          category: menu.category,
          price: menu.price,
          fixedCost: menu.fixedCost,
          note: menu.note,
          recipe,
          seedKey: menu.key,
          createdAt: ts,
          updatedAt: ts,
        });
        menusAdded++;
      }
    }
  });

  return { ingredientsAdded, menusAdded };
}
