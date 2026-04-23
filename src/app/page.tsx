import { RecipeBrowser } from "@/components/recipe-browser";
import { recipeLibrary } from "@/lib/planner";
import healthyDinnerTargets from "../../reports/healthy-dinners-target-list.json";

const recipesByUrl = new Map(recipeLibrary.map((recipe) => [recipe.sourceUrl.toLowerCase(), recipe]));
const recipesById = new Map(recipeLibrary.map((recipe) => [recipe.id.toLowerCase(), recipe]));
const recipesBySourceId = new Map(
  recipeLibrary.map((recipe) => {
    const match = recipe.sourceUrl.match(/\/recipes\/(\d+)/i);
    return [match?.[1] ?? recipe.id, recipe] as const;
  }),
);
const healthyDinners = healthyDinnerTargets.items
  .map(
    (item) =>
      recipesByUrl.get(item.url.toLowerCase()) ??
      recipesById.get(item.recipeId.toLowerCase()) ??
      recipesById.get(item.slug.toLowerCase()) ??
      recipesBySourceId.get(item.id),
  )
  .filter((recipe, index, array): recipe is NonNullable<(typeof recipeLibrary)[number]> => Boolean(recipe) && array.indexOf(recipe) === index);

export default function Home() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff6fa_0%,#fff9fc_34%,#ffffff_100%)] px-4 py-5 text-stone-900 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <RecipeBrowser
          sections={[
            {
              id: "healthy-meals",
              title: "Healthy Meals",
              description: "The full 119-recipe Healthy Weeknight Dinners collection with ingredients and instructions.",
              recipes: healthyDinners,
            },
          ]}
        />
      </div>
    </main>
  );
}
