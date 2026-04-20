import { RecipeBrowser } from "@/components/recipe-browser";
import { recipeLibrary } from "@/lib/planner";

const healthyDinners = recipeLibrary.filter((recipe) => recipe.category === "Dinner");

export default function Home() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff6fa_0%,#fff9fc_34%,#ffffff_100%)] px-4 py-5 text-stone-900 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <RecipeBrowser
          sections={[
            {
              id: "healthy-meals",
              title: "Healthy Meals",
              description: "A healthy meal section for weeknight planning and browsing.",
              recipes: healthyDinners,
            },
          ]}
        />
      </div>
    </main>
  );
}
