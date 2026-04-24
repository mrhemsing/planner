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
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
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
  const sortedRecipes = useMemo(
    () => [...(activeSection?.recipes ?? [])].sort((a, b) => a.title.localeCompare(b.title)),
    [activeSection],
  );

  const filteredRecipes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return sortedRecipes.filter((recipe) => {
      if (activeFilter !== "all" && getRecipeCategory(recipe) !== activeFilter) {
        return false;
      }

      if (!query) return true;

      const haystack = [recipe.title, recipe.description, recipe.tags.join(" ")].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [activeFilter, searchQuery, sortedRecipes]);

  useEffect(() => {
    if (!filteredRecipes.length) return;
    if (!filteredRecipes.some((recipe) => recipe.id === selectedRecipeId)) {
      setSelectedRecipeId(filteredRecipes[0].id);
    }
  }, [filteredRecipes, selectedRecipeId]);

  const selectedRecipe =
    filteredRecipes.find((recipe) => recipe.id === selectedRecipeId) ?? filteredRecipes[0] ?? null;
  const recipeCount = filteredRecipes.length;

  const filters = [
    { id: "all", label: `All (${sortedRecipes.length})` },
    { id: "meat", label: `Meat (${sortedRecipes.filter((recipe) => getRecipeCategory(recipe) === "meat").length})` },
    { id: "fish", label: `Fish (${sortedRecipes.filter((recipe) => getRecipeCategory(recipe) === "fish").length})` },
    { id: "vegetarian", label: `Vegetarian (${sortedRecipes.filter((recipe) => getRecipeCategory(recipe) === "vegetarian").length})` },
  ];

  const toggleFavourite = (id: string) => {
    setFavourites((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  return (
    <section className="grid gap-6">
      <div className="mt-[30px] px-1 py-1 sm:px-2">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">Healthy Weeknight Dinners</h1>
              <span className="rounded-full bg-rose-50 px-3 py-1 text-sm font-semibold text-rose-700">{recipeCount}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => {
                const isActive = filter.id === activeFilter;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setActiveFilter(filter.id)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      isActive ? "bg-rose-500 text-white" : "bg-white text-rose-700 hover:bg-rose-50"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>

            <label className="block sm:min-w-[260px] sm:flex-1 sm:max-w-sm">
              <span className="sr-only">Search recipes</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search recipes..."
                className="min-h-11 w-full rounded-full border border-black/10 bg-white px-4 text-sm text-stone-900 outline-none placeholder:text-stone-400 focus:border-rose-500"
              />
            </label>
          </div>
        </div>
      </div>

      {activeSection ? (
        <section
          key={activeSection.id}
          id={activeSection.id}
          className="rounded-[30px] border border-rose-200 bg-[#F1331E] p-5 shadow-sm shadow-rose-100/40 sm:p-6"
        >
          <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div className="rounded-[24px] border border-rose-100 bg-white p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
              <div className="lg:hidden">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold uppercase tracking-[0.16em] text-rose-600">
                    Recipe menu
                  </span>
                  <select
                    value={selectedRecipe?.id ?? ""}
                    onChange={(event) => setSelectedRecipeId(event.target.value)}
                    className="min-h-12 w-full rounded-[18px] border border-rose-300 bg-white px-4 text-base font-medium text-stone-900 outline-none focus:border-rose-500"
                  >
                    {filteredRecipes.map((recipe) => (
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
                {filteredRecipes.map((recipe) => {
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

            <article className="rounded-[24px] border border-stone-200 bg-white p-4 sm:p-5">
              {!selectedRecipe ? (
                <div className="rounded-[18px] border border-dashed border-rose-200 bg-white p-6 text-stone-600">
                  No recipes match that filter yet.
                </div>
              ) : (
                <>
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
                    <div className="mt-5 rounded-[18px] border border-stone-200 bg-white p-4">
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-700">Instructions</p>
                      <ol className="mt-3 space-y-3 text-base leading-7 text-stone-700">
                        {selectedRecipe.instructions.map((step, index) => (
                          <li key={`${selectedRecipe.id}-step-${index}`} className="flex gap-3">
                            <span className="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-rose-50 text-sm font-semibold text-rose-600">
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
                      className="inline-flex min-h-12 items-center rounded-full bg-black px-5 text-base font-semibold !text-white transition hover:bg-stone-800"
                    >
                      Open recipe on NYT Cooking
                    </a>
                  </div>
                </>
              )}
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

function getRecipeCategory(recipe: RecipeLibraryEntry) {
  const text = [recipe.title, recipe.description, recipe.tags.join(" ")].join(" ").toLowerCase();

  if (/(salmon|shrimp|cod|halibut|tuna|sardine|sardines|fish|swordfish|seafood)/.test(text)) {
    return "fish";
  }

  if (/(chicken|pork|beef|turkey|meatball|meatballs|sausage|ham|bacon)/.test(text)) {
    return "meat";
  }

  return "vegetarian";
}

