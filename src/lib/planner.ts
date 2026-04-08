import { mealPlan } from "@/data/recipes";

export type GroceryItem = {
  name: string;
  total: string[];
  category: string;
  recipeTitles: string[];
};

export { mealPlan };

export function buildGroceryList() {
  const merged = new Map<string, GroceryItem>();

  for (const recipe of mealPlan) {
    for (const ingredient of recipe.ingredients) {
      const key = ingredient.item.toLowerCase();
      const existing = merged.get(key);

      if (existing) {
        existing.total.push(ingredient.amount);
        if (!existing.recipeTitles.includes(recipe.title)) {
          existing.recipeTitles.push(recipe.title);
        }
      } else {
        merged.set(key, {
          name: ingredient.item,
          total: [ingredient.amount],
          category: ingredient.category,
          recipeTitles: [recipe.title],
        });
      }
    }
  }

  return Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name));
}
