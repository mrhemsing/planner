"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { RecipeCategory, RecipeLibraryEntry } from "@/data/recipes";

const STORAGE_KEY = "princess-planner-favourites";
const recipeCategories: RecipeCategory[] = ["Dinner", "Lunch", "Bonus"];

export function RecipeBrowser({ recipes }: { recipes: RecipeLibraryEntry[] }) {
  const [favourites, setFavourites] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<RecipeCategory | "All">("All");
  const [plannerFilter, setPlannerFilter] = useState<"all" | "planned" | "favourites">("all");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFavourites(JSON.parse(stored) as Record<string, boolean>);
      } else {
        setFavourites(Object.fromEntries(recipes.map((recipe) => [recipe.id, recipe.favourite])));
      }
    } catch {
      setFavourites(Object.fromEntries(recipes.map((recipe) => [recipe.id, recipe.favourite])));
    } finally {
      setHydrated(true);
    }
  }, [recipes]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favourites));
  }, [favourites, hydrated]);

  const favouriteRecipes = useMemo(
    () => recipes.filter((recipe) => favourites[recipe.id]),
    [favourites, recipes],
  );
  const favouriteGroups = useMemo(
    () =>
      recipeCategories
        .map((category) => ({
          category,
          recipes: favouriteRecipes
            .filter((recipe) => recipe.category === category)
            .sort((a, b) => a.title.localeCompare(b.title)),
        }))
        .filter((group) => group.recipes.length > 0),
    [favouriteRecipes],
  );
  const plannedRecipes = useMemo(
    () => recipes.filter((recipe) => recipe.plannedDays.length > 0),
    [recipes],
  );
  const categoryCounts = useMemo(
    () => ({
      Dinner: recipes.filter((recipe) => recipe.category === "Dinner").length,
      Lunch: recipes.filter((recipe) => recipe.category === "Lunch").length,
      Bonus: recipes.filter((recipe) => recipe.category === "Bonus").length,
    }),
    [recipes],
  );
  const filteredRecipes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return recipes.filter((recipe) => {
      const matchesSearch =
        !query ||
        recipe.title.toLowerCase().includes(query) ||
        recipe.description.toLowerCase().includes(query) ||
        recipe.tags.some((tag) => tag.toLowerCase().includes(query));
      const matchesCategory = selectedCategory === "All" || recipe.category === selectedCategory;
      const matchesPlannerFilter =
        plannerFilter === "all" ||
        (plannerFilter === "planned" && recipe.plannedDays.length > 0) ||
        (plannerFilter === "favourites" && favourites[recipe.id]);

      return matchesSearch && matchesCategory && matchesPlannerFilter;
    });
  }, [favourites, plannerFilter, recipes, search, selectedCategory]);

  const toggleFavourite = (id: string) => {
    setFavourites((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("All");
    setPlannerFilter("all");
  };

  return (
    <section id="all-recipes" className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] scroll-mt-6">
      <section className="rounded-[30px] border border-rose-200 bg-white p-5 shadow-sm shadow-rose-100/40 sm:p-6">
        <div className="mb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-600">
            Recipe sources
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-stone-900 sm:text-4xl">
            NYT Cooking collections
          </h2>
          <p className="mt-2 text-lg leading-8 text-stone-700">
            Dinner and lunch planning now centers on NYT Cooking collections, with a separate bonus list for browsing only.
          </p>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <OverviewCard label="All sources" value={String(recipes.length)} />
          <OverviewCard label="Dinner pools" value={String(categoryCounts.Dinner)} />
          <OverviewCard label="Lunch pools" value={String(categoryCounts.Lunch)} />
          <OverviewCard label="Bonus lists" value={String(categoryCounts.Bonus)} />
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <OverviewCard label="In planner" value={String(plannedRecipes.length)} />
          <OverviewCard label="My favourites" value={String(favouriteRecipes.length)} />
          <OverviewCard label="Showing now" value={String(filteredRecipes.length)} />
        </div>

        {search || selectedCategory !== "All" || plannerFilter !== "all" ? (
          <div className="mb-5 rounded-[24px] border border-rose-100 bg-rose-50/60 p-4 sm:p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">
              Active filters
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {search ? <FilterChip label={`Search: ${search}`} /> : null}
              {selectedCategory !== "All" ? <FilterChip label={`Type: ${selectedCategory}`} /> : null}
              {plannerFilter !== "all" ? <FilterChip label={`View: ${plannerFilter}`} /> : null}
            </div>
          </div>
        ) : null}

        <div className="mb-5 rounded-[24px] border border-rose-100 bg-rose-50/60 p-4 sm:p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">
            Source shortcuts
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <ShortcutLink href="#all-recipes" label="Top of sources" />
            <ShortcutLink href="#planned-recipes" label="In current plan" />
            <ShortcutLink href="#my-favourites" label="My favourites" />
          </div>
        </div>

        <div className="mb-5 space-y-4 rounded-[24px] border border-rose-100 bg-rose-50/60 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <label className="block flex-1">
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">
                Search source lists
              </span>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by collection name or tag"
                className="mt-2 min-h-14 w-full rounded-[18px] border border-rose-200 bg-white px-4 text-lg text-stone-900 outline-none ring-0 placeholder:text-stone-400 focus:border-rose-400"
              />
            </label>
            <button
              type="button"
              onClick={resetFilters}
              className="min-h-12 rounded-full border border-rose-200 bg-white px-5 text-base font-semibold text-rose-700 transition hover:bg-rose-50"
            >
              Clear filters
            </button>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">
              Filter view
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["All", ...recipeCategories] as const).map((category) => {
                const active = selectedCategory === category;

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    aria-pressed={active}
                    className={`min-h-12 rounded-full px-4 text-base font-semibold transition ${
                      active ? "bg-rose-500 text-white" : "bg-white text-stone-700"
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">
              Quick filters
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                { key: "all", label: `All ${filteredRecipes.length ? "matches" : "sources"}` },
                { key: "planned", label: "In planner" },
                { key: "favourites", label: "My favourites" },
              ].map((option) => {
                const active = plannerFilter === option.key;

                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setPlannerFilter(option.key as "all" | "planned" | "favourites")}
                    aria-pressed={active}
                    className={`min-h-12 rounded-full px-4 text-base font-semibold transition ${
                      active ? "bg-stone-900 text-white" : "bg-white text-stone-700"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {plannedRecipes.length ? (
          <div id="planned-recipes" className="mb-5 rounded-[24px] border border-rose-100 bg-rose-50/60 p-4 sm:p-5 scroll-mt-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">
              In the current plan
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {plannedRecipes.map((recipe) => (
                <a
                  key={recipe.id}
                  href={`#recipe-${recipe.id}`}
                  className="rounded-full bg-white px-3 py-2 text-base font-medium text-stone-800 transition hover:bg-rose-100"
                >
                  {recipe.title} ({recipe.plannedDays.join(", ")})
                </a>
              ))}
            </div>
          </div>
        ) : null}

        <div className="space-y-5">
          {recipeCategories.map((category) => {
            const groupedRecipes = filteredRecipes
              .filter((recipe) => recipe.category === category)
              .sort((a, b) => a.title.localeCompare(b.title));

            if (!groupedRecipes.length) {
              return null;
            }

            return (
              <div key={category} className="rounded-[24px] border border-stone-200 bg-stone-50/70 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-2xl font-semibold text-stone-900">{category}</h3>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-stone-600">
                    {groupedRecipes.length}
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {groupedRecipes.map((recipe) => {
                    const isFavourite = Boolean(favourites[recipe.id]);

                    return (
                      <article
                        id={`recipe-${recipe.id}`}
                        key={recipe.id}
                        className="scroll-mt-6 rounded-[20px] border border-white bg-white p-4 target:border-rose-300 target:ring-4 target:ring-rose-100"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                          <div className="relative h-32 w-full overflow-hidden rounded-[18px] bg-rose-50 sm:h-28 sm:w-36 sm:flex-none">
                            <Image
                              src={recipe.imageUrl}
                              alt={recipe.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 100vw, 144px"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div>
                                <h4 className="text-xl font-semibold text-stone-900">
                                  {recipe.title}
                                </h4>
                                <p className="mt-2 text-lg leading-7 text-stone-700">
                                  {recipe.description}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {recipe.tags.map((tag) => (
                                    <span
                                      key={`${recipe.id}-${tag}`}
                                      className="rounded-full bg-rose-50 px-3 py-1 text-sm font-medium text-rose-700"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <FilterChip label={recipe.sourceName} />
                                  {recipe.plannedDays.length ? (
                                    <FilterChip label={`Planned: ${recipe.plannedDays.join(", ")}`} />
                                  ) : (
                                    <FilterChip label="Browse only" />
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleFavourite(recipe.id)}
                                className={`min-h-12 rounded-full px-5 text-base font-semibold transition ${
                                  isFavourite
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-stone-100 text-stone-600"
                                }`}
                                aria-pressed={isFavourite}
                              >
                                {isFavourite ? "★ Favourite" : "☆ Add favourite"}
                              </button>
                            </div>
                            <a
                              href={recipe.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 inline-flex min-h-12 items-center text-base font-semibold text-rose-600"
                            >
                              Open collection
                            </a>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {!filteredRecipes.length ? (
            <div className="rounded-[24px] border border-dashed border-rose-200 bg-rose-50/40 p-5 text-lg text-stone-700">
              No source lists match this search yet. Try a broader word or switch filters.
            </div>
          ) : null}
        </div>
      </section>

      <section id="my-favourites" className="rounded-[30px] border border-rose-200 bg-white p-5 shadow-sm shadow-rose-100/40 sm:p-6 scroll-mt-6">
        <div className="mb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-600">
            My favourites
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-stone-900 sm:text-4xl">
            Saved source lists
          </h2>
          <p className="mt-2 text-lg leading-8 text-stone-700">
            Save the NYT Cooking collections you want easy access to while we build out deeper planner integration.
          </p>
        </div>

        {favouriteRecipes.length ? (
          <>
            <div className="mb-5 grid grid-cols-2 gap-3">
              <div className="rounded-[20px] border border-rose-100 bg-rose-50/60 p-4">
                <p className="text-sm uppercase tracking-[0.16em] text-rose-500">Saved</p>
                <p className="mt-2 text-3xl font-semibold text-stone-900">{favouriteRecipes.length}</p>
              </div>
              <div className="rounded-[20px] border border-rose-100 bg-rose-50/60 p-4">
                <p className="text-sm uppercase tracking-[0.16em] text-rose-500">In plan now</p>
                <p className="mt-2 text-3xl font-semibold text-stone-900">
                  {favouriteRecipes.filter((recipe) => recipe.plannedDays.length > 0).length}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {favouriteGroups.map((group) => (
                <div
                  key={group.category}
                  className="rounded-[22px] border border-rose-100 bg-rose-50/40 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xl font-semibold text-stone-900">{group.category}</h3>
                    <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-stone-600">
                      {group.recipes.length}
                    </span>
                  </div>

                  <div className="mt-3 space-y-3">
                    {group.recipes.map((recipe) => (
                      <article
                        id={`favourite-${recipe.id}`}
                        key={recipe.id}
                        className="scroll-mt-6 rounded-[20px] border border-rose-100 bg-white p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="text-xl font-semibold text-stone-900">{recipe.title}</h4>
                            <p className="mt-1 text-lg text-stone-700">
                              {recipe.plannedDays.length ? `Planned for ${recipe.plannedDays.join(", ")}` : "Saved for browsing"}
                            </p>
                          </div>
                          <span className="text-2xl text-rose-500">♥</span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {recipe.tags.slice(0, 3).map((tag) => (
                            <span
                              key={`${recipe.id}-fav-${tag}`}
                              className="rounded-full bg-rose-50 px-3 py-1 text-sm font-medium text-rose-700"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-3">
                          <a
                            href={`#recipe-${recipe.id}`}
                            className="inline-flex min-h-12 items-center rounded-full border border-rose-200 bg-white px-4 text-base font-semibold text-rose-700 transition hover:bg-rose-50"
                          >
                            Find in sources
                          </a>
                          <a
                            href={recipe.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-12 items-center text-base font-semibold text-rose-600"
                          >
                            Open collection
                          </a>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-[22px] border border-dashed border-rose-200 bg-rose-50/40 p-4 text-lg text-stone-700">
            No favourites yet. Save a collection you want quick access to and it will appear here.
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <ShortcutLink href="#all-recipes" label="Back to top of sources" />
          <ShortcutLink href="#top-of-page" label="Back to page top" />
        </div>
      </section>
    </section>
  );
}

function FilterChip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-white px-3 py-2 text-base font-medium text-stone-800">
      {label}
    </span>
  );
}

function ShortcutLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="inline-flex min-h-12 items-center rounded-full border border-rose-200 bg-white px-4 text-base font-semibold text-rose-700 transition hover:bg-rose-100"
    >
      {label}
    </a>
  );
}

function OverviewCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-rose-100 bg-rose-50/60 p-4">
      <p className="text-sm uppercase tracking-[0.16em] text-rose-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-stone-900">{value}</p>
    </div>
  );
}
