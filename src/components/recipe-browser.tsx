"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
const DAILY_PICK_REFRESH_SALT = "2026-05-01-refresh-1";
const DAILY_PICK_ROTATION_ANCHOR_DATE = "2026-05-01";
const DAILY_PICK_RECENT_HISTORY_DAYS = 21;
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
  const [dailyDateKey, setDailyDateKey] = useState(() => getPacificDateKey());
  const previousDailyDateKeyRef = useRef(dailyDateKey);
  const dailyDinnerPickId = useMemo(
    () => getUniqueDailyPickIdForFilter("all", sections[0]?.recipes ?? [], dailyDateKey, defaultFavourites),
    [dailyDateKey, defaultFavourites, sections],
  );
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
  const [shareCopyStatus, setShareCopyStatus] = useState("");

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
    const refreshDailyDateKey = () => setDailyDateKey(getPacificDateKey());

    refreshDailyDateKey();
    const refreshInterval = window.setInterval(refreshDailyDateKey, 60 * 1000);
    window.addEventListener("focus", refreshDailyDateKey);
    window.addEventListener("pageshow", refreshDailyDateKey);
    document.addEventListener("visibilitychange", refreshDailyDateKey);

    return () => {
      window.clearInterval(refreshInterval);
      window.removeEventListener("focus", refreshDailyDateKey);
      window.removeEventListener("pageshow", refreshDailyDateKey);
      document.removeEventListener("visibilitychange", refreshDailyDateKey);
    };
  }, []);

  useEffect(() => {
    if (previousDailyDateKeyRef.current === dailyDateKey) return;

    previousDailyDateKeyRef.current = dailyDateKey;
    setSelectedRecipeFromUrl(false);
  }, [dailyDateKey]);

  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const recipeIdFromUrl = params.get("recipe");
      if (!recipeIdFromUrl) {
        setHasSyncedRecipeFromUrl(true);
        return;
      }

      if (params.get("pickedOn") !== dailyDateKey) {
        params.delete("recipe");
        params.delete("pickedOn");
        const query = params.toString();
        const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
        window.history.replaceState(null, "", nextUrl);
        setSelectedRecipeFromUrl(false);
        setHasSyncedRecipeFromUrl(true);
        return;
      }

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
  }, [allRecipes, dailyDateKey]);

  const activeSection = sections.find((section) => section.id === activeSectionId) ?? sections[0];
  const sortedRecipes = useMemo(
    () => [...(activeSection?.recipes ?? [])].sort((a, b) => a.title.localeCompare(b.title)),
    [activeSection],
  );

  const getRecipesForFilter = useCallback(
    (filterId: string) => {
      return sortedRecipes.filter((recipe) => recipeMatchesFilter(recipe, filterId, favourites));
    },
    [favourites, sortedRecipes],
  );

  const filteredRecipes = useMemo(() => getRecipesForFilter(activeFilter), [activeFilter, getRecipesForFilter]);

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
    () => getUniqueDailyPickIdForFilter(activeFilter, sortedRecipes, dailyDateKey, favourites),
    [activeFilter, dailyDateKey, favourites, sortedRecipes],
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
    const params = new URLSearchParams(window.location.search);

    if (!selectedRecipeId || !selectedRecipeFromUrl) {
      if (!params.has("recipe") && !params.has("pickedOn")) return;

      params.delete("recipe");
      params.delete("pickedOn");
      const query = params.toString();
      const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
      window.history.replaceState(null, "", nextUrl);
      return;
    }

    if (params.get("recipe") === selectedRecipeId && params.get("pickedOn") === dailyDateKey) return;

    params.set("recipe", selectedRecipeId);
    params.set("pickedOn", dailyDateKey);
    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    window.history.replaceState(null, "", nextUrl);
  }, [dailyDateKey, selectedRecipeFromUrl, selectedRecipeId]);

  const selectedRecipe = selectedRecipeFromUrl
    ? filteredRecipes.find((recipe) => recipe.id === selectedRecipeId) ??
      filteredRecipes.find((recipe) => recipe.id === dailyFilteredPickId) ??
      filteredRecipes[0] ??
      null
    : filteredRecipes.find((recipe) => recipe.id === dailyFilteredPickId) ?? filteredRecipes[0] ?? null;
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

  const showRecipeForFilter = useCallback(
    (filterId: string) => {
      const nextFilteredRecipes = getRecipesForFilter(filterId);
      const nextDailyPickId = getUniqueDailyPickIdForFilter(filterId, sortedRecipes, dailyDateKey, favourites);
      const nextRecipeId = nextDailyPickId || nextFilteredRecipes[0]?.id || "";

      setSelectedRecipeFromUrl(Boolean(nextRecipeId));
      setSelectedRecipeId(nextRecipeId);
      setActiveFilter(filterId);
    },
    [dailyDateKey, favourites, getRecipesForFilter, sortedRecipes],
  );

  const moveActiveFilter = (direction: 1 | -1) => {
    const filterOrder = mobileTopFilters.length ? mobileTopFilters : filters;
    if (!filterOrder.length) return;

    const currentIndex = Math.max(
      0,
      filterOrder.findIndex((filter) => filter.id === activeFilter),
    );
    const nextIndex = (currentIndex + direction + filterOrder.length) % filterOrder.length;
    showRecipeForFilter(filterOrder[nextIndex].id);
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
      showRecipeForFilter("all");
    }
  }, [activeFilter, showFavouritesFilter, showRecipeForFilter]);

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

  const getSelectedRecipeShareUrl = () => {
    if (!selectedRecipe) return "";

    return buildRecipeShareUrl(selectedRecipe.id, dailyDateKey);
  };

  const copySelectedRecipeLink = async () => {
    const shareUrl = getSelectedRecipeShareUrl();
    if (!shareUrl) return;

    try {
      await window.navigator.clipboard.writeText(shareUrl);
      setShareCopyStatus("Copied");
    } catch {
      setShareCopyStatus("Copy failed");
    }
  };

  const selectRecipe = (id: string) => {
    setSelectedRecipeFromUrl(true);
    setSelectedRecipeId(id);
    setRecipeSearchQuery("");
    setRecipeSheetOpen(false);
    setShareCopyStatus("");
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
        onClick={() => showRecipeForFilter(filter.id)}
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
      <div className="mt-4 px-1 py-1 sm:mt-4 sm:px-2">
        <div className="flex flex-col gap-5 sm:gap-4">
          <div className="flex items-start justify-between gap-4">
            <button type="button" onClick={returnHome} className="recipe-tap-card flex items-center gap-3 text-left" aria-label="Return to homepage">
              <Image
                src="/recipe-images/planner-logo-20260426.png"
                alt="Planner logo"
                width={75}
                height={75}
                className="hidden h-[75px] w-[75px] object-contain lg:h-[83px] lg:w-[83px]"
              />
              <h1 className="mt-0.5 text-3xl font-semibold leading-[1.24] tracking-tight text-white sm:text-3xl">
                <span className="block text-white sm:inline lg:block" aria-label="NYT Cooking">
                  <svg width="168" height="31" viewBox="0 0 168 31" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-auto w-[168px] max-w-full text-white" aria-hidden="true">
                    <path d="M26.308 1.455h-.6v22.77h.6V1.455ZM52.864 22.832v-6.257c-.667.393-1.233.72-1.733.98-.431.232-.876.44-1.333.619a8 8 0 0 1-1.153.353 6.124 6.124 0 0 1-3.778-.54 5.605 5.605 0 0 1-2.086-1.772 7.258 7.258 0 0 1-.96-1.946 7.692 7.692 0 0 1-.346-2.426 8.611 8.611 0 0 1 .28-2.265 5.997 5.997 0 0 1 .766-1.773 3.605 3.605 0 0 1 1.173-1.16 2.912 2.912 0 0 1 1.533-.406c1.733 0 2.73 1.315 2.992 3.945h4.665V1.388h-4.665v.786a10.47 10.47 0 0 0-2.392-.933c-.84-.188-1.699-.28-2.56-.273a11.582 11.582 0 0 0-3.944.666 9.849 9.849 0 0 0-3.332 2 9.009 9.009 0 0 0-2.372 3.565 14.047 14.047 0 0 0-.8 4.918c-.026 1.756.28 3.5.9 5.144a11.477 11.477 0 0 0 2.505 3.932 11.016 11.016 0 0 0 3.879 2.538c1.595.616 3.294.921 5.004.9a20.2 20.2 0 0 0 2.072-.1 15.128 15.128 0 0 0 1.853-.306c.62-.148 1.229-.332 1.826-.553a23.63 23.63 0 0 0 1.999-.867l.007.027Zm19.578-9.723a7.562 7.562 0 0 0-1.92-2.578 9.122 9.122 0 0 0-2.978-1.68 11.728 11.728 0 0 0-3.832-.6 11.015 11.015 0 0 0-3.745.62 9.327 9.327 0 0 0-2.998 1.713 7.81 7.81 0 0 0-2 2.592 7.498 7.498 0 0 0-.713 3.259 7.411 7.411 0 0 0 .713 3.238 7.756 7.756 0 0 0 2 2.56 9.533 9.533 0 0 0 3.005 1.705c1.214.424 2.492.633 3.778.62a11.61 11.61 0 0 0 3.779-.587 9.085 9.085 0 0 0 2.985-1.659 7.583 7.583 0 0 0 1.939-2.559 7.748 7.748 0 0 0 .666-3.272 8.089 8.089 0 0 0-.666-3.332l-.013-.04Zm-6.904 5.551c-.16.413-.424.778-.766 1.06a1.64 1.64 0 0 1-1.06.406 1.68 1.68 0 0 1-1.546-1.04 6.698 6.698 0 0 1-.54-2.998 5.499 5.499 0 0 1 .52-2.665 1.632 1.632 0 0 1 1.506-.893c.406-.002.799.142 1.106.406.34.293.598.67.747 1.093.21.815.298 1.658.26 2.499a6.99 6.99 0 0 1-.227 2.119v.013Zm26.788-5.537a7.563 7.563 0 0 0-1.925-2.592 9.121 9.121 0 0 0-2.98-1.68 11.728 11.728 0 0 0-3.83-.6 11.016 11.016 0 0 0-3.746.62 9.328 9.328 0 0 0-2.998 1.713 7.71 7.71 0 0 0-2 2.592 7.412 7.412 0 0 0-.72 3.259 7.331 7.331 0 0 0 .72 3.238 7.65 7.65 0 0 0 2 2.56 9.534 9.534 0 0 0 2.998 1.692 11.12 11.12 0 0 0 3.779.62c1.283.013 2.56-.185 3.778-.587a9.082 9.082 0 0 0 2.985-1.66 7.584 7.584 0 0 0 1.94-2.558 7.75 7.75 0 0 0 .666-3.272 8.089 8.089 0 0 0-.667-3.332v-.013Zm-6.91 5.537c-.166.415-.437.78-.786 1.06a1.639 1.639 0 0 1-2.606-.633 6.698 6.698 0 0 1-.54-2.999 5.499 5.499 0 0 1 .52-2.665 1.632 1.632 0 0 1 1.52-.893c.406-.005.8.14 1.106.406.342.292.602.67.753 1.093.214.828.302 1.684.26 2.539a6.99 6.99 0 0 1-.227 2.119v-.027Zm29.134 5.598V20h-1.266l-4.172-4.372 3.032-2.798h1.726V8.59h-9.456v4.239h2.313l-4.332 3.745V1.388h-8.736v4.238h1.373V20h-1.373v4.231h8.736v-6.45l5.798 6.45 6.357.027Zm9.809-22.87h-7.37v5.57h7.37v-5.57Zm1.333 22.843V20h-1.333V8.59h-8.663v4.239h1.266V20h-1.266v4.231h9.996Zm21.99 0V20h-1.333v-6.977a4.328 4.328 0 0 0-.413-1.893 4.666 4.666 0 0 0-1.159-1.512 5.498 5.498 0 0 0-1.739-.993 6.513 6.513 0 0 0-2.186-.36 7.011 7.011 0 0 0-2.999.72 6.022 6.022 0 0 0-.766.42l-1.22.812-.293.2V8.591h-8.663v4.239h1.273V20h-1.273v4.231h9.963V20h-1.273v-4.725a3.113 3.113 0 0 1 .453-1.792 1.49 1.49 0 0 1 1.333-.667 1.573 1.573 0 0 1 1.173.507 1.715 1.715 0 0 1 .486 1.253v9.655h8.636ZM168 12.83V8.59h-8.496v1.273a9.876 9.876 0 0 0-1.06-.766 5.45 5.45 0 0 0-1.013-.493 5.315 5.315 0 0 0-1.059-.253 7.716 7.716 0 0 0-1.233-.087 7.108 7.108 0 0 0-2.872.573 6.155 6.155 0 0 0-2.213 1.613 7.334 7.334 0 0 0-1.419 2.505 9.895 9.895 0 0 0-.506 3.265 9.073 9.073 0 0 0 1.139 4.592 7.387 7.387 0 0 0 2.366 2.505c.892.595 1.94.913 3.012.913a5.732 5.732 0 0 0 1.692-.26 5.882 5.882 0 0 0 1.533-.713c.24-.173.473-.36.7-.553.329-.297.64-.613.933-.946a4.523 4.523 0 0 1-1.386 3.285 4.992 4.992 0 0 1-3.519 1.18 10.492 10.492 0 0 1-4.824-1.24v4.205l.299.093c1.013.353 2.061.594 3.126.72a29.16 29.16 0 0 0 2.832.133c4.127 0 7.115-1.206 8.963-3.618a6.12 6.12 0 0 0 .879-1.44 8 8 0 0 0 .52-1.725c.116-.476.199-.96.247-1.446.048-.427.075-.857.08-1.287v-7.79H168Zm-9.076 6.123a1.39 1.39 0 0 1-1.333.847 1.717 1.717 0 0 1-1.579-.926 5.34 5.34 0 0 1-.54-2.666c0-2.479.642-3.718 1.926-3.718a1.678 1.678 0 0 1 1.333.666c.278.394.448.853.493 1.333.04.28.073.586.093.913.02.326 0 .6 0 .813a6.616 6.616 0 0 1-.406 2.705M19.525 15.635a7.996 7.996 0 0 1-4.492 4.718v-4.718l2.593-2.326-2.593-2.292V7.772a4.085 4.085 0 0 0 3.999-3.998c0-2.786-2.666-3.772-4.165-3.772a4.432 4.432 0 0 0-1.213.133v.133c.2 0 .493-.033.593-.033 1.046 0 1.833.493 1.833 1.44a1.506 1.506 0 0 1-1.633 1.439c-2.592 0-5.638-2.093-8.95-2.093C2.547.988.52 3.201.52 5.406c0 2.206 1.273 2.919 2.619 3.412v-.133a1.566 1.566 0 0 1-.72-1.44A1.946 1.946 0 0 1 4.485 5.44c2.785 0 7.27 2.333 10.055 2.333h.267v3.272l-2.592 2.265 2.592 2.326v4.785a9.71 9.71 0 0 1-3.332.553c-4.325 0-7.077-2.62-7.077-6.977-.01-1.031.134-2.057.427-3.046l2.159-.953v9.636l4.391-1.932V7.865l-6.437 2.852a7.09 7.09 0 0 1 3.605-4.065l-.033-.12C4.185 7.505 0 10.784 0 15.702c0 5.664 4.785 9.595 10.355 9.595 5.898 0 9.243-3.931 9.276-9.662h-.106Z" fill="currentColor" />
                  </svg>
                </span>
                <span className="mt-1 block font-normal text-white [font-family:Georgia,serif] sm:inline lg:mt-1.5 lg:block lg:text-[1.08em]">Healthy Dinners</span>
              </h1>
            </button>
            {showFavouritesFilter ? (
              <button
                type="button"
                onClick={() => showRecipeForFilter("favourites")}
                aria-label="Favourite recipes"
                title="Favourite recipes"
                className={`category-chip mt-1 shrink-0 rounded-2xl border bg-white px-3 py-2 text-sm font-semibold sm:hidden ${
                  activeFilter === "favourites" ? "category-chip-active" : "border-transparent text-amber-800 hover:text-amber-900"
                }`}
              >
                <span aria-hidden="true">❤️</span>
                <span className="ml-1">{favouriteCount}</span>
              </button>
            ) : null}
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
                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={copySelectedRecipeLink}
                              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-stone-300 bg-white px-0 text-xl leading-none text-stone-700 shadow-sm transition active:scale-[0.98]"
                              aria-label={shareCopyStatus === "Copied" ? "Recipe link copied" : "Copy recipe link"}
                            >
                              {shareCopyStatus === "Copied" ? (
                                <span className="text-2xl font-black text-emerald-700" aria-hidden="true">
                                  ✔
                                </span>
                              ) : (
                                "🔗"
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleFavourite(selectedRecipe.id)}
                              className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border px-0 text-xl leading-none shadow-sm transition active:scale-[0.98] ${
                                favourites[selectedRecipe.id]
                                  ? "border-amber-200 bg-amber-100 text-amber-800"
                                  : "border-stone-300 bg-white text-stone-700"
                              }`}
                              aria-pressed={Boolean(favourites[selectedRecipe.id])}
                              aria-label={favourites[selectedRecipe.id] ? "Remove from favourites" : "Add to favourites"}
                            >
                              <FavouriteHeartIcon filled={Boolean(favourites[selectedRecipe.id])} />
                            </button>
                          </div>
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
                      className="inline-flex items-center border-b border-black text-sm font-normal text-black transition hover:border-black/70"
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

function FavouriteHeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={["h-6 w-6", filled ? "text-rose-600" : "text-stone-400"].join(" ")}
      fill={filled ? "currentColor" : "white"}
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 8c0 0 0 0 0.76-1 0.88-1.16 2.18-2 3.74-2 2.49 0 4.5 2.01 4.5 4.5 0 0.93-0.28 1.79-0.76 2.5-0.81 1.21-8.24 9-8.24 9s-7.43-7.79-8.24-9C3.28 11.29 3 10.43 3 9.5 3 7.01 5.01 5 7.5 5c1.56 0 2.86 0.84 3.74 2C12 8 12 8 12 8Z" />
    </svg>
  );
}

function buildRecipeShareUrl(recipeId: string, dateKey: string) {
  if (typeof window === "undefined") return "";

  const url = new URL(window.location.href);
  url.searchParams.set("recipe", recipeId);
  url.searchParams.set("pickedOn", dateKey);
  url.hash = "";
  return url.toString();
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

const UNIQUE_DAILY_PICK_FILTER_ORDER = ["all", "quick", "meat", "fish", "vegetarian"];

function recipeMatchesFilter(recipe: RecipeLibraryEntry, filterId: string, favourites: Record<string, boolean>) {
  if (filterId === "favourites") return Boolean(favourites[recipe.id]);
  if (filterId === "quick") return isQuickPrepRecipe(recipe);
  if (filterId === "all") return true;

  return getRecipeCategory(recipe) === filterId;
}

function getUniqueDailyPickIdForFilter(filterId: string, recipes: RecipeLibraryEntry[], dateKey: string, favourites: Record<string, boolean>) {
  if (filterId === "favourites") return "";

  const reservedPickIds = new Set<string>();

  for (const orderedFilterId of UNIQUE_DAILY_PICK_FILTER_ORDER) {
    const candidates = recipes.filter((recipe) => recipeMatchesFilter(recipe, orderedFilterId, favourites));
    const pickId = getDailyDinnerPickId(candidates, dateKey, orderedFilterId, reservedPickIds);

    if (orderedFilterId === filterId) return pickId;
    if (pickId) reservedPickIds.add(pickId);
  }

  const fallbackCandidates = recipes.filter((recipe) => recipeMatchesFilter(recipe, filterId, favourites));
  return getDailyDinnerPickId(fallbackCandidates, dateKey, filterId, reservedPickIds);
}

function getDailyDinnerPickId(recipes: RecipeLibraryEntry[], dateKey: string, filterId: string, reservedPickIds = new Set<string>()) {
  if (!recipes.length) return "";

  const rotationIds = [...recipes]
    .map((recipe) => recipe.id)
    .sort((a, b) => {
      const aHash = hashString(`${DAILY_PICK_REFRESH_SALT}:${filterId}:${a}`);
      const bHash = hashString(`${DAILY_PICK_REFRESH_SALT}:${filterId}:${b}`);
      if (aHash !== bHash) return aHash - bHash;
      return a.localeCompare(b);
    });
  const startIndex = getDateRotationIndex(dateKey, rotationIds.length);
  const recentlyPickedIds = getDeterministicRecentlyPickedIds(dateKey, rotationIds);

  for (let offset = 0; offset < rotationIds.length; offset += 1) {
    const candidateId = rotationIds[(startIndex + offset) % rotationIds.length];
    if (!reservedPickIds.has(candidateId) && !recentlyPickedIds.has(candidateId)) return candidateId;
  }

  for (let offset = 0; offset < rotationIds.length; offset += 1) {
    const candidateId = rotationIds[(startIndex + offset) % rotationIds.length];
    if (!reservedPickIds.has(candidateId)) return candidateId;
  }

  return rotationIds[startIndex];
}

function getDateRotationIndex(dateKey: string, rotationLength: number) {
  if (rotationLength <= 0) return 0;

  const dateTime = Date.parse(`${dateKey}T00:00:00Z`);
  const anchorTime = Date.parse(`${DAILY_PICK_ROTATION_ANCHOR_DATE}T00:00:00Z`);
  if (!Number.isFinite(dateTime) || !Number.isFinite(anchorTime)) return 0;

  const daysSinceAnchor = Math.floor((dateTime - anchorTime) / 86_400_000);
  return ((daysSinceAnchor % rotationLength) + rotationLength) % rotationLength;
}

function getDeterministicRecentlyPickedIds(dateKey: string, rotationIds: string[]) {
  const recentIds = new Set<string>();
  const daysToTrack = Math.min(DAILY_PICK_RECENT_HISTORY_DAYS, Math.max(0, rotationIds.length - 1));

  for (let dayOffset = 1; dayOffset <= daysToTrack; dayOffset += 1) {
    const previousDateKey = getDateKeyOffset(dateKey, -dayOffset);
    const previousIndex = getDateRotationIndex(previousDateKey, rotationIds.length);
    const previousId = rotationIds[previousIndex];
    if (previousId) recentIds.add(previousId);
  }

  return recentIds;
}

function getDateKeyOffset(dateKey: string, dayOffset: number) {
  const dateTime = Date.parse(`${dateKey}T00:00:00Z`);
  if (!Number.isFinite(dateTime)) return dateKey;

  return new Date(dateTime + dayOffset * 86_400_000).toISOString().slice(0, 10);
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


