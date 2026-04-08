import { ShoppingList } from "@/components/shopping-list";
import { buildGroceryList, mealPlan } from "@/lib/planner";

const groceryList = buildGroceryList();

export default function Home() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7f5_0%,#fffdfb_45%,#ffffff_100%)] px-6 py-10 text-stone-900 sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="rounded-[32px] border border-rose-200/80 bg-white/90 p-8 shadow-lg shadow-rose-100/40 backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-rose-500">
                Princess Planner
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
                A 5-day meal plan with quick-glance recipes and a check-off grocery list.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600 sm:text-lg">
                Built around Wild Rose recipes, so each planning block stays clean,
                simple, and easy to shop for in one pass.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[360px]">
              <Metric label="Days" value="5" />
              <Metric label="Recipes" value={String(mealPlan.length)} />
              <Metric label="Checklist" value={String(groceryList.length)} />
              <Metric label="Source" value="Wild Rose" />
            </div>
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[1.45fr_0.95fr]">
          <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-200/50">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-stone-500">
                  Meal plan
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-stone-900">
                  This week at a glance
                </h2>
              </div>
              <div className="rounded-full bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700">
                Daily meals, one screen
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {mealPlan.map((recipe) => (
                <article
                  key={recipe.id}
                  className="rounded-[24px] border border-stone-200 bg-stone-50/80 p-5 transition hover:-translate-y-0.5 hover:border-rose-200 hover:bg-rose-50/40"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-rose-500">{recipe.day}</p>
                      <h3 className="mt-1 text-xl font-semibold text-stone-900">
                        {recipe.title}
                      </h3>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-stone-500">
                      {recipe.mealType}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-stone-600">
                    {recipe.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {recipe.highlights.map((highlight) => (
                      <span
                        key={highlight}
                        className="rounded-full bg-white px-3 py-1 text-xs font-medium text-stone-500"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-stone-600">
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                        Prep time
                      </p>
                      <p className="mt-1 font-medium text-stone-900">{recipe.prepTime}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                        Serves
                      </p>
                      <p className="mt-1 font-medium text-stone-900">{recipe.serves}</p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl bg-white px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                      Ingredient snapshot
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-stone-700">
                      {recipe.ingredients.slice(0, 4).map((ingredient) => (
                        <li key={`${recipe.id}-${ingredient.item}`} className="flex justify-between gap-4">
                          <span>{ingredient.item}</span>
                          <span className="text-stone-500">{ingredient.amount}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <a
                    href={recipe.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center text-sm font-medium text-rose-600 transition hover:text-rose-700"
                  >
                    View full recipe on {recipe.sourceName}
                  </a>
                </article>
              ))}
            </div>
          </div>

          <ShoppingList items={groceryList} />
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.2em] text-rose-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-stone-900">{value}</p>
    </div>
  );
}
