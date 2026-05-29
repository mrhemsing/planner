import { recipeLibrary } from "@/lib/planner";
import healthyDinnerTargets from "../../reports/healthy-dinners-target-list.json";

function preferDinner(current: (typeof recipeLibrary)[number] | undefined, candidate: (typeof recipeLibrary)[number]) {
  if (!current) return candidate;
  if (current.category === "Dinner") return current;
  if (candidate.category === "Dinner") return candidate;
  return current;
}

const recipesByUrl = new Map<string, (typeof recipeLibrary)[number]>();
const recipesById = new Map<string, (typeof recipeLibrary)[number]>();
const recipesBySourceId = new Map<string, (typeof recipeLibrary)[number]>();

for (const recipe of recipeLibrary) {
  recipesByUrl.set(recipe.sourceUrl.toLowerCase(), preferDinner(recipesByUrl.get(recipe.sourceUrl.toLowerCase()), recipe));
  recipesById.set(recipe.id.toLowerCase(), preferDinner(recipesById.get(recipe.id.toLowerCase()), recipe));

  const match = recipe.sourceUrl.match(/\/recipes\/(\d+)/i);
  recipesBySourceId.set(match?.[1] ?? recipe.id, preferDinner(recipesBySourceId.get(match?.[1] ?? recipe.id), recipe));
}

export const planningLabRecipes = healthyDinnerTargets.items
  .map(
    (item) =>
      recipesByUrl.get(item.url.toLowerCase()) ??
      recipesById.get(item.recipeId.toLowerCase()) ??
      recipesById.get(item.slug.toLowerCase()) ??
      recipesBySourceId.get(item.id),
  )
  .filter((recipe, index, array): recipe is NonNullable<(typeof recipeLibrary)[number]> => Boolean(recipe) && array.indexOf(recipe) === index);
