import Image from "next/image";
import { ShoppingList } from "@/components/shopping-list";
import { buildGroceryList, mealPlan } from "@/lib/planner";

const groceryList = buildGroceryList();

export default function Home() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7f5_0%,#fffaf7_35%,#ffffff_100%)] px-4 py-5 text-stone-900 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:gap-8">
        <section className="rounded-[28px] border border-rose-200/80 bg-white/95 p-5 shadow-lg shadow-rose-100/40 backdrop-blur sm:rounded-[32px] sm:p-8">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-rose-100 bg-rose-50 shadow-sm shadow-rose-100/60 sm:h-20 sm:w-20">
                <Image
                  src="/princess-planner-logo.jpg"
                  alt="Princess Planner logo"
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                  priority
                />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-500 sm:text-sm">
                  Princess Planner
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  Mobile-first meal planning
                </p>
              </div>
            </div>

            <div className="max-w-3xl">
              <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl lg:text-5xl">
                Full meals for 5 days, with quick recipe links and a tap-friendly grocery checklist.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600 sm:text-base sm:leading-8 lg:text-lg">
                Each day is built around a complete meal, usually a main and a side,
                plus optional snacks in between. No dessert planning, just simple meals
                that are easy to shop and use on your phone.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label="Days" value="5" />
              <Metric label="Meals" value={String(mealPlan.length)} />
              <Metric label="Checklist" value={String(groceryList.length)} />
              <Metric label="Source" value="Wild Rose" />
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.95fr] xl:items-start">
          <div className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm shadow-stone-200/50 sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                  Meal plan
                </p>
                <h2 className="mt-2 text-xl font-semibold text-stone-900 sm:text-2xl">
                  At-a-glance 5-day flow
                </h2>
              </div>
              <div className="rounded-full bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700">
                Built for quick phone scanning
              </div>
            </div>

            <div className="space-y-4">
              {mealPlan.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-[24px] border border-stone-200 bg-stone-50/80 p-4 transition hover:border-rose-200 hover:bg-rose-50/40 sm:p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-rose-500">{entry.day}</p>
                      <h3 className="mt-1 text-lg font-semibold text-stone-900 sm:text-xl">
                        {entry.title}
                      </h3>
                    </div>
                    <span className="self-start rounded-full bg-white px-3 py-1 text-xs font-medium text-stone-500">
                      {entry.mealType}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-stone-600">
                    {entry.description}
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                        Main
                      </p>
                      <p className="mt-1 text-sm font-medium text-stone-900">{entry.main}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                        {entry.side ? "Side" : "Note"}
                      </p>
                      <p className="mt-1 text-sm font-medium text-stone-900">
                        {entry.side ?? entry.snackNote}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {entry.highlights.map((highlight) => (
                      <span
                        key={highlight}
                        className="rounded-full bg-white px-3 py-1 text-xs font-medium text-stone-500"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-stone-600">
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                        Prep
                      </p>
                      <p className="mt-1 font-medium text-stone-900">{entry.prepTime}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                        Serves
                      </p>
                      <p className="mt-1 font-medium text-stone-900">{entry.serves}</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-white px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                      Ingredient snapshot
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-stone-700">
                      {entry.ingredients.slice(0, 4).map((ingredient) => (
                        <li
                          key={`${entry.id}-${ingredient.item}`}
                          className="flex justify-between gap-4"
                        >
                          <span>{ingredient.item}</span>
                          <span className="text-stone-500">{ingredient.amount}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <a
                    href={entry.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center text-sm font-medium text-rose-600 transition hover:text-rose-700"
                  >
                    View source on {entry.sourceName}
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
      <p className="mt-1 text-base font-semibold text-stone-900 sm:text-lg">{value}</p>
    </div>
  );
}
