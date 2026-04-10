import Image from "next/image";
import { RecipeBrowser } from "@/components/recipe-browser";
import { ShoppingList } from "@/components/shopping-list";
import {
  buildGroceryList,
  recipeLibrary,
  todayPlan,
  upcomingPlan,
} from "@/lib/planner";

const groceryList = buildGroceryList();

export default function Home() {
  const todayRecipeId = getRecipeIdFromUrl(todayPlan.sourceUrl);

  return (
    <main id="top-of-page" className="min-h-screen bg-[linear-gradient(180deg,#fff6fa_0%,#fff9fc_34%,#ffffff_100%)] px-4 py-5 text-stone-900 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:gap-8">
        <section className="rounded-[30px] border border-rose-200 bg-white p-5 shadow-lg shadow-rose-100/50 sm:p-8">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <div className="flex h-18 w-18 items-center justify-center overflow-hidden rounded-[24px] border border-rose-100 bg-rose-50 shadow-sm shadow-rose-100/70 sm:h-24 sm:w-24">
                <Image
                  src="/princess-planner-logo.jpg"
                  alt="Princess Planner logo"
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                  priority
                />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-600">
                  Princess Planner
                </p>
                <p className="mt-1 text-lg font-medium text-stone-700 sm:text-xl">
                  Xinyi Xu
                </p>
                <p className="mt-1 text-base text-stone-600 sm:text-lg">
                  Easy lunch and dinner planning
                </p>
              </div>
            </div>

            <div className="max-w-4xl">
              <h1 className="text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
                Today first, then the next 3 days, using NYT Cooking lunch and dinner collections.
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-700 sm:text-xl sm:leading-9">
                Large text, simple sections, and pink accents that stay easy to read.
                Dinner planning now comes from healthy weeknight dinners, lunch planning comes from healthy weekday lunches, and bonus favorites stay separate.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label="Focus" value="Today" />
              <Metric label="Next up" value="3 days" />
              <Metric label="Shopping" value={String(groceryList.length)} />
              <Metric label="Recipes" value={String(recipeLibrary.length)} />
            </div>

            <div className="rounded-[24px] border border-rose-100 bg-rose-50/60 p-4 sm:p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">
                Quick jump
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <QuickJump href="#today-plan" label="Today" />
                <QuickJump href="#shopping-list" label="Shopping list" />
                <QuickJump href="#next-3-days" label="Next 3 days" />
                <QuickJump href="#all-recipes" label="Recipe sources" />
                <QuickJump href="#my-favourites" label="Saved sources" />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-start">
          <section id="today-plan" className="rounded-[30px] border border-rose-200 bg-white p-5 shadow-sm shadow-rose-100/40 sm:p-6 scroll-mt-6">
            <div className="mb-5 flex flex-col gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-600">
                Today
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-rose-100 px-4 py-2 text-base font-semibold text-rose-700">
                  {todayPlan.mealType}
                </span>
                <span className="rounded-full bg-stone-100 px-4 py-2 text-base font-semibold text-stone-700">
                  {todayPlan.day}
                </span>
              </div>
              <h2 className="text-3xl font-semibold text-stone-900 sm:text-4xl">
                {todayPlan.title}
              </h2>
              <p className="text-lg leading-8 text-stone-700 sm:text-xl sm:leading-9">
                {todayPlan.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {todayPlan.highlights.map((highlight) => (
                <HighlightChip key={`${todayPlan.id}-${highlight}`} label={highlight} />
              ))}
            </div>

            <div className="grid gap-4">
              <InfoCard label="Selection pool" value={todayPlan.main} />
              <InfoCard label="Side note" value={todayPlan.side ?? ""} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <InfoCard label="Prep time" value={todayPlan.prepTime} compact />
              <InfoCard label="Serves" value={String(todayPlan.serves)} compact />
              <InfoCard label="Source" value={todayPlan.sourceName} compact />
            </div>

            <div className="mt-5 rounded-[24px] border border-rose-100 bg-rose-50/60 p-4 sm:p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">
                Ingredient snapshot
              </p>
              <ul className="mt-3 space-y-3 text-lg text-stone-800 sm:text-xl">
                {todayPlan.ingredients.slice(0, 5).map((ingredient) => (
                  <li
                    key={`${todayPlan.id}-${ingredient.item}`}
                    className="flex items-start justify-between gap-4"
                  >
                    <span>{ingredient.item}</span>
                    <span className="font-medium text-stone-600">{ingredient.amount}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={todayPlan.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center rounded-full bg-rose-500 px-5 text-lg font-semibold text-white transition hover:bg-rose-600"
              >
                Open today&apos;s source list
              </a>
              {todayRecipeId ? (
                <a
                  href={`#recipe-${todayRecipeId}`}
                  className="inline-flex min-h-12 items-center rounded-full border border-rose-200 bg-white px-5 text-lg font-semibold text-rose-700 transition hover:bg-rose-50"
                >
                  Find in recipe library
                </a>
              ) : null}
              <SectionLink href="#top-of-page" label="Back to top" subtle />
            </div>
          </section>

          <ShoppingList items={groceryList} />
        </section>

        <section id="next-3-days" className="rounded-[30px] border border-rose-200 bg-white p-5 shadow-sm shadow-rose-100/40 sm:p-6 scroll-mt-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-600">
                Next 3 days
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-stone-900 sm:text-4xl">
                Coming up
              </h2>
            </div>
            <p className="text-lg text-stone-600 sm:text-xl">
              Short, easy-to-scan meal cards
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {upcomingPlan.map((entry) => (
              <article
                key={entry.id}
                className="rounded-[26px] border border-stone-200 bg-stone-50/70 p-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold text-rose-600">{entry.day}</p>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-stone-700">
                    {entry.mealType}
                  </span>
                </div>
                <h3 className="mt-2 text-2xl font-semibold text-stone-900">
                  {entry.title}
                </h3>
                <p className="mt-3 text-lg leading-8 text-stone-700">{entry.description}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {entry.highlights.map((highlight) => (
                    <HighlightChip key={`${entry.id}-${highlight}`} label={highlight} />
                  ))}
                </div>

                <div className="mt-4 space-y-3">
                  <InfoCard label="Selection pool" value={entry.main} compact />
                  <InfoCard label="Side note" value={entry.side ?? ""} compact />
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  {getRecipeIdFromUrl(entry.sourceUrl) ? (
                    <a
                      href={`#recipe-${getRecipeIdFromUrl(entry.sourceUrl)}`}
                      className="inline-flex min-h-12 items-center rounded-full border border-rose-200 bg-white px-5 text-base font-semibold text-rose-700 transition hover:bg-rose-50"
                    >
                      Find in source lists
                    </a>
                  ) : null}
                  <SectionLink href="#top-of-page" label="Back to top" subtle />
                </div>
              </article>
            ))}
          </div>
        </section>

        <RecipeBrowser recipes={recipeLibrary} />

        <footer className="pb-3 pt-2 text-center text-xl font-semibold text-rose-600 sm:text-2xl">
          Reset, Renew, Repeat!
        </footer>
      </div>
    </main>
  );
}

function getRecipeIdFromUrl(url: string) {
  return url.split("/").filter(Boolean).pop();
}

function SectionLink({
  href,
  label,
  subtle = false,
}: {
  href: string;
  label: string;
  subtle?: boolean;
}) {
  return (
    <a
      href={href}
      className={`inline-flex items-center rounded-full border px-5 font-semibold transition ${
        subtle
          ? "min-h-12 border-rose-200 bg-white text-base text-rose-700 hover:bg-rose-50"
          : "min-h-14 border-rose-200 bg-white text-lg text-rose-700 hover:bg-rose-100"
      }`}
    >
      {label}
    </a>
  );
}

function QuickJump({ href, label }: { href: string; label: string }) {
  return <SectionLink href={href} label={label} />;
}

function HighlightChip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
      {label}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-rose-100 bg-rose-50 px-4 py-4">
      <p className="text-sm uppercase tracking-[0.16em] text-rose-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-stone-900 sm:text-3xl">{value}</p>
    </div>
  );
}

function InfoCard({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className="rounded-[22px] border border-stone-200 bg-white px-4 py-4">
      <p className="text-sm uppercase tracking-[0.16em] text-stone-500">{label}</p>
      <p className={`mt-2 font-semibold text-stone-900 ${compact ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"}`}>
        {value}
      </p>
    </div>
  );
}
