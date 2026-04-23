"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { RecipeLibraryEntry } from "@/data/recipes";

const STORAGE_KEY = "princess-planner-favourites";

type RecipeSection = {
  id: string;
  title: string;
  description: string;
  recipes: RecipeLibraryEntry[];
};

export function RecipeBrowser({ sections }: { sections: RecipeSection[] }) {
  const [favourites, setFavourites] = useState<Record<string, boolean>>({});
  const [activeSectionId] = useState<string>(sections[0]?.id ?? "");
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(sections[0]?.recipes[0]?.id ?? "");
  const [hydrated, setHydrated] = useState(false);

  const allRecipes = useMemo(() => sections.flatMap((section) => section.recipes), [sections]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFavourites(JSON.parse(stored) as Record<string, boolean>);
      } else {
        setFavourites(Object.fromEntries(allRecipes.map((recipe) => [recipe.id, recipe.favourite])));
      }
    } catch {
      setFavourites(Object.fromEntries(allRecipes.map((recipe) => [recipe.id, recipe.favourite])));
    } finally {
      setHydrated(true);
    }
  }, [allRecipes]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favourites));
  }, [favourites, hydrated]);

  const activeSection = sections.find((section) => section.id === activeSectionId) ?? sections[0];
  const selectedRecipe =
    activeSection?.recipes.find((recipe) => recipe.id === selectedRecipeId) ?? activeSection?.recipes[0] ?? null;
  const recipeCount = activeSection?.recipes.length ?? allRecipes.length;
  const hasFullInstructions = Boolean(selectedRecipe?.instructions?.length);

  const toggleFavourite = (id: string) => {
    setFavourites((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  return (
    <section className="grid gap-6">
      <div className="rounded-[30px] border border-rose-200 bg-white px-5 py-4 shadow-sm shadow-rose-100/40 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">Healthy Weeknight Dinners</h1>
            <span className="rounded-full bg-rose-50 px-3 py-1 text-sm font-semibold text-rose-700">{recipeCount}</span>
          </div>
          <button
            type="button"
            className="rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            My Favourites
          </button>
        </div>
      </div>

      {activeSection && selectedRecipe ? (
        <section
          key={activeSection.id}
          id={activeSection.id}
          className="rounded-[30px] border border-rose-200 bg-white p-5 shadow-sm shadow-rose-100/40 sm:p-6"
        >
          <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div className="rounded-[24px] border border-rose-100 bg-rose-50/60 p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
              <div className="lg:hidden">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold uppercase tracking-[0.16em] text-rose-600">
                    Recipe menu
                  </span>
                  <select
                    value={selectedRecipe.id}
                    onChange={(event) => setSelectedRecipeId(event.target.value)}
                    className="min-h-12 w-full rounded-[18px] border border-rose-300 bg-white px-4 text-base font-medium text-stone-900 outline-none focus:border-rose-500"
                  >
                    {activeSection.recipes.map((recipe) => (
                      <option key={`${activeSection.id}-option-${recipe.id}`} value={recipe.id}>
                        {recipe.title}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <p className="hidden text-sm font-semibold uppercase tracking-[0.16em] text-rose-600 lg:block">
                Recipe list
              </p>

              <div className="mt-3 hidden flex-col gap-2 lg:flex">
                {activeSection.recipes.map((recipe) => {
                  const isSelected = selectedRecipe.id === recipe.id;
                  const isFavourite = Boolean(favourites[recipe.id]);

                  return (
                    <button
                      key={`${activeSection.id}-jump-${recipe.id}`}
                      type="button"
                      onClick={() => setSelectedRecipeId(recipe.id)}
                      className={`block w-full rounded-[18px] border px-4 py-3 text-left text-base font-medium transition ${
                        isSelected ? "border-rose-600 bg-rose-500 text-white" : "border-transparent bg-white text-stone-800 hover:bg-rose-100"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="block text-left leading-6">{recipe.title}</span>
                        <div className="flex items-center gap-2">{isFavourite ? <span className="text-sm">♥</span> : null}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <article className="rounded-[24px] border border-stone-200 bg-stone-50/70 p-4 sm:p-5">
              <div className="relative h-56 w-full overflow-hidden rounded-[20px] bg-rose-50 sm:h-72">
                <Image
                  src={selectedRecipe.imageUrl}
                  alt={selectedRecipe.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 700px"
                />
              </div>

              <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="text-3xl font-semibold text-stone-900 sm:text-4xl">{selectedRecipe.title}</h3>
                  <p className="mt-3 text-lg leading-8 text-stone-700 sm:text-xl sm:leading-9">
                    {selectedRecipe.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <FilterChip label={selectedRecipe.category} />
                    <FilterChip label={selectedRecipe.sourceName} />
                    {selectedRecipe.prepTime ? <FilterChip label={`Prep ${selectedRecipe.prepTime}`} /> : null}
                    {selectedRecipe.serves ? <FilterChip label={`Serves ${selectedRecipe.serves}`} /> : null}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleFavourite(selectedRecipe.id)}
                  className={`inline-flex min-h-12 items-center whitespace-nowrap rounded-full px-5 text-base font-semibold transition ${
                    favourites[selectedRecipe.id] ? "bg-rose-100 text-rose-700" : "bg-white text-stone-600"
                  }`}
                  aria-pressed={Boolean(favourites[selectedRecipe.id])}
                >
                  {favourites[selectedRecipe.id] ? "★ Favourite" : "☆ Favourite"}
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {selectedRecipe.tags.map((tag) => (
                  <span
                    key={`${selectedRecipe.id}-${tag}`}
                    className="rounded-full bg-rose-50 px-3 py-1 text-sm font-medium text-rose-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {selectedRecipe.ingredients?.length ? (
                <div className="mt-5 rounded-[18px] border border-rose-100 bg-rose-50/60 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-rose-600">
                    Ingredients
                  </p>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {selectedRecipe.ingredients.map((ingredient, index) => (
                      <li
                        key={`${selectedRecipe.id}-${ingredient.item}-${index}`}
                        className="flex items-center gap-3 rounded-[14px] bg-white px-3 py-2 text-sm text-stone-800"
                      >
                        <span className="font-medium text-stone-600">{ingredient.amount}</span>
                        <span>{ingredient.item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {selectedRecipe.instructions?.length ? (
                <div
                  className={`mt-5 rounded-[18px] p-4 ${
                    hasFullInstructions ? "border border-stone-200 bg-white" : "border border-amber-200 bg-amber-50/80"
                  }`}
                >
                  <p
                    className={`text-sm font-semibold uppercase tracking-[0.16em] ${
                      hasFullInstructions ? "text-stone-700" : "text-amber-800"
                    }`}
                  >
                    {hasFullInstructions ? "Instructions" : "Planner notes"}
                  </p>
                  <ol className="mt-3 space-y-3 text-base leading-7 text-stone-700">
                    {selectedRecipe.instructions.map((step, index) => (
                      <li key={`${selectedRecipe.id}-step-${index}`} className="flex gap-3">
                        <span
                          className={`mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full text-sm font-semibold ${
                            hasFullInstructions ? "bg-rose-50 text-rose-600" : "bg-white text-amber-700"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={selectedRecipe.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center rounded-full bg-rose-500 px-5 text-base font-semibold text-white transition hover:bg-rose-600"
                >
                  Open recipe on NYT Cooking
                </a>
              </div>
            </article>
          </div>
        </section>
      ) : null}
    </section>
  );
}

function FilterChip({ label }: { label: string }) {
  return <span className="rounded-full bg-white px-3 py-2 text-base font-medium text-stone-800">{label}</span>;
}

