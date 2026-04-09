"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { RecipeCategory, RecipeLibraryEntry } from "@/data/recipes";

const STORAGE_KEY = "princess-planner-favourites";
const recipeCategories: RecipeCategory[] = ["Main", "Side", "Snack"];

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
        setFavourites(
          Object.fromEntries(recipes.map((recipe) => [recipe.id, recipe.favourite])),
        );
      }
    } catch {
      setFavourites(
        Object.fromEntries(recipes.map((recipe) => [recipe.id, recipe.favourite])),
      );
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
  const plannedRecipes = useMemo(
    () => recipes.filter((recipe) => recipe.plannedDays.length > 0),
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

  return (
    <section id="all-recipes" className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] scroll-mt-6">
      <section className="rounded-[30px] border border-rose-200 bg-white p-5 shadow-sm shadow-rose-100/40 sm:p-6">
        <div className="mb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-600">
            All recipes
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-stone-900 sm:text-4xl">
            Browse by type
          </h2>
          <p className="mt-2 text-lg leading-8 text-stone-700">
            Full Wild Rose library with imported photos, grouped into mains, sides, and snacks.
          </p>
        </div>

        <div className="mb-5 space-y-4 rounded-[24px] border border-rose-100 bg-rose-50/60 p-4 sm:p-5">
          <label className="block">
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">
              Search recipes
            </span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, tag, or description"
              className="mt-2 min-h-14 w-full rounded-[18px] border border-rose-200 bg-white px-4 text-lg text-stone-900 outline-none ring-0 placeholder:text-stone-400 focus:border-rose-400"
            />
          </label>

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
                { key: "all", label: `All ${filteredRecipes.length ? "matches" : "recipes"}` },
                { key: "planned", label: "In planner" },
                { key: "favourites", label: "My favourites" },
              ].map((option) => {
                const active = plannerFilter === option.key;

                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setPlannerFilter(option.key as "all" | "planned" | "favourites")}
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
          <div className="mb-5 rounded-[24px] border border-rose-100 bg-rose-50/60 p-4 sm:p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">
              In the current plan
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {plannedRecipes.map((recipe) => (
                <span
                  key={recipe.id}
                  className="rounded-full bg-white px-3 py-2 text-base font-medium text-stone-800"
                >
                  {recipe.title} ({recipe.plannedDays.join(", ")})
                </span>
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
                  <h3 className="text-2xl font-semibold text-stone-900">{category}s</h3>
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
                                  {recipe.description || "Imported recipe details are still being expanded."}
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
                                {recipe.plannedDays.length ? (
                                  <p className="mt-3 text-base font-medium text-stone-600">
                                    Planned for: {recipe.plannedDays.join(", ")}
                                  </p>
                                ) : null}
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
                              Open recipe
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
              No recipes match this search yet. Try a broader word or switch filters.
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-[30px] border border-rose-200 bg-white p-5 shadow-sm shadow-rose-100/40 sm:p-6">
        <div className="mb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-600">
            My favourites
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-stone-900 sm:text-4xl">
            Quick picks
          </h2>
          <p className="mt-2 text-lg leading-8 text-stone-700">
            Tap the favourite button on any recipe to tag it here for faster planning later.
          </p>
        </div>

        <div className="space-y-3">
          {favouriteRecipes.length ? (
            favouriteRecipes.map((recipe) => (
              <article
                id={`favourite-${recipe.id}`}
                key={recipe.id}
                className="scroll-mt-6 rounded-[22px] border border-rose-100 bg-rose-50/60 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-stone-900">{recipe.title}</h3>
                    <p className="mt-1 text-lg text-stone-700">
                      {recipe.category}
                      {recipe.plannedDays.length ? ` • ${recipe.plannedDays.join(", ")}` : ""}
                    </p>
                  </div>
                  <span className="text-2xl text-rose-500">♥</span>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[22px] border border-dashed border-rose-200 bg-rose-50/40 p-4 text-lg text-stone-700">
              No favourites yet. Mark a recipe you love and it will appear here.
            </div>
          )}
        </div>
      </section>
    </section>
  );
}
