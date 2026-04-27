"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { TouchEvent } from "react";
import type { RecipeLibraryEntry } from "@/data/recipes";

const STORAGE_KEY = "princess-planner-favourites";
const INGREDIENTS_STORAGE_KEY = "princess-planner-ingredient-checks";
const INGREDIENT_STRIKE_CLASSES = [
  "hand-strike hand-strike-1",
  "hand-strike hand-strike-2",
  "hand-strike hand-strike-3",
  "hand-strike hand-strike-4",
];
const DAILY_PICK_REFRESH_SALT = "2026-04-27-refresh-2";
const VEGETARIAN_CATEGORY_OVERRIDES = new Set([
  "chickpea-noodle-soup",
  "i-cant-believe-its-not-chicken-super-savory-grated-tofu",
]);

type RecipeSection = {
  id: string;
  title: string;
  description: string;
  recipes: RecipeLibraryEntry[];
};

export function RecipeBrowser({ sections }: { sections: RecipeSection[] }) {
  const allRecipes = useMemo(() => sections.flatMap((section) => section.recipes), [sections]);
  const defaultFavourites = useMemo(
    () => Object.fromEntries(allRecipes.map((recipe) => [recipe.id, recipe.favourite])),
    [allRecipes],
  );

  const [favourites, setFavourites] = useState<Record<string, boolean>>(defaultFavourites);
  const [ingredientChecks, setIngredientChecks] = useState<Record<string, boolean>>({});
  const [activeSectionId] = useState<string>(sections[0]?.id ?? "");
  const dailyDinnerPickId = useMemo(() => getDailyDinnerPickId(sections[0]?.recipes ?? []), [sections]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(dailyDinnerPickId);
  const [hasSyncedRecipeFromUrl, setHasSyncedRecipeFromUrl] = useState(false);
  const [selectedRecipeFromUrl, setSelectedRecipeFromUrl] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const filterSwipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const desktopRecipeListButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const recipeSheetScrollRef = useRef<HTMLDivElement | null>(null);
  const recipeSheetScrollPositionsRef = useRef<Record<string, number>>({});
  const [hydrated, setHydrated] = useState(false);
  const [isRecipeSheetOpen, setRecipeSheetOpen] = useState(false);
  const [recipeSearchQuery, setRecipeSearchQuery] = useState("");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFavourites(JSON.parse(stored) as Record<string, boolean>);
      } else {
        setFavourites(defaultFavourites);
      }
    } catch {
      setFavourites(defaultFavourites);
    } finally {
      setHydrated(true);
    }
  }, [defaultFavourites]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(INGREDIENTS_STORAGE_KEY);
      if (stored) {
        setIngredientChecks(JSON.parse(stored) as Record<string, boolean>);
      }
    } catch {
      setIngredientChecks({});
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favourites));
  }, [favourites, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(INGREDIENTS_STORAGE_KEY, JSON.stringify(ingredientChecks));
  }, [ingredientChecks, hydrated]);

  useEffect(() => {
    const syncFromUrl = () => {
      const recipeIdFromUrl = new URLSearchParams(window.location.search).get("recipe");
      if (!recipeIdFromUrl) return;

      const matchingRecipe = allRecipes.find((recipe) => recipe.id === recipeIdFromUrl);
      if (matchingRecipe) {
        setSelectedRecipeId(matchingRecipe.id);
        setSelectedRecipeFromUrl(true);
      }

      setHasSyncedRecipeFromUrl(true);
    };

    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [allRecipes]);

  const activeSection = sections.find((section) => section.id === activeSectionId) ?? sections[0];
  const sortedRecipes = useMemo(
    () => [...(activeSection?.recipes ?? [])].sort((a, b) => a.title.localeCompare(b.title)),
    [activeSection],
  );

  const filteredRecipes = useMemo(() => {
    return sortedRecipes.filter((recipe) => {
      if (activeFilter === "favourites") {
        if (!favourites[recipe.id]) {
          return false;
        }
      } else if (activeFilter === "quick") {
        if (!isQuickPrepRecipe(recipe)) {
          return false;
        }
      } else if (activeFilter !== "all" && getRecipeCategory(recipe) !== activeFilter) {
        return false;
      }

      return true;
    });
  }, [activeFilter, favourites, sortedRecipes]);

  const recipeSheetRecipes = useMemo(() => {
    const normalizedQuery = recipeSearchQuery.trim().toLowerCase();
    if (!normalizedQuery) return filteredRecipes;

    return filteredRecipes.filter((recipe) => {
      const haystack = [recipe.title, recipe.description, recipe.prepTime, recipe.serves]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [filteredRecipes, recipeSearchQuery]);

  const dailyFilteredPickId = useMemo(
    () => (activeFilter === "favourites" ? "" : getDailyDinnerPickId(filteredRecipes)),
    [activeFilter, filteredRecipes],
  );

  useEffect(() => {
    if (!hasSyncedRecipeFromUrl) return;

    if (selectedRecipeFromUrl && filteredRecipes.some((recipe) => recipe.id === selectedRecipeId)) {
      return;
    }

    if (activeFilter === "favourites") {
      setSelectedRecipeId(filteredRecipes[0]?.id ?? "");
      return;
    }

    if (!dailyFilteredPickId) return;
    setSelectedRecipeId(dailyFilteredPickId);
  }, [activeFilter, dailyFilteredPickId, filteredRecipes, hasSyncedRecipeFromUrl, selectedRecipeFromUrl, selectedRecipeId]);

  useEffect(() => {
    if (!selectedRecipeId) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("recipe") === selectedRecipeId) return;

    params.set("recipe", selectedRecipeId);
    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    window.history.replaceState(null, "", nextUrl);
  }, [selectedRecipeId]);

  const selectedRecipe =
    filteredRecipes.find((recipe) => recipe.id === selectedRecipeId) ??
    filteredRecipes.find((recipe) => recipe.id === dailyFilteredPickId) ??
    filteredRecipes[0] ??
    null;
  const isShowingDailyPick = Boolean(selectedRecipe && selectedRecipe.id === dailyFilteredPickId);
  const favouriteCount = sortedRecipes.filter((recipe) => favourites[recipe.id]).length;
  const showFavouritesFilter = hydrated && favouriteCount > 0;

  const filters = [
    {
      id: "all",
      label: `All (${sortedRecipes.length})`,
      mobileLabel: `🍽️ ${sortedRecipes.length}`,
      ariaLabel: "All recipes",
      browseLabel: "Browse all recipes",
    },
    ...(showFavouritesFilter
      ? [
          {
            id: "favourites",
            label: `Favourites (${favouriteCount})`,
            mobileLabel: `❤️ ${favouriteCount}`,
            ariaLabel: "Favourite recipes",
            browseLabel: "Browse all fav recipes",
          },
        ]
      : []),
    {
      id: "quick",
      label: `⚡ 30 min (${sortedRecipes.filter(isQuickPrepRecipe).length})`,
      mobileLabel: `⚡ ${sortedRecipes.filter(isQuickPrepRecipe).length}`,
      ariaLabel: "30 minutes or less prep",
      browseLabel: "Browse all 30 min recipes",
    },
    {
      id: "meat",
      label: `🥩 Meat (${sortedRecipes.filter((recipe) => getRecipeCategory(recipe) === "meat").length})`,
      mobileLabel: `🥩 ${sortedRecipes.filter((recipe) => getRecipeCategory(recipe) === "meat").length}`,
      ariaLabel: "Meat recipes",
      browseLabel: "Browse all meat recipes",
    },
    {
      id: "fish",
      label: `🐟 Fish (${sortedRecipes.filter((recipe) => getRecipeCategory(recipe) === "fish").length})`,
      mobileLabel: `🐟 ${sortedRecipes.filter((recipe) => getRecipeCategory(recipe) === "fish").length}`,
      ariaLabel: "Fish recipes",
      browseLabel: "Browse all fish recipes",
    },
    {
      id: "vegetarian",
      label: `🥦 Vegetarian (${sortedRecipes.filter((recipe) => getRecipeCategory(recipe) === "vegetarian").length})`,
      mobileLabel: `🥦 ${sortedRecipes.filter((recipe) => getRecipeCategory(recipe) === "vegetarian").length}`,
      ariaLabel: "Vegetarian recipes",
      browseLabel: "Browse all veg recipes",
    },
  ];
  const activeFilterDetails = filters.find((filter) => filter.id === activeFilter) ?? filters[0];
  const dailyPickTitle = getDailyPickTitle(activeFilter);
  const mobileDailyPickTitle = activeFilter === "vegetarian" ? "TODAY'S VEG PICK" : dailyPickTitle;
  const mobileTopFilters = filters.filter((filter) => filter.id !== "favourites");

  const moveActiveFilter = (direction: 1 | -1) => {
    const filterOrder = mobileTopFilters.length ? mobileTopFilters : filters;
    if (!filterOrder.length) return;

    const currentIndex = Math.max(
      0,
      filterOrder.findIndex((filter) => filter.id === activeFilter),
    );
    const nextIndex = (currentIndex + direction + filterOrder.length) % filterOrder.length;
    setSelectedRecipeFromUrl(false);
    setActiveFilter(filterOrder[nextIndex].id);
  };

  const handleFilterSwipeStart = (event: TouchEvent<HTMLElement>) => {
    if (window.innerWidth >= 640 || isRecipeSheetOpen) return;

    const touch = event.touches[0];
    filterSwipeStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleFilterSwipeEnd = (event: TouchEvent<HTMLElement>) => {
    if (window.innerWidth >= 640 || isRecipeSheetOpen) return;

    const start = filterSwipeStartRef.current;
    filterSwipeStartRef.current = null;
    const touch = event.changedTouches[0];
    if (!start || !touch) return;

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY) * 1.3) return;

    moveActiveFilter(deltaX < 0 ? 1 : -1);
  };

  useEffect(() => {
    if (activeFilter === "favourites" && !showFavouritesFilter) {
      setActiveFilter("all");
    }
  }, [activeFilter, showFavouritesFilter]);

  useEffect(() => {
    if (!isRecipeSheetOpen) return;

    const frame = window.requestAnimationFrame(() => {
      const sheet = recipeSheetScrollRef.current;
      if (!sheet) return;

      sheet.scrollTop = recipeSheetScrollPositionsRef.current[activeFilter] ?? 0;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeFilter, isRecipeSheetOpen]);

  useEffect(() => {
    setRecipeSearchQuery("");
  }, [activeFilter]);

  const toggleFavourite = (id: string) => {
    setFavourites((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  const toggleIngredientCheck = (key: string) => {
    setIngredientChecks((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const selectRecipe = (id: string) => {
    setSelectedRecipeFromUrl(true);
    setSelectedRecipeId(id);
    setRecipeSearchQuery("");
    setRecipeSheetOpen(false);
  };

  const focusDesktopRecipeResult = (index: number) => {
    const recipe = recipeSheetRecipes[index];
    if (!recipe) return;

    setSelectedRecipeFromUrl(true);
    setSelectedRecipeId(recipe.id);
    window.requestAnimationFrame(() => {
      desktopRecipeListButtonRefs.current[recipe.id]?.focus();
    });
  };

  const returnHome = () => {
    setSelectedRecipeFromUrl(false);
    setActiveFilter("all");
    setSelectedRecipeId(dailyDinnerPickId);
    setRecipeSearchQuery("");
    setRecipeSheetOpen(false);
    window.history.replaceState(null, "", window.location.pathname);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderFilterButton = (filter: (typeof filters)[number]) => {
    const isActive = filter.id === activeFilter;

    return (
      <button
        key={filter.id}
        type="button"
        onClick={() => {
          setSelectedRecipeFromUrl(false);
          setActiveFilter(filter.id);
        }}
        aria-label={filter.ariaLabel}
        title={filter.ariaLabel}
        className={`category-chip rounded-2xl border bg-white px-3 py-2 text-sm font-semibold sm:px-4 ${
          isActive ? "category-chip-active" : "border-transparent text-amber-800 hover:text-amber-900"
        }`}
      >
        <span className="sm:hidden">{filter.mobileLabel}</span>
        <span className="hidden sm:inline">{filter.label}</span>
      </button>
    );
  };

  return (
    <section className="grid gap-6">
      <div className="mt-4 px-1 py-1 sm:mt-[30px] sm:px-2">
        <div className="flex flex-col gap-5 sm:gap-4">
          <div className="flex items-center justify-between gap-4">
            <button type="button" onClick={returnHome} className="recipe-tap-card flex items-center gap-3 text-left" aria-label="Return to homepage">
              <Image
                src="/recipe-images/planner-logo-20260426.png"
                alt="Planner logo"
                width={75}
                height={75}
                className="h-[75px] w-[75px] object-contain lg:h-[83px] lg:w-[83px]"
              />
              <h1 className="mt-0.5 text-3xl font-semibold leading-[1.24] tracking-tight text-white sm:text-3xl">
                <span className="inline-block rounded-md bg-black px-1.5 py-0.5 text-[0.7em] uppercase text-stone-200 sm:inline-block lg:inline-block">NYT COOKING</span>
                <span className="block font-bold text-white [font-family:Georgia,serif] sm:inline lg:block">Healthy Dinners</span>
              </h1>
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div
              className="flex flex-nowrap gap-2 overflow-x-auto pb-1 sm:hidden"
              onTouchStart={handleFilterSwipeStart}
              onTouchEnd={handleFilterSwipeEnd}
            >
              {mobileTopFilters.map(renderFilterButton)}
            </div>
            <div className="hidden flex-wrap gap-2 sm:flex">
              {filters.map(renderFilterButton)}
            </div>

            <div className="flex gap-2 sm:hidden">
              {showFavouritesFilter ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRecipeFromUrl(false);
                    setActiveFilter("favourites");
                  }}
                  aria-label="Favourite recipes"
                  title="Favourite recipes"
                  className={`category-chip min-h-11 shrink-0 rounded-2xl border bg-white px-4 py-2 text-sm font-semibold ${
                    activeFilter === "favourites" ? "category-chip-active" : "border-transparent text-amber-800 hover:text-amber-900"
                  }`}
                >
                  <span aria-hidden="true">❤️</span>
                  <span className="ml-1">{favouriteCount}</span>
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setRecipeSheetOpen(true)}
                className="recipe-tap-card flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-amber-700 bg-amber-500 px-4 text-center text-sm font-bold uppercase tracking-[0.08em] text-white shadow-[0_8px_18px_rgba(146,64,14,0.22)] outline-none transition hover:bg-amber-600 focus:border-amber-900 active:scale-[0.98]"
              >
                <span>{activeFilterDetails.browseLabel}</span>
                <span aria-hidden="true">＋</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {activeSection ? (
        <section
          key={activeSection.id}
          id={activeSection.id}
          className="rounded-[24px] border border-amber-200 bg-white p-5 shadow-sm shadow-amber-100/40 sm:p-6"
        >
          <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div className={`${isShowingDailyPick ? "" : "hidden lg:block"} lg:rounded-[20px] lg:border lg:border-stone-300 lg:bg-white lg:p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto`}>
              {isShowingDailyPick ? (
                <div className="lg:hidden">
                  <p className="flex items-center gap-2 rounded-[16px] border border-white bg-white px-4 py-3 text-base font-semibold text-stone-900 shadow-sm">
                    <span aria-hidden="true">🏅</span>
                    <span>{mobileDailyPickTitle}</span>
                  </p>
                </div>
              ) : null}

              <div className="hidden lg:block">
                <label className="sr-only" htmlFor="desktop-recipe-search">
                  Search recipes
                </label>
                <input
                  id="desktop-recipe-search"
                  type="text"
                  value={recipeSearchQuery}
                  onChange={(event) => setRecipeSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
                    if (!recipeSheetRecipes.length) return;

                    event.preventDefault();
                    focusDesktopRecipeResult(event.key === "ArrowDown" ? 0 : recipeSheetRecipes.length - 1);
                  }}
                  placeholder="Search recipes"
                  autoComplete="off"
                  className="mb-[18px] w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-base text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-amber-500 focus:bg-white"
                />
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">
                  Recipe list
                </p>
              </div>

              <div className="mt-3 hidden flex-col gap-2 lg:flex">
                {recipeSheetRecipes.map((recipe, index) => {
                  const isSelected = selectedRecipe.id === recipe.id;
                  const altRowClass = index % 2 === 0 ? "bg-stone-50" : "bg-amber-50/40";

                  return (
                    <button
                      key={`${activeSection.id}-jump-${recipe.id}`}
                      ref={(element) => {
                        desktopRecipeListButtonRefs.current[recipe.id] = element;
                      }}
                      type="button"
                      onClick={() => {
                        setSelectedRecipeFromUrl(true);
                        setSelectedRecipeId(recipe.id);
                      }}
                      onKeyDown={(event) => {
                        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

                        event.preventDefault();
                        const direction = event.key === "ArrowDown" ? 1 : -1;
                        const nextIndex = (index + direction + recipeSheetRecipes.length) % recipeSheetRecipes.length;
                        focusDesktopRecipeResult(nextIndex);
                      }}
                      className={`recipe-tap-card block w-full rounded-[16px] border px-4 py-3 text-left text-base font-medium ${
                        isSelected
                          ? "border-amber-600 bg-amber-500 text-white shadow-[0_10px_24px_rgba(217,119,6,0.22)]"
                          : `border-transparent ${altRowClass} text-stone-800 hover:bg-amber-100`
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="block text-left leading-6">{recipe.title}</span>
                        <div className="flex items-center gap-2">
                          {isSelected ? <span className="h-8 w-1 rounded-full bg-white/85" aria-hidden="true" /> : null}
                        </div>
                      </div>
                    </button>
                  );
                })}
                {!recipeSheetRecipes.length ? (
                  <div className="rounded-[16px] border border-dashed border-stone-300 bg-stone-50 px-4 py-5 text-sm text-stone-600">
                    No recipes match “{recipeSearchQuery.trim()}”.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3">
              {isShowingDailyPick ? (
                <div className="hidden min-h-11 items-center gap-2 rounded-2xl border border-white bg-white px-4 text-sm font-semibold text-stone-900 shadow-sm lg:flex">
                  <span aria-hidden="true">🏅</span>
                  <span>{dailyPickTitle}</span>
                </div>
              ) : null}

              <article className="rounded-[20px] border border-stone-300 bg-white p-4 sm:p-5">
                {!selectedRecipe ? (
                  <div className="rounded-[16px] border border-dashed border-amber-200 bg-white p-6 text-stone-600">
                    No recipes match that filter yet.
                  </div>
                ) : (
                  <>
                  <div className="relative h-56 w-full overflow-hidden rounded-[16px] bg-amber-50 sm:h-72">
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
                      <p className="mt-3 line-clamp-5 text-lg leading-8 text-stone-700 sm:line-clamp-none sm:text-xl sm:leading-9">
                        {selectedRecipe.description}
                      </p>
                      <div className="mt-5 sm:hidden">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-col items-start gap-[4px] text-base text-stone-800">
                            {selectedRecipe.prepTime ? <span className="mt-1 block p-0 leading-[1.1]">{`Prep ${selectedRecipe.prepTime}`}</span> : null}
                            {selectedRecipe.serves ? <span className="block m-0 p-0 leading-[1.1]">{`Serves ${selectedRecipe.serves}`}</span> : null}
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleFavourite(selectedRecipe.id)}
                            className={`inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-2xl border px-4 shadow-sm transition active:scale-[0.98] ${
                              favourites[selectedRecipe.id]
                                ? "border-amber-200 bg-amber-100 text-amber-800"
                                : "border-stone-300 bg-white text-stone-700"
                            }`}
                            aria-pressed={Boolean(favourites[selectedRecipe.id])}
                          >
                            {favourites[selectedRecipe.id] ? "Added ❤️" : "Add ❤️"}
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 hidden flex-wrap gap-2 sm:flex">
                        {selectedRecipe.prepTime ? <FilterChip label={`Prep ${selectedRecipe.prepTime}`} /> : null}
                        {selectedRecipe.serves ? <FilterChip label={`Serves ${selectedRecipe.serves}`} /> : null}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleFavourite(selectedRecipe.id)}
                      className={`hidden min-h-12 items-center whitespace-nowrap rounded-2xl px-5 text-base font-semibold transition sm:inline-flex ${
                        favourites[selectedRecipe.id] ? "bg-amber-100 text-amber-800" : "bg-white text-stone-600"
                      }`}
                      aria-pressed={Boolean(favourites[selectedRecipe.id])}
                    >
                      {favourites[selectedRecipe.id] ? "★ Favourite" : "☆ Favourite"}
                    </button>
                  </div>

                  {selectedRecipe.ingredients?.length ? (
                    <div className="mt-5 rounded-[16px] border border-stone-300 bg-amber-50/60 p-4">
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">
                        Ingredients
                      </p>
                      <ul className="mt-3 grid gap-2">
                        {selectedRecipe.ingredients.map((ingredient, index) => {
                          const ingredientKey = `${selectedRecipe.id}-${index}-${ingredient.item}`;
                          const isChecked = Boolean(ingredientChecks[ingredientKey]);
                          const ingredientText = abbreviateIngredientUnits(
                            `${ingredient.amount} ${ingredient.item}`.replace(/\s+/g, " ").trim(),
                          );
                          const strikeClass = INGREDIENT_STRIKE_CLASSES[index % INGREDIENT_STRIKE_CLASSES.length];

                          return (
                            <li key={`${selectedRecipe.id}-${ingredient.item}-${index}`}>
                              <label className="flex cursor-pointer items-start gap-3 rounded-[12px] bg-white px-3 py-2 text-sm text-stone-800">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleIngredientCheck(ingredientKey)}
                                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-stone-300 text-amber-600 focus:ring-amber-500 sm:hidden"
                                />
                                <span className={isChecked ? `opacity-60 ${strikeClass}` : ""}>
                                  {ingredientText}
                                </span>
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : null}

                  {selectedRecipe.instructions?.length ? (
                    <div className="mt-5 rounded-[16px] border border-stone-300 bg-white p-4">
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-700">Instructions</p>
                      <ol className="mt-3 space-y-3 text-base leading-7 text-stone-700">
                        {selectedRecipe.instructions.map((step, index) => (
                          <li key={`${selectedRecipe.id}-step-${index}`} className="flex gap-3">
                            <span className="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-xl bg-amber-50 text-sm font-semibold text-amber-700">
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
                      className="inline-flex min-h-12 items-center rounded-2xl bg-black px-5 text-base font-semibold !text-white transition hover:bg-stone-800"
                    >
                      Open recipe on NYT Cooking
                    </a>
                  </div>
                  </>
                )}
              </article>
            </div>
          </div>
        </section>
      ) : null}

      {isRecipeSheetOpen ? (
        <div className="bottom-sheet-backdrop fixed inset-0 z-50 bg-black/35 sm:hidden" role="dialog" aria-modal="true" aria-label={activeFilterDetails.browseLabel}>
          <div className="bottom-sheet-panel absolute inset-x-0 bottom-0 flex h-[94dvh] flex-col rounded-t-[28px] bg-white shadow-[0_-18px_60px_rgba(0,0,0,0.24)]">
            <div className="sticky top-0 z-10 border-b border-stone-200 bg-white px-5 py-4">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-stone-300" aria-hidden="true" />
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">{activeFilterDetails.browseLabel}</p>
                  <p className="mt-1 text-sm text-stone-500">{recipeSheetRecipes.length} of {filteredRecipes.length} recipes</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRecipeSearchQuery("");
                    setRecipeSheetOpen(false);
                  }}
                  className="recipe-tap-card rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm"
                >
                  Close
                </button>
              </div>
              <div className="mt-4">
                <label className="sr-only" htmlFor="recipe-sheet-search">
                  Search recipes
                </label>
                <input
                  id="recipe-sheet-search"
                  type="text"
                  value={recipeSearchQuery}
                  onChange={(event) => setRecipeSearchQuery(event.target.value)}
                  placeholder="Search recipes"
                  autoComplete="off"
                  className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-base text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-amber-500 focus:bg-white"
                />
              </div>
            </div>

            <div
              ref={recipeSheetScrollRef}
              onScroll={(event) => {
                recipeSheetScrollPositionsRef.current[activeFilter] = event.currentTarget.scrollTop;
              }}
              className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
            >
              <div className="grid gap-3 pb-8">
                {recipeSheetRecipes.map((recipe) => {
                  const isSelected = recipe.id === selectedRecipeId;

                  return (
                    <button
                      key={`${activeSection?.id ?? "recipes"}-sheet-${recipe.id}`}
                      type="button"
                      onClick={() => selectRecipe(recipe.id)}
                      className={`recipe-tap-card grid grid-cols-[72px_1fr] gap-3 rounded-[18px] border p-2 text-left ${
                        isSelected ? "border-amber-500 bg-amber-50" : "border-stone-200 bg-white"
                      }`}
                    >
                      <div className="relative h-[72px] w-[72px] overflow-hidden rounded-[14px] bg-amber-50">
                        <Image src={recipe.imageUrl} alt="" fill className="object-cover" sizes="72px" />
                      </div>
                      <div className="min-w-0 py-1">
                        <p className="line-clamp-2 text-base font-semibold leading-snug text-stone-900">{recipe.title}</p>
                        <p className="mt-1 text-sm text-stone-500">
                          {[recipe.prepTime ? `Prep ${recipe.prepTime}` : null, recipe.serves ? `Serves ${recipe.serves}` : null].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </button>
                  );
                })}
                {!recipeSheetRecipes.length ? (
                  <div className="rounded-[18px] border border-dashed border-stone-300 bg-stone-50 px-4 py-5 text-sm text-stone-600">
                    No recipes match “{recipeSearchQuery.trim()}”.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function FilterChip({ label }: { label: string }) {
  return <span className="rounded-2xl bg-white px-3 py-2 text-base font-medium text-stone-800">{label}</span>;
}

function getDailyPickTitle(activeFilter: string) {
  if (activeFilter === "quick") return "TODAY’S 30 MIN PICK";
  if (activeFilter === "meat") return "TODAY’S MEAT PICK";
  if (activeFilter === "fish") return "TODAY’S FISH PICK";
  if (activeFilter === "vegetarian") return "TODAY’S VEGETARIAN PICK";
  if (activeFilter === "favourites") return "TODAY’S FAVOURITE DINNER PICK";

  return "TODAY’S DINNER PICK";
}

function abbreviateIngredientUnits(text: string) {
  return text
    .replace(/\btablespoons?\b/gi, "tbsp")
    .replace(/\bteaspoons?\b/gi, "tsp");
}

function getRecipeCategory(recipe: RecipeLibraryEntry) {
  if (VEGETARIAN_CATEGORY_OVERRIDES.has(recipe.id)) {
    return "vegetarian";
  }

  const text = [recipe.title, recipe.description, recipe.tags.join(" ")].join(" ").toLowerCase();

  if (/(salmon|shrimp|cod|halibut|tuna|sardine|sardines|fish|swordfish|seafood)/.test(text)) {
    return "fish";
  }

  if (/(chicken|pork|beef|turkey|meatball|meatballs|sausage|ham|bacon|prosciutto)/.test(text)) {
    return "meat";
  }

  return "vegetarian";
}

function isQuickPrepRecipe(recipe: RecipeLibraryEntry) {
  if (!recipe.prepTime) return false;

  const lowerPrepTime = recipe.prepTime.toLowerCase();
  const hourMatch = lowerPrepTime.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr)/);
  const minuteMatch = lowerPrepTime.match(/(\d+)\s*(?:minute|min)/);
  const totalMinutes = (hourMatch ? Number(hourMatch[1]) * 60 : 0) + (minuteMatch ? Number(minuteMatch[1]) : 0);

  return totalMinutes > 0 && totalMinutes <= 30;
}

function getDailyDinnerPickId(recipes: RecipeLibraryEntry[]) {
  if (!recipes.length) return "";

  const sortedIds = [...recipes].map((recipe) => recipe.id).sort();
  const dateKey = getPacificDateKey();
  const hash = hashString(`${dateKey}:${DAILY_PICK_REFRESH_SALT}:${sortedIds.join("|")}`);
  return sortedIds[hash % sortedIds.length];
}

function getPacificDateKey() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const valueFor = (type: string) => parts.find((part) => part.type === type)?.value ?? "";

  return `${valueFor("year")}-${valueFor("month")}-${valueFor("day")}`;
}

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}


