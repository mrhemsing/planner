import { RecipeBrowser } from "@/components/recipe-browser";
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
  const urlKey = recipe.sourceUrl.toLowerCase();
  recipesByUrl.set(urlKey, preferDinner(recipesByUrl.get(urlKey), recipe));

  const idKey = recipe.id.toLowerCase();
  recipesById.set(idKey, preferDinner(recipesById.get(idKey), recipe));

  const match = recipe.sourceUrl.match(/\/recipes\/(\d+)/i);
  const sourceIdKey = match?.[1] ?? recipe.id;
  recipesBySourceId.set(sourceIdKey, preferDinner(recipesBySourceId.get(sourceIdKey), recipe));
}

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
    <main className="min-h-screen overflow-x-hidden bg-[#cd2f12] px-4 pb-5 pt-0 text-stone-900 sm:px-6 sm:pb-8 sm:pt-0 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pt-0">
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
        <a
          href="https://b-average.com"
          target="_blank"
          rel="noreferrer"
          className="self-start bg-white px-[6px] pb-1 pl-[6px] pr-[5px] pt-1 font-sans text-[11px] font-semibold uppercase leading-none tracking-[2.16px] text-black no-underline transition-colors duration-150 hover:bg-black hover:text-white"
        >
          B AVERAGE
        </a>
      </div>
    </main>
  );
}
