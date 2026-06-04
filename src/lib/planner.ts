import { mealPlan, recipeLibrary, recentlyAddedDinnerRecipes } from "@/data/recipes";

export type GroceryItem = {
  name: string;
  total: string[];
  category: string;
  recipeTitles: string[];
};

export { mealPlan, recipeLibrary, recentlyAddedDinnerRecipes };

export const todayPlan = mealPlan[0];
export const upcomingPlan = mealPlan.slice(1, 4);

export function buildGroceryList() {
  const activePlan = mealPlan.slice(0, 4);
  const merged = new Map<string, GroceryItem>();

  for (const recipe of activePlan) {
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
