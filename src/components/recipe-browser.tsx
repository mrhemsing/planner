"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { RecipeCategory, RecipeLibraryEntry } from "@/data/recipes";

const STORAGE_KEY = "princess-planner-favourites";
const recipeCategories: RecipeCategory[] = ["Dinner", "Lunch"];

export function RecipeBrowser({ recipes }: { recipes: RecipeLibraryEntry[] }) {
  const [favourites, setFavourites] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<RecipeCategory | "All">("All");
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

  const filteredRecipes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return recipes
      .filter((recipe) => {
        const matchesSearch =
          !query ||
          recipe.title.toLowerCase().includes(query) ||
          recipe.description.toLowerCase().includes(query) ||
          recipe.tags.some((tag) => tag.toLowerCase().includes(query));
        const matchesCategory = selectedCategory === "All" || recipe.category === selectedCategory;

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        const favouriteDiff = Number(Boolean(favourites[b.id])) - Number(Boolean(favourites[a.id]));
        if (favouriteDiff !== 0) return favouriteDiff;
        return a.title.localeCompare(b.title);
      });
  }, [favourites, recipes, search, selectedCategory]);

  const favouriteRecipes = useMemo(
    () =>
      recipes
        .filter((recipe) => favourites[recipe.id])
        .sort((a, b) => a.title.localeCompare(b.title)),
    [favourites, recipes],
  );

  const categoryCounts = useMemo(
    () => ({
      Dinner: recipes.filter((recipe) => recipe.category === "Dinner").length,
      Lunch: recipes.filter((recipe) => recipe.category === "Lunch").length,
    }),
    [recipes],
  );

  const toggleFavourite = (id: string) => {
    setFavourites((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("All");
  };

  return (
    <section className="grid gap-6">
      <section id="browse-recipes" className="rounded-[30px] border border-rose-200 bg-white p-5 shadow-sm shadow-rose-100/40 sm:p-6 scroll-mt-6">
        <div className="mb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-600">
            Section 1
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-stone-900 sm:text-4xl">
            Browse recipes
          </h2>
          <p className="mt-2 text-lg leading-8 text-stone-700">
            Search and filter the recipe library by name, tag, or meal type.
          </p>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <OverviewCard label="All recipes" value={String(recipes.length)} />
          <OverviewCard label="Dinners" value={String(categoryCounts.Dinner)} />
          <OverviewCard label="Lunches" value={String(categoryCounts.Lunch)} />
          <OverviewCard label="Showing now" value={String(filteredRecipes.length)} />
        </div>

        <div className="mb-5 space-y-4 rounded-[24px] border border-rose-100 bg-rose-50/60 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <label className="block flex-1">
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">
                Search recipes
              </span>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by recipe name or tag"
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
              Meal type
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
        </div>

        <div className="space-y-5">
          {recipeCategories.map((category) => {
            const groupedRecipes = filteredRecipes.filter((recipe) => recipe.category === category);

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
                        className="scroll-mt-6 rounded-[20px] border border-white bg-white p-4"
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
                                <h4 className="text-2xl font-semibold text-stone-900">
                                  {recipe.title}
                                </h4>
                                <p className="mt-2 text-lg leading-8 text-stone-700">
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
                                  <FilterChip label={recipe.category} />
                                  {recipe.prepTime ? <FilterChip label={`Prep ${recipe.prepTime}`} /> : null}
                                  {recipe.serves ? <FilterChip label={`Serves ${recipe.serves}`} /> : null}
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
                            {recipe.ingredients?.length ? (
                              <div className="mt-4 rounded-[18px] border border-rose-100 bg-rose-50/60 p-4">
                                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-rose-600">
                                  Ingredient snapshot
                                </p>
                                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                                  {recipe.ingredients.slice(0, 6).map((ingredient) => (
                                    <li
                                      key={`${recipe.id}-${ingredient.item}`}
                                      className="flex items-center justify-between gap-3 rounded-[14px] bg-white px-3 py-2 text-sm text-stone-800"
                                    >
                                      <span>{ingredient.item}</span>
                                      <span className="font-medium text-stone-600">{ingredient.amount}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                            {recipe.instructions?.length ? (
                              <div className="mt-4 rounded-[18px] border border-stone-200 bg-stone-50/70 p-4">
                                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-600">
                                  Quick method
                                </p>
                                <ol className="mt-3 space-y-2 text-base leading-7 text-stone-700">
                                  {recipe.instructions.map((step, index) => (
                                    <li key={`${recipe.id}-step-${index}`} className="flex gap-3">
                                      <span className="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-white text-sm font-semibold text-rose-600">
                                        {index + 1}
                                      </span>
                                      <span>{step}</span>
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            ) : null}
                            <div className="mt-4 flex flex-wrap gap-3">
                              <a
                                href={recipe.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-12 items-center rounded-full bg-rose-500 px-5 text-base font-semibold text-white transition hover:bg-rose-600"
                              >
                                Open recipe
                              </a>
                            </div>
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
              No recipes match this search yet. Try a broader word or switch filters.
            </div>
          ) : null}
        </div>
      </section>

      <section id="favourites" className="rounded-[30px] border border-rose-200 bg-white p-5 shadow-sm shadow-rose-100/40 sm:p-6 scroll-mt-6">
        <div className="mb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-600">
            Section 2
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-stone-900 sm:text-4xl">
            Favourites
          </h2>
          <p className="mt-2 text-lg leading-8 text-stone-700">
            Save recipe cards you want to come back to quickly.
          </p>
        </div>

        {favouriteRecipes.length ? (
          <div className="space-y-3">
            {favouriteRecipes.map((recipe) => (
              <article key={recipe.id} className="rounded-[20px] border border-rose-100 bg-rose-50/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-stone-900">{recipe.title}</h3>
                    <p className="mt-1 text-base text-stone-700">{recipe.category}</p>
                  </div>
                  <span className="text-2xl text-rose-500">♥</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  <a
                    href={`#recipe-${recipe.id}`}
                    className="inline-flex min-h-12 items-center rounded-full border border-rose-200 bg-white px-4 text-base font-semibold text-rose-700 transition hover:bg-rose-50"
                  >
                    Find in browse
                  </a>
                  <a
                    href={recipe.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 items-center rounded-full bg-rose-500 px-4 text-base font-semibold text-white transition hover:bg-rose-600"
                  >
                    Open recipe
                  </a>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[22px] border border-dashed border-rose-200 bg-rose-50/40 p-4 text-lg text-stone-700">
            No favourites yet. Save a recipe and it will appear here.
          </div>
        )}
      </section>

      <section id="recipe-sections" className="rounded-[30px] border border-rose-200 bg-white p-5 shadow-sm shadow-rose-100/40 sm:p-6 scroll-mt-6">
        <div className="mb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-600">
            Section 3
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-stone-900 sm:text-4xl">
            Recipe sections
          </h2>
          <p className="mt-2 text-lg leading-8 text-stone-700">
            A simple overview of the three active areas on the site right now.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <OverviewCard label="Browse" value="Search + filter" />
          <OverviewCard label="Favourites" value={String(favouriteRecipes.length)} />
          <OverviewCard label="Recipe library" value={String(recipes.length)} />
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

function OverviewCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-rose-100 bg-rose-50/60 p-4">
      <p className="text-sm uppercase tracking-[0.16em] text-rose-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-stone-900">{value}</p>
    </div>
  );
}
