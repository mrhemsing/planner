"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent } from "react";
import type { RecipeLibraryEntry } from "@/data/recipes";
import { getRecipeImageSrc } from "@/lib/recipe-images";
import { cleanRecipeDescription } from "@/lib/recipe-text";

type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";
type PlanSlot = { recipe: RecipeLibraryEntry; servings: number };
type Plan = Record<Day, PlanSlot | null>;
type GroceryGroup = "produce" | "protein" | "pantry" | "fridge" | "frozen";
type SmartFilterGroupId = "time" | "diet" | "protein" | "method";
type SmartFilterSelections = Record<SmartFilterGroupId, string[]>;
type SmartFilterOption = { id: string; label: string; icon: string; matches: (recipe: RecipeLibraryEntry) => boolean };
type SortKey = "prep" | "alpha" | "recent" | "popular";
type IngredientCatalogItem = { id: string; label: string; count: number; priority: boolean; group: GroceryGroup };

const GROCERY_CHECKS_STORAGE_KEY = "five-day-feature-lab-grocery-checks";
const FRIDGE_PANTRY_STORAGE_KEY = "five-day-feature-lab-fridge-pantry";
const FRIDGE_WEEK_STORAGE_KEY = "five-day-feature-lab-fridge-week";
const FRIDGE_RECENT_STORAGE_KEY = "five-day-feature-lab-fridge-recent";
const WEEK_PLAN_STORAGE_KEY = "five-day-feature-lab-plan";
const FAVOURITES_STORAGE_KEY = "princess-planner-favourites";
const RECIPE_INGREDIENTS_STORAGE_KEY = "princess-planner-ingredient-checks";
const HIDDEN_INGREDIENTS_STORAGE_KEY = "five-day-feature-lab-hidden-ingredients";
const SMART_FILTER_SEARCH_PARAM = "search";
const SMART_FILTER_HIDDEN_PARAM = "hide";
const SMART_FILTER_SORT_PARAM = "sort";
const SMART_FILTER_SHOW_HIDDEN_PARAM = "showHidden";
const HAND_STRIKE_CLASSES = [
  "hand-strike hand-strike-2",
  "hand-strike hand-strike-4",
];
const warmedThumbnailSrcs = new Set<string>();

const days: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];

function SearchClearButton({ show, onClear, label = "Clear search" }: { show: boolean; onClear: () => void; label?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={!show}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClear}
      className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-lg font-black leading-none text-stone-400 transition hover:bg-stone-200/70 hover:text-stone-800 focus:outline-none focus:ring-2 focus:ring-red-800/25 disabled:pointer-events-none disabled:text-stone-300"
    >
      ×
    </button>
  );
}

const SMART_FILTER_GROUPS: Array<{ id: SmartFilterGroupId; label: string; options: SmartFilterOption[] }> = [
  {
    id: "time",
    label: "Time",
    options: [
      { id: "under30", label: "Under 30 min", icon: "⚡", matches: (recipe) => getPrepMinutes(recipe.prepTime) <= 30 },
      { id: "30to45", label: "30-45 min", icon: "◷", matches: (recipe) => {
        const minutes = getPrepMinutes(recipe.prepTime);
        return minutes > 30 && minutes <= 45;
      } },
      { id: "45to60", label: "45-60 min", icon: "⏱", matches: (recipe) => {
        const minutes = getPrepMinutes(recipe.prepTime);
        return minutes > 45 && minutes <= 60;
      } },
      { id: "60plus", label: "60+ min", icon: "⏳", matches: (recipe) => getPrepMinutes(recipe.prepTime) > 60 },
    ],
  },
  {
    id: "diet",
    label: "Diet",
    options: [
      { id: "vegetarian", label: "Vegetarian", icon: "🌱", matches: (recipe) => getRecipeKind(recipe) === "vegetarian" },
      { id: "lowCarb", label: "Low carb", icon: "◇", matches: isLowCarbRecipe },
    ],
  },
  {
    id: "protein",
    label: "Protein",
    options: [
      { id: "fish", label: "Fish", icon: "🐟", matches: (recipe) => getRecipeKind(recipe) === "fish" },
      { id: "meat", label: "Meat", icon: "🥩", matches: (recipe) => getRecipeKind(recipe) === "meat" },
      { id: "tofu", label: "Tofu", icon: "🥣", matches: (recipe) => recipeHaystack(recipe).includes("tofu") },
    ],
  },
  {
    id: "method",
    label: "Method",
    options: [
      { id: "sheetPan", label: "Sheet-pan", icon: "▭", matches: (recipe) => /sheet[-\s]?pan|tray[-\s]?bake/i.test(recipeHaystack(recipe)) },
      { id: "onePot", label: "One-pot", icon: "●", matches: (recipe) => /one[-\s]?(pot|pan|skillet)/i.test(recipeHaystack(recipe)) },
      { id: "slowCooker", label: "Slow cooker", icon: "◴", matches: (recipe) => /slow[-\s]?cooker/i.test(recipeHaystack(recipe)) },
    ],
  },
];
const featureTabs = [
  { id: "week", path: "weekly-planner", href: "/feature-lab/weekly-planner", label: "Weekly Planner", mobileLabel: "Planner", icon: "🗓️" },
  { id: "filters", path: "smart-filters", href: "/feature-lab/smart-filters", label: "Smart Filters", mobileLabel: "Filters", icon: "⚡" },
  { id: "fridge", path: "fridge-ai", href: "/feature-lab/fridge-ai", label: "Fridge AI", mobileLabel: "Fridge AI", icon: "🥬" },
] as const;
export type FeatureTabId = (typeof featureTabs)[number]["id"];
const mainNavLinks = [
  { href: "/", label: "All Recipes", activeWhen: "never" },
  { href: "/feature-lab/weekly-planner", label: "Weekly Planner", activeWhen: "week" },
  { href: "/feature-lab/smart-filters", label: "Smart Filters", activeWhen: "filters" },
  { href: "/feature-lab/fridge-ai", label: "Fridge AI", activeWhen: "fridge" },
];
const mobileMainNavLinks = [
  { href: "/", label: "All Recipes", active: false },
  { href: "/feature-lab/weekly-planner", label: "Planning Lab", active: true },
];

const groceryLabels: Record<GroceryGroup, string> = {
  produce: "Produce",
  protein: "Proteins",
  pantry: "Pantry",
  fridge: "Fridge",
  frozen: "Frozen",
};

export function FeatureLab({ recipes, initialTab = "week" }: { recipes: RecipeLibraryEntry[]; initialTab?: FeatureTabId }) {
  const pathname = usePathname();
  const activeTab = getFeatureTabFromPath(pathname) ?? initialTab;
  const sortedRecipes = useMemo(() => [...recipes].sort((a, b) => a.title.localeCompare(b.title)), [recipes]);
  const [plan, setPlan] = useState<Plan>(() => Object.fromEntries(days.map((day) => [day, null])) as Plan);
  const [planHydrated, setPlanHydrated] = useState(false);
  const [search, setSearch] = useState("");
  const [detailRecipe, setDetailRecipe] = useState<RecipeLibraryEntry | null>(null);
  const [cookRecipe, setCookRecipe] = useState<RecipeLibraryEntry | null>(null);
  const [cookOpen, setCookOpen] = useState(false);
  const [favourites, setFavourites] = useState<Record<string, boolean>>({});
  const [favouritesHydrated, setFavouritesHydrated] = useState(false);
  const [showWeekFavouriteRecipes, setShowWeekFavouriteRecipes] = useState(false);
  const featureLayoverHistoryActiveRef = useRef(false);
  const hasFeatureLayoverOpenRef = useRef(false);

  const filteredLibrary = useMemo(
    () => applySmartFilters(sortedRecipes, { quick: false, vegetarian: false, fish: false, meat: false, sheetPan: false }, "", search),
    [search, sortedRecipes],
  );
  const groceryList = useMemo(() => buildGroceryList(plan), [plan]);
  const favouriteCount = useMemo(() => Object.values(favourites).filter(Boolean).length, [favourites]);
  const isWeekFavouriteFilterActive = showWeekFavouriteRecipes && favouriteCount > 0;

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(WEEK_PLAN_STORAGE_KEY);
      if (stored) {
        setPlan(JSON.parse(stored) as Plan);
      }
    } catch {
      setPlan(Object.fromEntries(days.map((day) => [day, null])) as Plan);
    } finally {
      setPlanHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!planHydrated) return;
    window.localStorage.setItem(WEEK_PLAN_STORAGE_KEY, JSON.stringify(plan));
  }, [plan, planHydrated]);

  useEffect(() => {
    try {
      const savedFavourites = window.localStorage.getItem(FAVOURITES_STORAGE_KEY);
      if (savedFavourites) setFavourites(JSON.parse(savedFavourites) as Record<string, boolean>);
    } catch {
      setFavourites({});
    } finally {
      setFavouritesHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!favouritesHydrated) return;
    window.localStorage.setItem(FAVOURITES_STORAGE_KEY, JSON.stringify(favourites));
  }, [favourites, favouritesHydrated]);

  useEffect(() => {
    hasFeatureLayoverOpenRef.current = Boolean(detailRecipe || cookOpen);
  }, [cookOpen, detailRecipe]);

  useEffect(() => {
    const closeLayoverOnBack = () => {
      if (!featureLayoverHistoryActiveRef.current) return;

      featureLayoverHistoryActiveRef.current = false;
      if (hasFeatureLayoverOpenRef.current) {
        setDetailRecipe(null);
        setCookOpen(false);
      }
    };

    window.addEventListener("popstate", closeLayoverOnBack);
    return () => window.removeEventListener("popstate", closeLayoverOnBack);
  }, []);

  useEffect(() => {
    const hasOpenLayover = Boolean(detailRecipe || cookOpen);

    if (hasOpenLayover) {
      if (featureLayoverHistoryActiveRef.current) return;

      const currentState = window.history.state;
      const nextState =
        currentState && typeof currentState === "object"
          ? { ...currentState, featureLabLayover: true }
          : { featureLabLayover: true };

      window.history.pushState(nextState, "", `${window.location.pathname}${window.location.search}${window.location.hash}`);
      featureLayoverHistoryActiveRef.current = true;
      return;
    }

    if (featureLayoverHistoryActiveRef.current && window.history.state?.featureLabLayover) {
      window.history.back();
    }
  }, [cookOpen, detailRecipe]);

  function setDayRecipe(day: Day, recipe: RecipeLibraryEntry | null) {
    setPlan((current) => ({ ...current, [day]: recipe ? { recipe, servings: recipe.serves ?? 4 } : null }));
  }

  function openCookMode(recipe: RecipeLibraryEntry) {
    setDetailRecipe(null);
    setCookRecipe(recipe);
    setCookOpen(true);
  }

  function toggleFavourite(recipeId: string) {
    setFavourites((current) => ({ ...current, [recipeId]: !current[recipeId] }));
  }

  return (
    <main className="red-texture-background texture-soft min-h-screen overflow-x-clip px-4 pb-5 pt-0 text-stone-900 sm:px-6 sm:pb-8 sm:pt-0 lg:px-10">
      {activeTab === "week" && favouritesHydrated ? (
        <button
          type="button"
          onClick={() => setShowWeekFavouriteRecipes((current) => (favouriteCount > 0 ? !current : false))}
          aria-label={isWeekFavouriteFilterActive ? "Show all recipes" : `${favouriteCount} favourite recipes`}
          aria-pressed={isWeekFavouriteFilterActive}
          className={`absolute right-4 top-4 z-40 inline-flex h-8 shrink-0 items-center gap-0.5 rounded-full border py-0 pl-2 pr-1 text-sm font-black shadow-sm transition sm:hidden ${
            isWeekFavouriteFilterActive ? "border-amber-500 bg-amber-100 text-amber-950" : "border-stone-200 bg-white text-red-800 hover:text-amber-950"
          }`}
        >
          <StarIcon filled={isWeekFavouriteFilterActive} className="h-5 w-5" />
          <span>{favouriteCount}</span>
        </button>
      ) : null}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6 pt-0">
        <header className="mt-7 px-1 py-1 sm:mt-4 sm:px-2">
          <div className="flex flex-col gap-5 sm:gap-4">
            <Link href="/" className="recipe-tap-card flex items-center gap-3 text-left" aria-label="Return to recipes">
              <Image
                src="/recipe-images/planner-logo-20260426.png"
                alt="Planner logo"
                width={75}
                height={75}
                className="hidden h-[75px] w-[75px] object-contain lg:h-[83px] lg:w-[83px]"
              />
              <h1 className="mt-0.5 text-3xl font-semibold leading-[1.24] tracking-tight text-white sm:text-3xl">
                <span className="block text-white sm:inline lg:block" aria-label="NYT Cooking">
                  <Image
                    src="/recipe-images/nyt-cooking-wordmark.svg"
                    alt="NYT Cooking"
                    width={168}
                    height={31}
                    className="h-auto w-[168px] max-w-full object-contain"
                  />
                </span>
                <span className="mt-1 block text-3xl font-black leading-none tracking-tight text-white sm:inline sm:text-[2.35rem] lg:mt-1.5 lg:block lg:text-[3rem]">
                  Healthy Dinner Planner
                </span>
              </h1>
            </Link>

            <nav className="flex flex-nowrap gap-2 overflow-x-auto pb-1 sm:hidden" aria-label="Primary navigation">
              {mobileMainNavLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={item.active ? "page" : undefined}
                  className={mainNavClass(item.active)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <nav className="grid grid-cols-3 border-b border-white/35 sm:hidden" aria-label="Planning Lab pages">
              {featureTabs.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={item.id === activeTab ? "page" : undefined}
                  className={secondaryNavClass(item.id === activeTab)}
                >
                  {item.mobileLabel}
                </Link>
              ))}
            </nav>

            <nav className="hidden flex-nowrap gap-2 overflow-x-auto pb-1 sm:flex" aria-label="Planning tools">
              {mainNavLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={item.activeWhen === activeTab ? "page" : undefined}
                  className={mainNavClass(item.activeWhen === activeTab)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <section className="rounded-[24px] border border-white/50 bg-white/92 p-4 shadow-xl shadow-red-950/15 backdrop-blur sm:p-5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-red-800">{activeTab === "filters" ? "Recipe discovery" : getFeatureEyebrow(activeTab)}</p>
          <h2 className="mt-1 text-3xl font-black tracking-tight text-stone-950 sm:text-4xl">{getFeatureTitle(activeTab)}</h2>
          {activeTab === "week" ? (
            <p className="mt-1 max-w-2xl text-sm font-semibold text-stone-600">Plan your week. Get a shopping list.</p>
          ) : null}
          {activeTab === "filters" ? (
            <p className="mt-1 max-w-2xl text-sm font-semibold text-stone-600">Stack filters. Hide ingredients you&apos;d rather skip.</p>
          ) : null}
          {activeTab === "fridge" ? (
            <p className="mt-1 max-w-2xl text-sm font-semibold text-stone-600">Less staring into the fridge. More dinner.</p>
          ) : null}
        </section>

        {activeTab === "week" ? (
          <WeeklyPlanner
            recipes={filteredLibrary}
            plan={plan}
            groceryList={groceryList}
            search={search}
            setSearch={setSearch}
            setDayRecipe={setDayRecipe}
            onView={setDetailRecipe}
            favourites={favourites}
            showFavouriteRecipes={showWeekFavouriteRecipes}
            setShowFavouriteRecipes={setShowWeekFavouriteRecipes}
          />
        ) : null}

        {activeTab === "filters" ? (
          <SmartFilters
            recipes={sortedRecipes}
            plan={plan}
            setDayRecipe={setDayRecipe}
            onView={setDetailRecipe}
          />
        ) : null}

        {activeTab === "fridge" ? <FridgeMatcher recipes={sortedRecipes} groceryList={groceryList} onView={setDetailRecipe} /> : null}
      </div>

      {detailRecipe ? (
        <RecipeDetail
          recipe={detailRecipe}
          isFavourite={Boolean(favourites[detailRecipe.id])}
          onToggleFavourite={() => toggleFavourite(detailRecipe.id)}
          onClose={() => setDetailRecipe(null)}
          onCook={openCookMode}
        />
      ) : null}
      {cookOpen && cookRecipe ? <CookMode recipe={cookRecipe} onClose={() => setCookOpen(false)} /> : null}
    </main>
  );
}

export function getFeatureTabFromPath(pathname: string): FeatureTabId | null {
  const section = pathname.split("/").filter(Boolean).at(-1);
  return featureTabs.find((tab) => tab.path === section)?.id ?? null;
}

function mainNavClass(isActive: boolean) {
  return `category-chip shrink-0 rounded-2xl border bg-white px-4 py-2 text-sm font-black uppercase tracking-[0.08em] shadow-sm ${
    isActive
      ? "category-chip-active text-red-900"
      : "border-white/45 text-red-800 hover:border-amber-300 hover:text-amber-900"
  }`;
}

function secondaryNavClass(isActive: boolean) {
  return `planning-lab-mobile-tab border-b-2 px-1 pb-2 pt-1 text-center text-xs font-black uppercase tracking-[0.08em] transition ${
    isActive
      ? "planning-lab-mobile-tab-active border-white"
      : "border-transparent hover:border-amber-50/45"
  }`;
}

function getFeatureEyebrow(tab: FeatureTabId) {
  const labels: Record<FeatureTabId, string> = {
    week: "Planning Lab",
    filters: "Smart Filters",
    fridge: "COOK TONIGHT",
  };

  return labels[tab];
}

function getFeatureTitle(tab: FeatureTabId) {
  const labels: Record<FeatureTabId, string> = {
    week: "Five-day planning that actually plans.",
    filters: "For the picky and the particular.",
    fridge: "Find dinners from what you already have.",
  };

  return labels[tab];
}

function getSmartFilterStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const hasUrlState =
    params.has(SMART_FILTER_SEARCH_PARAM) ||
    params.has(SMART_FILTER_HIDDEN_PARAM) ||
    params.has(SMART_FILTER_SORT_PARAM) ||
    params.has(SMART_FILTER_SHOW_HIDDEN_PARAM) ||
    SMART_FILTER_GROUPS.some((group) => params.has(group.id));
  const activeFilters = getEmptySmartFilterSelections();

  for (const group of SMART_FILTER_GROUPS) {
    const validOptionIds = new Set(group.options.map((option) => option.id));
    activeFilters[group.id] = getUrlListParam(params, group.id).filter((value) => validOptionIds.has(value));
  }

  const hiddenIngredients = Array.from(
    new Set(getUrlListParam(params, SMART_FILTER_HIDDEN_PARAM).map(normalizeIngredient).filter(Boolean)),
  );

  return {
    activeFilters,
    hasUrlState,
    hiddenIngredients,
    search: params.get(SMART_FILTER_SEARCH_PARAM) ?? "",
    showHiddenRecipes: params.get(SMART_FILTER_SHOW_HIDDEN_PARAM) === "1",
    sortKey: getSortKeyFromUrl(params.get(SMART_FILTER_SORT_PARAM)),
  };
}

function writeSmartFilterStateToUrl({
  activeFilters,
  hiddenIngredients,
  search,
  showHiddenRecipes,
  sortKey,
}: {
  activeFilters: SmartFilterSelections;
  hiddenIngredients: string[];
  search: string;
  showHiddenRecipes: boolean;
  sortKey: SortKey;
}) {
  const url = new URL(window.location.href);
  const trimmedSearch = search.trim();

  if (trimmedSearch) url.searchParams.set(SMART_FILTER_SEARCH_PARAM, trimmedSearch);
  else url.searchParams.delete(SMART_FILTER_SEARCH_PARAM);

  for (const group of SMART_FILTER_GROUPS) {
    const values = activeFilters[group.id];
    if (values.length) url.searchParams.set(group.id, values.join(","));
    else url.searchParams.delete(group.id);
  }

  if (hiddenIngredients.length) url.searchParams.set(SMART_FILTER_HIDDEN_PARAM, hiddenIngredients.join(","));
  else url.searchParams.delete(SMART_FILTER_HIDDEN_PARAM);

  if (sortKey !== "prep") url.searchParams.set(SMART_FILTER_SORT_PARAM, sortKey);
  else url.searchParams.delete(SMART_FILTER_SORT_PARAM);

  if (showHiddenRecipes) url.searchParams.set(SMART_FILTER_SHOW_HIDDEN_PARAM, "1");
  else url.searchParams.delete(SMART_FILTER_SHOW_HIDDEN_PARAM);

  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (nextUrl !== currentUrl) {
    window.history.replaceState(window.history.state, "", nextUrl);
  }
}

function getUrlListParam(params: URLSearchParams, key: string) {
  return params
    .getAll(key)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

function getSortKeyFromUrl(value: string | null): SortKey {
  return value === "alpha" || value === "recent" || value === "popular" ? value : "prep";
}

function WeeklyPlanner({
  recipes,
  plan,
  groceryList,
  search,
  setSearch,
  setDayRecipe,
  onView,
  favourites,
  showFavouriteRecipes,
  setShowFavouriteRecipes,
}: {
  recipes: RecipeLibraryEntry[];
  plan: Plan;
  groceryList: Record<GroceryGroup, string[]>;
  search: string;
  setSearch: (value: string) => void;
  setDayRecipe: (day: Day, recipe: RecipeLibraryEntry | null) => void;
  onView: (recipe: RecipeLibraryEntry) => void;
  favourites: Record<string, boolean>;
  showFavouriteRecipes: boolean;
  setShowFavouriteRecipes: (value: boolean | ((current: boolean) => boolean)) => void;
}) {
  const [recipeToPlace, setRecipeToPlace] = useState<RecipeLibraryEntry | null>(null);
  const [isDesktopDragEnabled, setDesktopDragEnabled] = useState(false);
  const [draggingRecipe, setDraggingRecipe] = useState<RecipeLibraryEntry | null>(null);
  const [dragOverDay, setDragOverDay] = useState<Day | null>(null);
  const draggingRecipeRef = useRef<RecipeLibraryEntry | null>(null);
  const dragPreviewRef = useRef<HTMLDivElement | null>(null);
  const favouriteCount = useMemo(() => Object.values(favourites).filter(Boolean).length, [favourites]);
  const isFavouriteFilterActive = showFavouriteRecipes && favouriteCount > 0;
  const visibleRecipes = useMemo(
    () => (isFavouriteFilterActive ? recipes.filter((recipe) => favourites[recipe.id]) : recipes),
    [favourites, isFavouriteFilterActive, recipes],
  );

  useEffect(() => {
    const media = window.matchMedia("(pointer: fine)");
    const updateDesktopDrag = () => setDesktopDragEnabled(media.matches);

    updateDesktopDrag();
    media.addEventListener("change", updateDesktopDrag);

    return () => media.removeEventListener("change", updateDesktopDrag);
  }, []);

  useEffect(() => {
    const thumbnailSrcs = visibleRecipes.map((recipe) => getRecipeImageSrc(recipe.imageUrl)).filter((src) => !warmedThumbnailSrcs.has(src));
    if (!thumbnailSrcs.length) return;

    let cancelled = false;
    const warmThumbnailBatch = () => {
      for (const src of thumbnailSrcs) {
        if (cancelled) return;
        warmedThumbnailSrcs.add(src);
        const image = new window.Image();
        image.decoding = "async";
        image.src = src;
      }
    };

    const idleCallback = "requestIdleCallback" in window ? window.requestIdleCallback(warmThumbnailBatch, { timeout: 1500 }) : null;
    const timeout = idleCallback === null ? window.setTimeout(warmThumbnailBatch, 250) : null;

    return () => {
      cancelled = true;
      if (idleCallback !== null) window.cancelIdleCallback(idleCallback);
      if (timeout !== null) window.clearTimeout(timeout);
    };
  }, [visibleRecipes]);

  function placeRecipe(day: Day) {
    if (!recipeToPlace) return;
    setDayRecipe(day, recipeToPlace);
    setRecipeToPlace(null);
  }

  function selectRecipe(recipe: RecipeLibraryEntry) {
    setRecipeToPlace(recipe);
  }

  function viewRecipe(recipe: RecipeLibraryEntry) {
    onView(recipe);
  }

  function removeDragPreview() {
    dragPreviewRef.current?.remove();
    dragPreviewRef.current = null;
  }

  function createDragPreview(recipe: RecipeLibraryEntry, loadedImageSrc?: string) {
    removeDragPreview();

    const preview = document.createElement("div");
    preview.className = "pointer-events-none fixed -left-[9999px] -top-[9999px] h-[72px] w-[72px] overflow-hidden rounded-[14px] bg-amber-100 shadow-xl shadow-stone-950/25";

    const image = document.createElement("img");
    image.src = loadedImageSrc ?? getRecipeImageSrc(recipe.imageUrl);
    image.alt = "";
    image.className = "h-full w-full object-cover";
    image.draggable = false;

    preview.appendChild(image);
    document.body.appendChild(preview);
    dragPreviewRef.current = preview;

    return preview;
  }

  function startRecipeDrag(event: DragEvent<HTMLButtonElement>, recipe: RecipeLibraryEntry) {
    if (!isDesktopDragEnabled) {
      event.preventDefault();
      return;
    }

    setDraggingRecipe(recipe);
    draggingRecipeRef.current = recipe;
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("application/x-planner-recipe-id", recipe.id);
    const loadedImage = event.currentTarget.querySelector("img");
    event.dataTransfer.setDragImage(createDragPreview(recipe, loadedImage?.currentSrc || loadedImage?.src), 36, 36);
  }

  function dragRecipeOverDay(event: DragEvent<HTMLDivElement>, day: Day) {
    if (!isDesktopDragEnabled || !draggingRecipeRef.current) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setDragOverDay(day);
  }

  function dropRecipeOnDay(event: DragEvent<HTMLDivElement>, day: Day) {
    const recipe = draggingRecipeRef.current;
    if (!isDesktopDragEnabled || !recipe) return;

    event.preventDefault();
    setDayRecipe(day, recipe);
    draggingRecipeRef.current = null;
    setDraggingRecipe(null);
    setDragOverDay(null);
  }

  function endRecipeDrag() {
    draggingRecipeRef.current = null;
    setDraggingRecipe(null);
    setDragOverDay(null);
    removeDragPreview();
  }

  return (
    <section className="grid gap-4 pb-28 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] lg:pb-0">
      <div className="min-w-0 rounded-[24px] border border-white/50 bg-white p-4 shadow-xl shadow-red-950/10 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-800">Weekly meal planner</p>
            <h2 className="mt-1 text-2xl font-black text-stone-950">This Week&apos;s Plan</h2>
            <p className="mt-1 text-sm font-semibold text-stone-500">
              <span className="hidden sm:inline">Open a recipe from the row, drag from the handle, or use Add.</span>
              <span className="sm:hidden">Use Add, then tap a day.</span>
            </p>
          </div>
        </div>

        {recipeToPlace ? (
          <div className="sticky top-3 z-20 mt-4 flex items-center gap-3 rounded-[18px] bg-red-50 p-3 shadow-lg shadow-red-950/15">
            <div className="min-w-0 flex-1">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-red-800">Choose a day</p>
              <p className="text-sm font-black leading-tight text-stone-950">{recipeToPlace.title}</p>
            </div>
            <button type="button" onClick={() => setRecipeToPlace(null)} className="rounded-full bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-stone-600">
              Cancel
            </button>
          </div>
        ) : null}

        <div className="sticky top-0 z-30 -mx-4 mt-3 bg-white pb-2 pt-1 shadow-sm shadow-stone-200/70 sm:mx-0 sm:mt-3 sm:pb-3 sm:pt-3 lg:top-2 lg:z-40 lg:rounded-[22px] lg:border lg:border-amber-100/80 lg:bg-white/95 lg:px-3 lg:shadow-lg lg:shadow-red-950/10">
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 pl-6 pr-4 scroll-pl-6 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0 sm:pb-0 sm:scroll-pl-0">
            {days.map((day) => {
              const slot = plan[day];
              const plannedRecipe = slot?.recipe ?? null;
              const isTapTarget = Boolean(recipeToPlace);
              const isFilledSlot = Boolean(plannedRecipe && !isTapTarget);

              return (
                <div
                  key={day}
                  role={isTapTarget || isFilledSlot ? "button" : undefined}
                  tabIndex={isTapTarget || isFilledSlot ? 0 : undefined}
                  onClick={() => {
                    if (isTapTarget) {
                      placeRecipe(day);
                      return;
                    }

                    if (plannedRecipe) onView(plannedRecipe);
                  }}
                  onDragOver={(event) => dragRecipeOverDay(event, day)}
                  onDragLeave={() => setDragOverDay((current) => (current === day ? null : current))}
                  onDrop={(event) => dropRecipeOnDay(event, day)}
                  onKeyDown={(event) => {
                    if (!isTapTarget && !plannedRecipe) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      if (isTapTarget) {
                        placeRecipe(day);
                        return;
                      }

                      if (plannedRecipe) onView(plannedRecipe);
                    }
                  }}
                  className={`relative min-w-[calc((100%-1.5rem)/2.3)] snap-start rounded-[18px] border border-transparent p-3 transition sm:min-w-0 ${
                    dragOverDay === day
                      ? "min-h-28 bg-red-50 sm:min-h-20"
                      : isTapTarget
                      ? "min-h-28 cursor-pointer bg-red-50 sm:min-h-20"
                      : plannedRecipe
                        ? "min-h-28 cursor-pointer bg-amber-50/70 hover:bg-red-50/50 focus:outline-none focus:ring-2 focus:ring-red-800/25 sm:min-h-20"
                        : "min-h-28 bg-amber-50/70 sm:min-h-20"
                  }`}
                  aria-label={plannedRecipe && !isTapTarget ? `View ${plannedRecipe.title}` : undefined}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-black text-red-900">{day}</p>
                    {plannedRecipe && !isTapTarget ? (
                      <button
                        type="button"
                        aria-label={`Clear ${day}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setDayRecipe(day, null);
                        }}
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-red-900/15 bg-white text-base font-black leading-none text-red-800 shadow-sm transition hover:border-red-800/40 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-800/25"
                      >
                        ×
                      </button>
                    ) : null}
                  </div>
                  {plannedRecipe ? (
                    <MiniRecipe recipe={plannedRecipe} />
                  ) : (
                    <p className={`mt-4 text-sm font-black ${isTapTarget ? "text-red-900" : "text-stone-400"}`}>
                      {isTapTarget ? "Tap to add" : "+ Add recipe"}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onDragOver={(event) => {
                if (!draggingRecipeRef.current) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = "none";
              }}
              onDrop={(event) => {
                if (!draggingRecipeRef.current) return;
                event.preventDefault();
              }}
              placeholder="Search recipes to add..."
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 pr-12 text-base font-semibold outline-none focus:border-red-800"
            />
            <SearchClearButton show={Boolean(search)} onClear={() => setSearch("")} />
          </div>
          {favouriteCount > 0 ? (
            <button
              type="button"
              onClick={() => setShowFavouriteRecipes((current) => !current)}
              aria-label={isFavouriteFilterActive ? "Show all recipes" : `${favouriteCount} favourite recipes`}
              aria-pressed={isFavouriteFilterActive}
              className={`hidden shrink-0 items-center justify-center gap-1.5 rounded-2xl border px-4 py-3 text-sm font-black shadow-sm transition sm:inline-flex ${
                isFavouriteFilterActive ? "border-amber-500 bg-amber-100 text-amber-950" : "border-stone-200 bg-white text-amber-900 hover:text-amber-950"
              }`}
            >
              <StarIcon filled={isFavouriteFilterActive} className="h-4 w-4" />
              <span>Favourites ({favouriteCount})</span>
            </button>
          ) : null}
        </div>
        <div className="mt-3 grid gap-2">
          {visibleRecipes.map((recipe) => (
              <article
                key={recipe.id}
                className={`group grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 rounded-[16px] border p-2 text-left shadow-sm transition-colors lg:gap-3 ${
                recipeToPlace?.id === recipe.id || draggingRecipe?.id === recipe.id ? "border-red-800 bg-red-50" : "border-stone-200 bg-white"
              }`}
              >
                <button
                  type="button"
                  onClick={() => viewRecipe(recipe)}
                  draggable={isDesktopDragEnabled}
                  onDragStart={(event) => startRecipeDrag(event, recipe)}
                  onDragEnd={endRecipeDrag}
                  className={`relative flex min-w-0 items-start gap-3 rounded-[12px] text-left ${isDesktopDragEnabled ? "cursor-grab active:cursor-grabbing" : ""}`}
                >
                  <span
                    className="pointer-events-none absolute left-1 top-1/2 z-10 hidden h-8 w-4 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-stone-400 opacity-0 shadow-sm transition group-hover:opacity-100 sm:grid"
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 12 20" className="h-5 w-3 fill-current">
                      <circle cx="3" cy="4" r="1.4" />
                      <circle cx="9" cy="4" r="1.4" />
                      <circle cx="3" cy="10" r="1.4" />
                      <circle cx="9" cy="10" r="1.4" />
                      <circle cx="3" cy="16" r="1.4" />
                      <circle cx="9" cy="16" r="1.4" />
                    </svg>
                  </span>
                  <Thumb recipe={recipe} loading="eager" />
                  <span className="min-w-0 flex-1 py-0.5">
                    <span className="block whitespace-normal break-words text-sm font-black leading-snug text-stone-950 sm:text-base">{recipe.title}</span>
                    <span className="text-sm font-semibold text-stone-500">{recipe.prepTime ?? "Weeknight"} · {recipe.serves ? `Serves ${recipe.serves}` : "Dinner"}</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    selectRecipe(recipe);
                  }}
                  className={`relative z-10 mt-5 shrink-0 rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${
                    recipeToPlace?.id === recipe.id ? "bg-red-800 text-white" : "bg-red-50 text-red-800"
                  }`}
                >
                  Add
                </button>
              </article>
          ))}
        </div>
      </div>

      <GroceryList groceryList={groceryList} />
    </section>
  );
}

function SmartFilters({
  recipes,
  plan,
  setDayRecipe,
  onView,
}: {
  recipes: RecipeLibraryEntry[];
  plan: Plan;
  setDayRecipe: (day: Day, recipe: RecipeLibraryEntry | null) => void;
  onView: (recipe: RecipeLibraryEntry) => void;
}) {
  const [search, setSearch] = useState("");
  const [hiddenDraft, setHiddenDraft] = useState("");
  const [hiddenIngredients, setHiddenIngredients] = useState<string[]>([]);
  const [showHiddenRecipes, setShowHiddenRecipes] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("prep");
  const [hydrated, setHydrated] = useState(false);
  const [activeFilters, setActiveFilters] = useState<SmartFilterSelections>(() => getEmptySmartFilterSelections());
  const [openAddRecipeId, setOpenAddRecipeId] = useState<string | null>(null);
  const [addConfirmations, setAddConfirmations] = useState<Record<string, Day>>({});
  const [visibleCount, setVisibleCount] = useState(30);
  const smartFilterUrlReadyRef = useRef(false);
  const hiddenTerms = useMemo(() => hiddenIngredients.map(normalizeIngredient).filter(Boolean), [hiddenIngredients]);
  const baseRecipes = useMemo(() => applySmartFilterSelections(recipes, activeFilters, search, []), [activeFilters, recipes, search]);
  const hiddenRecipeCount = useMemo(() => baseRecipes.filter((recipe) => recipeMatchesHiddenIngredients(recipe, hiddenTerms)).length, [baseRecipes, hiddenTerms]);
  const visibleRecipes = useMemo(() => {
    const filtered = showHiddenRecipes ? baseRecipes : baseRecipes.filter((recipe) => !recipeMatchesHiddenIngredients(recipe, hiddenTerms));
    return sortSmartFilterRecipes(filtered, sortKey);
  }, [baseRecipes, hiddenTerms, showHiddenRecipes, sortKey]);
  const selectedSummaries = getSelectedSmartFilterLabels(activeFilters);
  const hasActiveFilters = selectedSummaries.length > 0 || search.trim() || hiddenIngredients.length > 0 || sortKey !== "prep";
  const visibleRecipeCards = visibleRecipes.slice(0, visibleCount);

  useEffect(() => {
    try {
      const urlState = getSmartFilterStateFromUrl();

      if (urlState.hasUrlState) {
        setSearch(urlState.search);
        setActiveFilters(urlState.activeFilters);
        setHiddenIngredients(urlState.hiddenIngredients);
        setSortKey(urlState.sortKey);
        setShowHiddenRecipes(urlState.showHiddenRecipes);
      } else {
        const savedHiddenIngredients = window.localStorage.getItem(HIDDEN_INGREDIENTS_STORAGE_KEY);
        if (savedHiddenIngredients) setHiddenIngredients(JSON.parse(savedHiddenIngredients) as string[]);
      }
    } catch {
      setHiddenIngredients([]);
    } finally {
      smartFilterUrlReadyRef.current = true;
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(HIDDEN_INGREDIENTS_STORAGE_KEY, JSON.stringify(hiddenIngredients));
  }, [hiddenIngredients, hydrated]);

  useEffect(() => {
    if (!hydrated || !smartFilterUrlReadyRef.current) return;
    writeSmartFilterStateToUrl({ activeFilters, hiddenIngredients, search, showHiddenRecipes, sortKey });
  }, [activeFilters, hiddenIngredients, hydrated, search, showHiddenRecipes, sortKey]);

  useEffect(() => {
    if (!openAddRecipeId) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest("[data-smart-add-menu]")) return;
      setOpenAddRecipeId(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenAddRecipeId(null);
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [openAddRecipeId]);

  useEffect(() => {
    setVisibleCount(30);
  }, [activeFilters, hiddenIngredients, search, showHiddenRecipes, sortKey]);

  function toggleFilter(groupId: SmartFilterGroupId, optionId: string) {
    setActiveFilters((current) => {
      const currentValues = current[groupId];
      const nextValues = currentValues.includes(optionId)
        ? currentValues.filter((id) => id !== optionId)
        : [...currentValues, optionId];

      return { ...current, [groupId]: nextValues };
    });
  }

  function addHiddenIngredient(value: string) {
    const normalized = normalizeIngredient(value);
    if (!normalized) return;

    setHiddenIngredients((current) => (current.includes(normalized) ? current : [...current, normalized]));
    setHiddenDraft("");
    setShowHiddenRecipes(false);
  }

  function removeHiddenIngredient(value: string) {
    setHiddenIngredients((current) => current.filter((item) => item !== value));
  }

  function clearAllFilters() {
    setActiveFilters(getEmptySmartFilterSelections());
    setSearch("");
    setHiddenIngredients([]);
    setHiddenDraft("");
    setShowHiddenRecipes(false);
    setSortKey("prep");
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <aside className="rounded-[20px] border border-white/55 bg-white p-4 shadow-xl shadow-red-950/15">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-800">Filters</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-stone-500">Choose one or more inside a group. Groups stack together.</p>

          <label className="mt-4 grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-stone-500">Search recipes</span>
            <span className="relative grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-2xl border border-stone-300 bg-white px-3 py-2.5">
              <span className="text-stone-400" aria-hidden="true">⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Title, tag, ingredient..."
                className="min-w-0 bg-transparent pr-10 text-sm font-semibold text-stone-900 outline-none placeholder:text-stone-400"
              />
              <SearchClearButton show={Boolean(search)} onClear={() => setSearch("")} />
            </span>
          </label>

          <div className="mt-4 grid gap-4">
            {SMART_FILTER_GROUPS.map((group) => (
              <section key={group.id}>
                <h3 className="text-xs font-black uppercase tracking-[0.16em] text-stone-500">{group.label}</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {group.options.map((option) => {
                    const isSelected = activeFilters[group.id].includes(option.id);
                    const count = countSmartFilterOption(recipes, activeFilters, group.id, option, search);

                    return (
                      <button
                        type="button"
                        key={option.id}
                        onClick={() => toggleFilter(group.id, option.id)}
                        className={`rounded-full border px-3 py-2 text-xs font-black uppercase tracking-[0.08em] transition ${
                          isSelected
                            ? "border-amber-700 bg-white text-red-900 shadow-sm"
                            : "border-red-800/20 bg-orange-50 text-red-800 hover:border-red-800/50 hover:bg-white"
                        }`}
                      >
                        <span className="mr-1" aria-hidden="true">{option.icon}</span>
                        {option.label} <span className={isSelected ? "text-red-900/70" : "text-red-800/60"}>({count})</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <section className="mt-5 border-t border-stone-200 pt-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.16em] text-stone-500">Hide ingredients</h3>
                <p className="mt-1 text-xs font-semibold text-stone-500">Saved automatically for next time.</p>
              </div>
              {hiddenIngredients.length ? (
                <button type="button" onClick={() => setHiddenIngredients([])} className="text-xs font-black uppercase tracking-[0.12em] text-red-800">
                  Clear
                </button>
              ) : null}
            </div>
            <label className="relative mt-3 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-2xl border border-stone-300 bg-stone-50 px-3 py-2.5">
              <span className="text-red-800" aria-hidden="true">⊘</span>
              <input
                value={hiddenDraft}
                onChange={(event) => setHiddenDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === ",") {
                    event.preventDefault();
                    addHiddenIngredient(hiddenDraft);
                  }
                }}
                onBlur={() => addHiddenIngredient(hiddenDraft)}
                placeholder="mushrooms, cilantro..."
                className="min-w-0 bg-transparent pr-10 text-sm font-semibold text-stone-900 outline-none placeholder:text-stone-400"
              />
              <SearchClearButton show={Boolean(hiddenDraft)} onClear={() => setHiddenDraft("")} label="Clear hidden ingredient search" />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              {hiddenIngredients.length ? (
                hiddenIngredients.map((ingredient) => (
                  <button
                    type="button"
                    key={ingredient}
                    onClick={() => removeHiddenIngredient(ingredient)}
                    className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-black text-red-800 hover:bg-red-100"
                  >
                    {labelizeIngredient(ingredient)} ×
                  </button>
                ))
              ) : (
                <p className="text-sm font-semibold text-stone-500">Add ingredients you&apos;d rather not see, like cilantro or mushrooms.</p>
              )}
            </div>
            {hiddenIngredients.length ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-[14px] bg-amber-50 px-3 py-2 text-sm font-bold text-stone-700">
                <span>{hiddenRecipeCount} recipes hidden because they contain {hiddenIngredients.map(labelizeIngredient).join(", ")}</span>
                <button type="button" onClick={() => setShowHiddenRecipes((current) => !current)} className="font-black text-red-800">
                  {showHiddenRecipes ? "Hide again" : "Show anyway"}
                </button>
              </div>
            ) : null}
          </section>
        </aside>

        <div className="min-w-0">
          <div className="flex flex-col gap-3 rounded-[20px] border border-white/55 bg-white p-4 shadow-xl shadow-red-950/15 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-black text-stone-950">
                Showing {visibleRecipes.length} of {recipes.length} recipes
                {showHiddenRecipes && hiddenRecipeCount ? <span className="text-stone-500"> · hidden recipes included</span> : null}
              </p>
              {selectedSummaries.length || hiddenIngredients.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedSummaries.map((label) => (
                    <span key={label} className="rounded-full bg-red-50 px-3 py-1 text-xs font-black uppercase tracking-[0.1em] text-red-800">{label}</span>
                  ))}
                  {hiddenIngredients.map((ingredient) => (
                    <span key={`hide-${ingredient}`} className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black uppercase tracking-[0.1em] text-stone-700">Hiding: {labelizeIngredient(ingredient)}</span>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {hasActiveFilters ? (
                <button type="button" onClick={clearAllFilters} className="rounded-full border border-stone-300 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-stone-700">
                  Clear all
                </button>
              ) : null}
              <label className="flex items-center gap-2 rounded-full border border-stone-300 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-stone-700">
                Sort
                <select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)} className="bg-transparent text-sm font-black normal-case tracking-normal text-stone-950 outline-none">
                  <option value="prep">Shortest prep</option>
                  <option value="alpha">A-Z</option>
                  <option value="recent">Most recent</option>
                  <option value="popular">Popular</option>
                </select>
              </label>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {visibleRecipeCards.map((recipe) => (
              <RecipeResult
                key={recipe.id}
                recipe={recipe}
                plan={plan}
                isAddMenuOpen={openAddRecipeId === recipe.id}
                addedDay={addConfirmations[recipe.id] ?? null}
                onToggleAddMenu={() => setOpenAddRecipeId((current) => (current === recipe.id ? null : recipe.id))}
                onAddToDay={(day) => {
                  setDayRecipe(day, recipe);
                  setOpenAddRecipeId(null);
                  setAddConfirmations((current) => ({ ...current, [recipe.id]: day }));
                }}
                onView={onView}
              />
            ))}
            {visibleCount < visibleRecipes.length ? (
              <button
                type="button"
                onClick={() => setVisibleCount((current) => current + 30)}
                className="rounded-[16px] border border-white/55 bg-white px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-red-800 shadow-lg shadow-red-950/10 hover:bg-red-50"
              >
                Show more recipes ({visibleRecipes.length - visibleCount} left)
              </button>
            ) : null}
          </div>
        </div>
    </section>
  );
}

function FridgeMatcher({
  recipes,
  groceryList,
  onView,
}: {
  recipes: RecipeLibraryEntry[];
  groceryList: Record<GroceryGroup, string[]>;
  onView: (recipe: RecipeLibraryEntry) => void;
}) {
  const [hydrated, setHydrated] = useState(false);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [pantryIngredients, setPantryIngredients] = useState<Set<string>>(() => new Set(BASIC_PANTRY_PRESET.map(canonicalizeIngredient)));
  const [weekIngredients, setWeekIngredients] = useState<Set<string>>(() => new Set(["salmon", "asparagus"]));
  const [recentIngredientIds, setRecentIngredientIds] = useState<string[]>([]);
  const ingredientCatalog = useMemo(() => buildIngredientCatalog(recipes), [recipes]);
  const scoredMatches = useMemo(
    () => matchFridgeRecipes(recipes, pantryIngredients, weekIngredients),
    [pantryIngredients, recipes, weekIngredients],
  );
  const visibleScoredMatches = useMemo(() => scoredMatches.slice(0, 12), [scoredMatches]);
  const availableIngredientIds = useMemo(() => new Set([...FREE_STAPLES, ...pantryIngredients, ...weekIngredients]), [pantryIngredients, weekIngredients]);
  const equivalentMap = useMemo(() => buildEquivalentMap(availableIngredientIds), [availableIngredientIds]);
  const removedBasicPantryIngredients = useMemo(
    () => BASIC_PANTRY_IDS.filter((id) => !pantryIngredients.has(id)),
    [pantryIngredients],
  );
  const visibleIngredients = useMemo(() => {
    const terms = tokenize(ingredientSearch);

    return ingredientCatalog
      .map((ingredient) => ({
        ...ingredient,
        relevance: getIngredientSearchRelevance(ingredient, terms),
      }))
      .filter((ingredient) => {
        if (!terms.length) return weekIngredients.has(ingredient.id) || pantryIngredients.has(ingredient.id) || ingredient.priority;
        return ingredient.relevance > 0;
      })
      .sort((a, b) => b.relevance - a.relevance || b.count - a.count || a.label.localeCompare(b.label))
      .slice(0, 24);
  }, [ingredientCatalog, ingredientSearch, pantryIngredients, weekIngredients]);
  const visibleIngredientGroups = useMemo(() => groupIngredientCatalogItems(visibleIngredients), [visibleIngredients]);
  const recentIngredients = useMemo(
    () => recentIngredientIds.map((id) => ingredientCatalog.find((ingredient) => ingredient.id === id)).filter((ingredient): ingredient is IngredientCatalogItem => Boolean(ingredient)).slice(0, 8),
    [ingredientCatalog, recentIngredientIds],
  );
  const starterIngredients = useMemo(
    () =>
      FRIDGE_STARTER_INGREDIENTS.map((id) => ingredientCatalog.find((ingredient) => ingredient.id === id) ?? { id, label: labelizeIngredient(id), count: 0, priority: true, group: "fridge" as GroceryGroup }).slice(0, 10),
    [ingredientCatalog],
  );
  const summary = useMemo(() => summarizeFridgeMatches(visibleScoredMatches), [visibleScoredMatches]);
  const hasSelections = weekIngredients.size > 0 || pantryIngredients.size > 0;
  const plannedIngredientCount = useMemo(() => countGroceryItems(groceryList), [groceryList]);

  useEffect(() => {
    try {
      const savedPantry = window.localStorage.getItem(FRIDGE_PANTRY_STORAGE_KEY);
      const savedWeek = window.localStorage.getItem(FRIDGE_WEEK_STORAGE_KEY);
      const savedRecent = window.localStorage.getItem(FRIDGE_RECENT_STORAGE_KEY);

      if (savedPantry) setPantryIngredients(new Set((JSON.parse(savedPantry) as string[]).map(canonicalizeIngredient).filter(Boolean)));
      if (savedWeek) setWeekIngredients(new Set((JSON.parse(savedWeek) as string[]).map(canonicalizeIngredient).filter(Boolean)));
      if (savedRecent) setRecentIngredientIds((JSON.parse(savedRecent) as string[]).map(canonicalizeIngredient).filter(Boolean).slice(0, 12));
    } catch {
      // Keep the matcher usable if localStorage is unavailable.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(FRIDGE_PANTRY_STORAGE_KEY, JSON.stringify([...pantryIngredients]));
  }, [hydrated, pantryIngredients]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(FRIDGE_WEEK_STORAGE_KEY, JSON.stringify([...weekIngredients]));
  }, [hydrated, weekIngredients]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(FRIDGE_RECENT_STORAGE_KEY, JSON.stringify(recentIngredientIds));
  }, [hydrated, recentIngredientIds]);

  function rememberIngredient(ingredientId: string) {
    setRecentIngredientIds((current) => [ingredientId, ...current.filter((id) => id !== ingredientId)].slice(0, 12));
  }

  function toggleIngredient(target: "pantry" | "week", ingredientId: string) {
    const setter = target === "pantry" ? setPantryIngredients : setWeekIngredients;
    setter((current) => {
      const next = new Set(current);
      if (next.has(ingredientId)) next.delete(ingredientId);
      else {
        next.add(ingredientId);
        rememberIngredient(ingredientId);
      }
      return next;
    });
  }

  function restorePantryIngredient(ingredientId: string) {
    setPantryIngredients((current) => new Set(current).add(ingredientId));
    rememberIngredient(ingredientId);
  }

  function addWeekIngredient(ingredientId: string) {
    setWeekIngredients((current) => new Set(current).add(ingredientId));
    rememberIngredient(ingredientId);
  }

  function promoteWeekIngredientToPantry(ingredientId: string) {
    setPantryIngredients((current) => new Set(current).add(ingredientId));
    setWeekIngredients((current) => {
      const next = new Set(current);
      next.delete(ingredientId);
      return next;
    });
    rememberIngredient(ingredientId);
  }

  function prefillFromPlanner() {
    const nextWeek = new Set(weekIngredients);
    const nextPantry = new Set(pantryIngredients);
    const addedIds: string[] = [];

    for (const group of Object.keys(groceryList) as GroceryGroup[]) {
      for (const item of groceryList[group]) {
        const id = canonicalizeIngredient(item);
        if (!id || FREE_STAPLES.has(id)) continue;
        if (group === "pantry") nextPantry.add(id);
        else nextWeek.add(id);
        addedIds.push(id);
      }
    }

    setWeekIngredients(nextWeek);
    setPantryIngredients(nextPantry);
    setRecentIngredientIds((current) => [...addedIds.reverse(), ...current].filter((id, index, list) => list.indexOf(id) === index).slice(0, 12));
  }

  function clearWeek() {
    setWeekIngredients(new Set());
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-[24px] border border-white/50 bg-white p-4 shadow-xl shadow-red-950/10 sm:p-5">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-red-800">Fridge + pantry</p>
        <h2 className="mt-1 text-2xl font-black text-stone-950">Pick what you want to use.</h2>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={prefillFromPlanner}
            disabled={plannedIngredientCount === 0}
            className="rounded-full border border-red-800/25 bg-red-50 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-red-800 disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-100 disabled:text-stone-400"
          >
            Pre-fill from planner
          </button>
          <button
            type="button"
            onClick={clearWeek}
            className="rounded-full border border-stone-300 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-stone-600"
          >
            Clear this week
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          <QuickIngredientChips
            title={recentIngredients.length ? "Recently added" : "Fridge starters"}
            ingredients={recentIngredients.length ? recentIngredients : starterIngredients}
            selectedIds={weekIngredients}
            onAdd={addWeekIngredient}
          />
          {recentIngredients.length ? (
            <QuickIngredientChips title="Common starters" ingredients={starterIngredients} selectedIds={weekIngredients} onAdd={addWeekIngredient} />
          ) : null}
        </div>

        <div className="relative mt-4">
          <input
            value={ingredientSearch}
            onChange={(event) => setIngredientSearch(event.target.value)}
            placeholder="Search ingredients: salmon, asparagus, tofu..."
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 pr-12 font-semibold"
          />
          <SearchClearButton show={Boolean(ingredientSearch)} onClear={() => setIngredientSearch("")} />
        </div>

        <div className="mt-4 grid gap-3">
          <SelectedIngredientShelf
            title="Use this week"
            ids={weekIngredients}
            catalog={ingredientCatalog}
            onRemove={(id) => toggleIngredient("week", id)}
            onPromote={promoteWeekIngredientToPantry}
          />
          <SelectedIngredientShelf title="Always have" ids={pantryIngredients} catalog={ingredientCatalog} onRemove={(id) => toggleIngredient("pantry", id)} />
          <BasicPantryRestoreShelf ids={removedBasicPantryIngredients} catalog={ingredientCatalog} onRestore={restorePantryIngredient} />
        </div>

        <div className="mt-4 grid max-h-[28rem] gap-2 overflow-y-auto pr-1">
          {visibleIngredientGroups.map(({ group, ingredients }) => (
            <section key={group} className="grid gap-2">
              <h3 className="px-1 text-[0.68rem] font-black uppercase tracking-[0.16em] text-stone-500">{groceryLabels[group]}</h3>
              {ingredients.map((ingredient) => {
                const inWeek = weekIngredients.has(ingredient.id);
                const inPantry = pantryIngredients.has(ingredient.id);
                const isRemovedBasicPantryItem = BASIC_PANTRY_IDS.includes(ingredient.id) && !inPantry;

                return (
                  <div key={ingredient.id} className="grid gap-2 rounded-[16px] border border-stone-200 bg-amber-50/60 p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                    <div className="min-w-0">
                      <p className="font-black text-stone-950">{ingredient.label}</p>
                      <p className="text-xs font-semibold text-stone-500">{ingredient.count ? `${ingredient.count} recipes` : "Pantry staple"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleIngredient("week", ingredient.id)}
                      className={`rounded-full px-3 py-2 text-xs font-black uppercase tracking-[0.12em] ${
                        inWeek ? "bg-red-800 text-white" : "border border-red-800/25 bg-white text-red-800"
                      }`}
                    >
                      This week
                    </button>
                    <button
                      type="button"
                      onClick={() => (isRemovedBasicPantryItem ? restorePantryIngredient(ingredient.id) : toggleIngredient("pantry", ingredient.id))}
                      className={`rounded-full px-3 py-2 text-xs font-black uppercase tracking-[0.12em] ${
                        inPantry ? "bg-amber-900 text-white" : "border border-amber-900/25 bg-white text-amber-900"
                      }`}
                    >
                      {isRemovedBasicPantryItem ? "Restore" : "Always"}
                    </button>
                  </div>
                );
              })}
            </section>
          ))}
        </div>
      </div>
      <div className="rounded-[24px] border border-white/50 bg-white p-4 shadow-xl shadow-red-950/10 sm:p-5">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-red-800">Best matches</p>
        <h2 className="mt-1 text-2xl font-black text-stone-950">Ranked by what is actually cookable.</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-800">
            {summary.ready} ready now
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-amber-900">
            {summary.oneMissing} missing 1 item
          </span>
          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-red-800">
            {summary.missingTwoOrMore} missing 2+
          </span>
        </div>
        <div className="mt-4 grid gap-3">
          {visibleScoredMatches.length ? (
            visibleScoredMatches.map(({ recipe, matched, missing, badge }) => (
              <button
                key={recipe.id}
                type="button"
                onClick={() => onView(recipe)}
                className="rounded-[18px] border border-stone-200 bg-amber-50/60 p-3 text-left transition hover:border-red-800/30 hover:bg-red-50/30 focus:outline-none focus:ring-2 focus:ring-red-800/25"
                aria-label={`View ${recipe.title}`}
              >
                <div className="flex gap-3">
                  <Thumb recipe={recipe} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col items-start gap-1 sm:flex-row sm:justify-between">
                      <h3 className="order-2 min-w-0 flex-1 text-left font-black text-stone-950 sm:order-1">{recipe.title}</h3>
                      <span className="order-1 text-left text-[0.65rem] font-black uppercase tracking-[0.12em] text-red-800 sm:order-2">
                        {badge}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-stone-600">Have: {matched.slice(0, 6).join(", ") || "pantry staples"}</p>
                    <p className="mt-1 text-sm font-bold text-red-800">
                      {missing.length ? `Missing: ${missing.slice(0, 5).join(", ")}` : "Nothing important missing"}
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {dedupeRecipeIngredients(recipe)
                        .filter((ingredient) => ingredient.importance !== "free")
                        .slice(0, 8)
                        .map((ingredient) => {
                          const isCovered = isIngredientCovered(ingredient.id, availableIngredientIds, equivalentMap);

                          return (
                            <li
                              key={`${recipe.id}-${ingredient.id}`}
                              className={`rounded-full px-2.5 py-1 text-[0.68rem] font-black uppercase tracking-[0.08em] ${
                                isCovered ? "bg-stone-100 text-stone-500 line-through decoration-red-800/70" : "bg-white text-stone-800"
                              }`}
                            >
                              {isCovered ? "Have " : "Need "}
                              {ingredient.label}
                            </li>
                          );
                        })}
                    </ul>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-[18px] border border-dashed border-stone-300 bg-amber-50/50 p-5 text-sm font-bold text-stone-600">
              {hasSelections ? "No strong matches yet. Try adding one or two decision ingredients." : "Search an ingredient or apply a pantry preset to see recipe matches."}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function SelectedIngredientShelf({
  title,
  ids,
  catalog,
  onRemove,
  onPromote,
}: {
  title: string;
  ids: Set<string>;
  catalog: IngredientCatalogItem[];
  onRemove: (id: string) => void;
  onPromote?: (id: string) => void;
}) {
  const labelsById = useMemo(() => new Map(catalog.map((ingredient) => [ingredient.id, ingredient.label])), [catalog]);
  const items = [...ids].sort((a, b) => (labelsById.get(a) ?? labelizeIngredient(a)).localeCompare(labelsById.get(b) ?? labelizeIngredient(b)));

  return (
    <section className="rounded-[16px] border border-stone-200 bg-white/80 p-3">
      <h3 className="text-xs font-black uppercase tracking-[0.14em] text-stone-500">
        {title} <span className="text-stone-400">({items.length})</span>
      </h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.length ? (
          items.map((id) => (
            <span key={id} className="inline-flex items-center overflow-hidden rounded-full bg-stone-100 text-xs font-black text-stone-700">
              <button type="button" onClick={() => onRemove(id)} className="px-3 py-1.5 hover:bg-red-50 hover:text-red-800">
                {labelsById.get(id) ?? labelizeIngredient(id)} ×
              </button>
              {onPromote ? (
                <button
                  type="button"
                  onClick={() => onPromote(id)}
                  className="border-l border-white/80 px-2.5 py-1.5 text-amber-900 hover:bg-amber-100"
                  aria-label={`Move ${labelsById.get(id) ?? labelizeIngredient(id)} to Always Have`}
                  title="Move to Always Have"
                >
                  Always
                </button>
              ) : null}
            </span>
          ))
        ) : (
          <p className="text-sm font-semibold text-stone-500">None selected yet.</p>
        )}
      </div>
    </section>
  );
}

function BasicPantryRestoreShelf({
  ids,
  catalog,
  onRestore,
}: {
  ids: string[];
  catalog: IngredientCatalogItem[];
  onRestore: (id: string) => void;
}) {
  const labelsById = useMemo(() => new Map(catalog.map((ingredient) => [ingredient.id, ingredient.label])), [catalog]);

  if (!ids.length) return null;

  return (
    <section className="rounded-[16px] border border-amber-200 bg-amber-50/75 p-3">
      <h3 className="text-xs font-black uppercase tracking-[0.14em] text-amber-900">
        Restore basics <span className="text-amber-800/60">({ids.length})</span>
      </h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {ids.map((id) => (
          <button
            type="button"
            key={id}
            onClick={() => onRestore(id)}
            className="rounded-full border border-amber-900/25 bg-white px-3 py-1.5 text-xs font-black text-amber-900 hover:bg-amber-100"
          >
            {labelsById.get(id) ?? labelizeIngredient(id)} +
          </button>
        ))}
      </div>
    </section>
  );
}

function QuickIngredientChips({
  title,
  ingredients,
  selectedIds,
  onAdd,
}: {
  title: string;
  ingredients: IngredientCatalogItem[];
  selectedIds: Set<string>;
  onAdd: (id: string) => void;
}) {
  if (!ingredients.length) return null;

  return (
    <section>
      <h3 className="text-xs font-black uppercase tracking-[0.14em] text-stone-500">{title}</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {ingredients.map((ingredient) => {
          const selected = selectedIds.has(ingredient.id);

          return (
            <button
              type="button"
              key={`${title}-${ingredient.id}`}
              onClick={() => onAdd(ingredient.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-black ${
                selected ? "border-red-800 bg-red-800 text-white" : "border-stone-200 bg-white text-stone-700 hover:border-red-800/30 hover:bg-red-50"
              }`}
            >
              {ingredient.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function RecipeDetail({
  recipe,
  isFavourite,
  onToggleFavourite,
  onClose,
  onCook,
}: {
  recipe: RecipeLibraryEntry;
  isFavourite: boolean;
  onToggleFavourite: () => void;
  onClose: () => void;
  onCook: (recipe: RecipeLibraryEntry) => void;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [ingredientChecks, setIngredientChecks] = useState<Record<string, boolean>>({});
  const [ingredientChecksHydrated, setIngredientChecksHydrated] = useState(false);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    requestAnimationFrame(() => scrollContainerRef.current?.focus());

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer) return;

      const scrollKeys = new Set(["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "]);
      if (!scrollKeys.has(event.key)) return;

      event.preventDefault();

      if (event.key === "Home") {
        scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (event.key === "End") {
        scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: "smooth" });
        return;
      }

      const direction = event.key === "ArrowUp" || event.key === "PageUp" || (event.key === " " && event.shiftKey) ? -1 : 1;
      const amount = event.key.startsWith("Page") || event.key === " " ? scrollContainer.clientHeight * 0.85 : 56;
      scrollContainer.scrollBy({ top: direction * amount, behavior: "smooth" });
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(RECIPE_INGREDIENTS_STORAGE_KEY);
      if (stored) {
        setIngredientChecks(JSON.parse(stored) as Record<string, boolean>);
      }
    } catch {
      setIngredientChecks({});
    } finally {
      setIngredientChecksHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!ingredientChecksHydrated) return;
    window.localStorage.setItem(RECIPE_INGREDIENTS_STORAGE_KEY, JSON.stringify(ingredientChecks));
  }, [ingredientChecks, ingredientChecksHydrated]);

  const toggleIngredientCheck = (key: string) => {
    setIngredientChecks((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  return (
    <div
      ref={scrollContainerRef}
      tabIndex={-1}
      className="fixed inset-0 z-40 overflow-y-auto bg-stone-950/70 px-4 py-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={recipe.title}
      onClick={onClose}
    >
      <article
        className="mx-auto max-w-3xl rounded-[24px] border border-white/50 bg-white p-4 shadow-2xl sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-800">Full recipe</p>
            <h2 className="mt-1 text-3xl font-black text-stone-950">{recipe.title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-stone-100 px-4 py-2 text-sm font-black text-stone-700">
            Close
          </button>
        </div>

        <div className="relative mt-4 h-64 overflow-hidden rounded-[18px] bg-amber-100 sm:h-80">
          <Image src={getRecipeImageSrc(recipe.imageUrl)} alt={recipe.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 768px" quality={92} />
          <button
            type="button"
            onClick={onToggleFavourite}
            className={`absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full border shadow-lg backdrop-blur-sm transition ${
              isFavourite ? "border-amber-200 bg-amber-100/95 text-amber-700" : "border-white/80 bg-white/90 text-stone-500 hover:text-amber-700"
            }`}
            aria-pressed={isFavourite}
            aria-label={isFavourite ? `Remove ${recipe.title} from favourites` : `Add ${recipe.title} to favourites`}
          >
            <StarIcon filled={isFavourite} className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {recipe.prepTime ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-amber-950">Prep {recipe.prepTime}</span> : null}
          {recipe.serves ? <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-red-800">Serves {recipe.serves}</span> : null}
        </div>

        {recipe.description ? <p className="recipe-description-clamp mt-4 text-base font-semibold leading-7 text-stone-700">{cleanRecipeDescription(recipe.description)}</p> : null}

        <button
          type="button"
          onClick={() => onCook(recipe)}
          className="mt-5 w-full rounded-2xl bg-red-800 px-5 py-4 text-sm font-black uppercase tracking-[0.14em] text-white sm:w-auto"
        >
          Cook mode
        </button>

        {recipe.ingredients?.length ? (
          <section className="mt-5 rounded-[18px] border border-stone-200 bg-amber-50/70 p-4">
            <h3 className="text-sm font-black uppercase tracking-[0.16em] text-red-800">Ingredients</h3>
            <ul className="mt-3 grid gap-2 text-sm font-semibold text-stone-800 sm:grid-cols-2">
              {recipe.ingredients.map((ingredient, index) => {
                const ingredientKey = `${recipe.id}-${index}-${ingredient.item}`;
                const isChecked = Boolean(ingredientChecks[ingredientKey]);
                const ingredientText = `${ingredient.amount} ${ingredient.item}`.replace(/\s+/g, " ").trim();
                const strikeClass = HAND_STRIKE_CLASSES[index % HAND_STRIKE_CLASSES.length];

                return (
                  <li key={`${recipe.id}-detail-ingredient-${index}`}>
                    <button
                      type="button"
                      onClick={() => toggleIngredientCheck(ingredientKey)}
                      className="w-full rounded-[12px] bg-white px-3 py-2 text-left transition hover:bg-white/85 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-amber-500/25"
                      aria-pressed={isChecked}
                    >
                      <span className={isChecked ? `opacity-60 ${strikeClass}` : ""}>{ingredientText}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {recipe.instructions?.length ? (
          <section className="mt-5 rounded-[18px] border border-stone-200 bg-white p-4">
            <h3 className="text-sm font-black uppercase tracking-[0.16em] text-red-800">Instructions</h3>
            <ol className="mt-3 grid gap-3 text-base leading-7 text-stone-700">
              {recipe.instructions.map((step, index) => (
                <li key={`${recipe.id}-detail-step-${index}`} className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-black text-amber-950">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </article>
    </div>
  );
}

function CookMode({ recipe, onClose }: { recipe: RecipeLibraryEntry; onClose: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const touchStartXRef = useRef<number | null>(null);
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);
  const steps = recipe.instructions?.length ? recipe.instructions : ["Read the recipe, prep ingredients, and cook with confidence."];
  const goBack = () => setStepIndex((current) => Math.max(0, current - 1));
  const goNext = () => setStepIndex((current) => Math.min(steps.length - 1, current + 1));

  useEffect(() => {
    let cancelled = false;

    async function requestWakeLock() {
      try {
        const wakeLock = await navigator.wakeLock?.request("screen");
        if (!cancelled && wakeLock) {
          wakeLockRef.current = wakeLock;
        }
      } catch {
        wakeLockRef.current = null;
      }
    }

    requestWakeLock();

    return () => {
      cancelled = true;
      void wakeLockRef.current?.release();
      wakeLockRef.current = null;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-stone-950 text-white">
      <header className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">Cook mode</p>
          <h2 className="line-clamp-1 text-xl font-black">{recipe.title}</h2>
        </div>
        <button type="button" onClick={onClose} className="rounded-full bg-white px-4 py-2 font-black text-stone-950">Close</button>
      </header>
      <main
        className="flex flex-1 flex-col justify-center p-6"
        onTouchStart={(event) => {
          touchStartXRef.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          const startX = touchStartXRef.current;
          const endX = event.changedTouches[0]?.clientX;
          touchStartXRef.current = null;
          if (startX == null || endX == null) return;
          const delta = endX - startX;
          if (Math.abs(delta) < 48) return;
          if (delta < 0) {
            goNext();
          } else {
            goBack();
          }
        }}
      >
        <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-200">Step {stepIndex + 1} of {steps.length}</p>
        <p className="mt-4 text-3xl font-black leading-tight sm:text-5xl">{steps[stepIndex]}</p>
      </main>
      <footer className="grid grid-cols-2 gap-2 p-4">
        <button type="button" onClick={goBack} className="rounded-2xl bg-white/10 py-4 font-black">Back</button>
        <button type="button" onClick={goNext} className="rounded-2xl bg-white/10 py-4 font-black">Next</button>
      </footer>
    </div>
  );
}

function GroceryList({ groceryList }: { groceryList: Record<GroceryGroup, string[]> }) {
  const [exportStatus, setExportStatus] = useState("");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);
  const [isMobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const populatedGroups = (Object.keys(groceryLabels) as GroceryGroup[]).filter((group) => groceryList[group].length);
  const hasGroceryItems = populatedGroups.length > 0;
  const groceryKeys = useMemo(
    () =>
      populatedGroups.flatMap((group) =>
        groceryList[group].map((item) => ({
          key: getGroceryCheckKey(group, item),
          item,
        })),
      ),
    [groceryList, populatedGroups],
  );
  const checkedCount = groceryKeys.filter(({ key }) => checkedItems[key]).length;
  const remainingCount = groceryKeys.length - checkedCount;
  const exportText = populatedGroups
    .map((group) => `${groceryLabels[group]}\n${groceryList[group].map((item) => `☐ ${item}`).join("\n")}`)
    .join("\n\n");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(GROCERY_CHECKS_STORAGE_KEY);
      if (stored) {
        setCheckedItems(JSON.parse(stored) as Record<string, boolean>);
      }
    } catch {
      // Ignore localStorage issues so the planner still works in private browsers.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    window.localStorage.setItem(GROCERY_CHECKS_STORAGE_KEY, JSON.stringify(checkedItems));
  }, [checkedItems, hydrated]);

  useEffect(() => {
    if (!isMobileDrawerOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileDrawerOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isMobileDrawerOpen]);

  function toggleGroceryItem(group: GroceryGroup, item: string) {
    const key = getGroceryCheckKey(group, item);
    setCheckedItems((current) => ({ ...current, [key]: !current[key] }));
  }

  function clearChecks() {
    setCheckedItems({});
  }

  async function shareList() {
    if (!exportText) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Five-day shopping list",
          text: exportText,
        });
        setExportStatus("Share sheet opened");
        return;
      }

      await copyList();
    } catch {
      setExportStatus("Share canceled");
    }
  }

  async function copyList() {
    if (!exportText) return;

    try {
      await navigator.clipboard.writeText(exportText);
      setExportStatus("Copied to clipboard");
    } catch {
      setExportStatus("Copy failed");
    }
  }

  function printList() {
    if (!exportText) return;

    const printFrame = document.createElement("iframe");
    printFrame.setAttribute("aria-hidden", "true");
    printFrame.style.position = "fixed";
    printFrame.style.right = "0";
    printFrame.style.bottom = "0";
    printFrame.style.width = "1px";
    printFrame.style.height = "1px";
    printFrame.style.border = "0";
    printFrame.style.opacity = "0";
    printFrame.style.pointerEvents = "none";
    document.body.appendChild(printFrame);

    const printWindow = printFrame.contentWindow;
    const printDocument = printWindow?.document;
    if (!printWindow || !printDocument) {
      printFrame.remove();
      setExportStatus("Print failed");
      return;
    }

    printDocument.write(`
      <!doctype html>
      <html>
        <head>
          <title>Five-day shopping list</title>
          <style>
            body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 32px; color: #1c1917; }
            h1 { font-size: 24px; margin: 0 0 24px; }
            pre { font: 16px/1.7 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <h1>Five-day shopping list</h1>
          <pre>${escapeHtml(exportText)}</pre>
        </body>
      </html>
    `);
    printDocument.close();

    const cleanupPrintFrame = () => {
      window.setTimeout(() => printFrame.remove(), 500);
    };

    printWindow.onafterprint = cleanupPrintFrame;
    window.setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
        setExportStatus("Print opened");
        window.setTimeout(() => printFrame.remove(), 60000);
      } catch {
        printFrame.remove();
        setExportStatus("Print failed");
      }
    }, 100);
  }

  const header = (
    <>
      <div>
        <p className="whitespace-nowrap text-xs font-black uppercase tracking-[0.2em] text-red-800">Aisle grouped</p>
        <h2 className="mt-1 whitespace-nowrap text-2xl font-black leading-tight text-stone-950">Smart Shopping List</h2>
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="flex flex-col items-start gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-red-800">
              {remainingCount} left
            </span>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-amber-900">
              {checkedCount} done
            </span>
          </div>
          {checkedCount ? (
            <button type="button" onClick={clearChecks} className="text-xs font-black uppercase tracking-[0.12em] text-stone-500 underline-offset-4 hover:text-red-800 hover:underline sm:ml-3">
              Clear checked items
            </button>
          ) : null}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={shareList}
            disabled={!exportText}
            className="rounded-xl bg-red-800 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white disabled:bg-stone-300 sm:hidden"
          >
            Share
          </button>
          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={copyList}
              disabled={!exportText}
              className="grid h-8 w-8 place-items-center rounded-lg bg-red-800 text-white disabled:bg-stone-300"
              aria-label="Copy shopping list"
              title="Copy shopping list"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-[2.4]">
                <rect x="8" y="8" width="10" height="12" rx="2" />
                <path d="M6 16H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
            <button
              type="button"
              onClick={printList}
              disabled={!exportText}
              className="grid h-8 w-8 place-items-center rounded-lg border border-red-800 text-red-800 disabled:border-stone-300 disabled:text-stone-300"
              aria-label="Print shopping list"
              title="Print shopping list"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-[2.4]">
                <path d="M7 8V3h10v5" />
                <path d="M7 17H5a3 3 0 0 1-3-3v-3a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3h-2" />
                <path d="M7 14h10v7H7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {exportStatus ? <p className="mt-2 text-sm font-bold text-red-800">{exportStatus}</p> : null}
    </>
  );

  const list = hasGroceryItems ? (
    <div className="mt-4 grid gap-3">
      {populatedGroups.map((group) => (
        <section key={group}>
          <h3 className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-amber-950">
            {groceryLabels[group]}
          </h3>
          <ul className="mt-2 divide-y divide-stone-200/80 text-sm font-semibold">
            {groceryList[group].map((item, index) => {
              const isChecked = Boolean(checkedItems[getGroceryCheckKey(group, item)]);
              const strikeClass = HAND_STRIKE_CLASSES[index % HAND_STRIKE_CLASSES.length];

              return (
                <li key={item}>
                  <button
                    type="button"
                    onClick={() => toggleGroceryItem(group, item)}
                    className={`flex w-full items-start gap-2 py-2 text-left transition ${
                      isChecked ? "text-stone-400" : "text-stone-800 hover:text-red-900"
                    }`}
                    aria-pressed={isChecked}
                  >
                    <span
                      className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border transition ${
                        isChecked ? "border-stone-300 bg-stone-100 text-stone-500" : "border-red-800/35 bg-white text-transparent"
                      }`}
                      aria-hidden="true"
                    >
                      <svg viewBox="0 0 16 16" className="h-3 w-3 fill-none stroke-current stroke-[2.5]">
                        <path d="M3.5 8.2 6.5 11 12.5 4.5" />
                      </svg>
                    </span>
                    <span className={isChecked ? `inline-block opacity-70 ${strikeClass}` : ""}>{item}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  ) : (
    <div className="mt-4 rounded-[16px] border border-dashed border-stone-300 bg-amber-50/60 px-4 py-5 text-sm font-bold text-stone-500">
      Add recipes to your week to build your shopping list.
    </div>
  );

  return (
    <>
      <aside className="hidden rounded-[24px] border border-white/50 bg-white p-4 shadow-xl shadow-red-950/10 sm:p-5 lg:block">
        {header}
        {list}
      </aside>

      <div className="lg:hidden">
        {isMobileDrawerOpen ? (
          <button
            type="button"
            aria-label="Collapse grocery list"
            className="fixed inset-0 z-40 bg-stone-950/20"
            onClick={() => setMobileDrawerOpen(false)}
          />
        ) : null}
        <aside
          className={`fixed inset-x-0 bottom-0 z-50 overflow-hidden rounded-t-[28px] border border-white/70 bg-white shadow-[0_-18px_45px_rgba(28,25,23,0.22)] transition-[height] duration-300 ease-out ${
            isMobileDrawerOpen ? "h-[82vh]" : "h-[84px]"
          }`}
          aria-label="Grocery list"
        >
          <button
            type="button"
            onClick={() => setMobileDrawerOpen((current) => !current)}
            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
            aria-expanded={isMobileDrawerOpen}
          >
            <span className="min-w-0">
              <span className="mx-auto mb-3 block h-1 w-12 rounded-full bg-stone-300" aria-hidden="true" />
              <span className="block text-xs font-black uppercase tracking-[0.18em] text-red-800">Grocery list</span>
              <span className="block text-lg font-black leading-tight text-stone-950">
                {groceryKeys.length} {groceryKeys.length === 1 ? "item" : "items"} · {isMobileDrawerOpen ? "tap to collapse" : "tap to expand"}
              </span>
            </span>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-red-50 text-red-800" aria-hidden="true">
              <svg viewBox="0 0 20 20" className={`h-4 w-4 fill-none stroke-current stroke-[2.5] transition ${isMobileDrawerOpen ? "rotate-180" : ""}`}>
                <path d="m5 12 5-5 5 5" />
              </svg>
            </span>
          </button>
          {isMobileDrawerOpen ? (
            <div className="h-[calc(82vh-84px)] overflow-y-auto px-5 pb-6 pt-1">
              {header}
              {list}
            </div>
          ) : null}
        </aside>
      </div>
    </>
  );
}

function RecipeResult({
  recipe,
  plan,
  isAddMenuOpen,
  addedDay,
  onToggleAddMenu,
  onAddToDay,
  onView,
}: {
  recipe: RecipeLibraryEntry;
  plan: Plan;
  isAddMenuOpen: boolean;
  addedDay: Day | null;
  onToggleAddMenu: () => void;
  onAddToDay: (day: Day) => void;
  onView: (recipe: RecipeLibraryEntry) => void;
}) {
  const tags = getRecipeCardTags(recipe);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onView(recipe)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onView(recipe);
        }
      }}
      className="recipe-tap-card group relative grid cursor-pointer grid-cols-[76px_minmax(0,1fr)] gap-3 rounded-[18px] border border-transparent bg-white p-3 text-left shadow-lg shadow-red-950/15 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-red-800/25 sm:grid-cols-[96px_minmax(0,1fr)]"
      aria-label={`View ${recipe.title}`}
    >
      <div
        className="relative block h-[76px] w-[76px] shrink-0 overflow-hidden rounded-[14px] bg-amber-100 sm:h-24 sm:w-24"
        aria-label={`View ${recipe.title}`}
      >
        <Image
          src={getRecipeImageSrc(recipe.imageUrl)}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 639px) 152px, 240px"
          quality={100}
        />
      </div>
      <div className="min-w-0">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1 text-left">
            <h3 className="whitespace-normal break-words font-black leading-tight text-stone-950">{recipe.title}</h3>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="relative" data-smart-add-menu>
              <button
                type="button"
                onKeyDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleAddMenu();
                }}
                className="rounded-full bg-red-800 px-3 py-2 text-[0.68rem] font-black uppercase tracking-[0.12em] text-white shadow-sm hover:bg-red-900"
                aria-expanded={isAddMenuOpen}
                aria-haspopup="menu"
              >
                Add
              </button>
              {isAddMenuOpen ? (
                <div
                  className="absolute right-0 top-full z-30 mt-2 w-72 overflow-hidden rounded-[18px] border border-stone-200 bg-white p-2 shadow-2xl shadow-stone-950/20"
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  {days.map((day) => {
                    const plannedRecipe = plan[day]?.recipe ?? null;

                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onAddToDay(day);
                        }}
                        className="grid w-full grid-cols-[42px_minmax(0,1fr)] gap-3 rounded-[14px] px-3 py-2 text-left transition hover:bg-amber-50 focus:bg-amber-50 focus:outline-none"
                        role="menuitem"
                      >
                        <span className="font-black text-red-900">{day}</span>
                        <span className="min-w-0">
                          <span className="block whitespace-normal break-words text-sm font-black leading-tight text-stone-950">{plannedRecipe?.title ?? "Empty"}</span>
                          <span className="block text-xs font-semibold text-stone-500">{plannedRecipe ? "Swap this slot" : "Add here"}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <p className="mt-1 text-sm font-semibold text-stone-500">{recipe.prepTime ?? "Weeknight"} · {recipe.serves ? `Serves ${recipe.serves}` : "Dinner"}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {tags.map((tag) => (
            <span key={tag} className="rounded-full bg-amber-50 px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.08em] text-red-800">
              {tag}
            </span>
          ))}
          {addedDay ? (
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.08em] text-emerald-800">
              Added to {addedDay}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function StarIcon({ filled, className = "h-6 w-6" }: { filled: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={[className, filled ? "text-amber-600" : "text-stone-500"].join(" ")}
      fill={filled ? "currentColor" : "white"}
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m12 3.25 2.66 5.39 5.95.87-4.3 4.2 1.01 5.92L12 16.83l-5.32 2.8 1.01-5.92-4.3-4.2 5.95-.87L12 3.25Z" />
    </svg>
  );
}

function MiniRecipe({ recipe }: { recipe: RecipeLibraryEntry }) {
  return (
    <div className="mt-4 min-w-0">
      <p className="text-sm font-black leading-tight text-stone-950">{recipe.title}</p>
    </div>
  );
}

function Thumb({ recipe, variant = "result", loading = "lazy" }: { recipe: RecipeLibraryEntry; variant?: "result" | "slot"; loading?: "eager" | "lazy" }) {
  const className =
    variant === "slot"
      ? "relative block h-14 w-14 shrink-0 overflow-hidden rounded-[12px] bg-amber-100 sm:h-16 sm:w-full"
      : "relative block h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[14px] bg-amber-100";
  const sizes = variant === "slot" ? "(max-width: 639px) 56px, 160px" : "72px";

  return (
    <span className={className}>
      <Image src={getRecipeImageSrc(recipe.imageUrl)} alt="" fill className="object-cover" sizes={sizes} quality={92} loading={loading} unoptimized />
    </span>
  );
}

function applySmartFilters(
  recipes: RecipeLibraryEntry[],
  filters: { quick: boolean; vegetarian: boolean; fish: boolean; meat: boolean; sheetPan: boolean },
  excludeText: string,
  search: string,
) {
  const exclusions = tokenize(excludeText);
  const queryTerms = tokenize(search);

  return recipes.filter((recipe) => {
    const haystack = recipeHaystack(recipe);
    if (queryTerms.length && !queryTerms.every((term) => searchTermMatches(haystack, term))) return false;
    if (exclusions.some((term) => searchTermMatches(haystack, term))) return false;
    if (filters.quick && getPrepMinutes(recipe.prepTime) > 30) return false;
    if (filters.sheetPan && !haystack.includes("sheet pan") && !haystack.includes("sheet-pan")) return false;
    if (filters.vegetarian && getRecipeKind(recipe) !== "vegetarian") return false;
    if (filters.fish && getRecipeKind(recipe) !== "fish") return false;
    if (filters.meat && getRecipeKind(recipe) !== "meat") return false;
    return true;
  });
}

function buildGroceryList(plan: Plan) {
  const groups: Record<GroceryGroup, Set<string>> = {
    produce: new Set(),
    protein: new Set(),
    pantry: new Set(),
    fridge: new Set(),
    frozen: new Set(),
  };

  for (const slot of Object.values(plan)) {
    const recipe = slot?.recipe;
    if (!recipe) continue;

    for (const ingredient of recipe?.ingredients ?? []) {
      groups[ingredient.category].add(`${ingredient.amount} ${ingredient.item}`.replace(/\s+/g, " ").trim());
    }
  }

  return Object.fromEntries(
    Object.entries(groups).map(([group, items]) => [group, Array.from(items).sort((a, b) => a.localeCompare(b))]),
  ) as Record<GroceryGroup, string[]>;
}

function getGroceryCheckKey(group: GroceryGroup, item: string) {
  return `${group}:${item.toLowerCase()}`;
}

type IngredientImportance = "blocker" | "primary" | "medium" | "garnish" | "free";

const INGREDIENT_DESCRIPTOR_WORDS = new Set([
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "large",
  "small",
  "medium",
  "fresh",
  "freshly",
  "packed",
  "roughly",
  "thin",
  "thick",
  "boneless",
  "skinless",
  "unsalted",
  "seedless",
  "clove",
  "piece",
  "head",
  "inch",
  "ounce",
  "pound",
  "pinch",
  "dash",
  "sprig",
  "slice",
  "wedge",
  "wedges",
  "half",
  "halves",
  "can",
  "jar",
  "bunch",
  "fillet",
  "filet",
  "steak",
  "block",
  "package",
  "portion",
  "bite-size",
  "light",
  "white",
  "green",
  "part",
  "parts",
  "leaf",
  "leaves",
  "store-bought",
  "homemade",
]);

const INGREDIENT_FORM_WORDS = new Set([
  "of",
  "from",
  "for",
  "serving",
  "taste",
  "grated",
  "shredded",
  "minced",
  "peeled",
  "deveined",
  "trimmed",
  "removed",
  "rinsed",
  "thawed",
  "halved",
  "quartered",
  "crushed",
  "smashed",
  "toasted",
  "cooked",
  "dried",
  "dry",
  "ground",
  "whole",
  "finely",
  "coarsely",
  "roughly",
  "divided",
  "drizzling",
  "cut",
  "sliced",
  "skin",
]);

const CITRUS_FORM_WORDS = new Set(["juice", "juiced", "zest", "zested", "peel", "squeezed", "squeezing"]);
const CITRUS_INGREDIENTS = ["lemon", "lime", "orange", "grapefruit", "tangerine"];

function canonicalizeIngredient(value: string) {
  const normalized = singularize(
    normalizeIngredient(value)
      .replace(/\bextra[-\s]+virgin\b/g, " ")
      .replace(/\btomatoe\b/g, "tomato")
      .replace(/\bblack pepper\b/g, "pepper")
      .replace(/\blime juice\b/g, "lime")
      .replace(/\blemon juice\b/g, "lemon")
      .replace(/\b(?:bone|skin)-in\b/g, " ")
      .replace(/\bpatted dry\b/g, " ")
      .replace(/\b(or|and|plus|more|as needed|for serving|to taste)\b/g, " ")
      .replace(/\b(low sodium|extra virgin)\b/g, " "),
  );
  const words = normalized.split(/\s+/).filter(Boolean);
  const withoutDescriptors = words.filter(
    (word) =>
      !/^\d+(?:-\d+)?$/.test(word) &&
      !INGREDIENT_DESCRIPTOR_WORDS.has(word) &&
      !INGREDIENT_FORM_WORDS.has(word),
  );

  const canonical = withoutDescriptors.join(" ").trim();

  for (const citrus of CITRUS_INGREDIENTS) {
    if (
      canonical === citrus ||
      (words.includes(citrus) &&
        words.every(
          (word) => word === citrus || INGREDIENT_DESCRIPTOR_WORDS.has(word) || INGREDIENT_FORM_WORDS.has(word) || CITRUS_FORM_WORDS.has(word),
        ))
    ) {
      return citrus;
    }
  }

  if (canonical.includes("salmon")) return "salmon";
  if (canonical.includes("chicken")) {
    if (/\b(stock|broth)\b/.test(canonical)) return "chicken stock";
    if (canonical.includes("thigh")) return "chicken thigh";
    if (canonical.includes("breast")) return "chicken breast";
    if (canonical.includes("drumstick")) return "chicken drumstick";
    if (canonical.includes("leg")) return "chicken leg";
    if (canonical.includes("wing")) return "chicken wing";
    return "chicken";
  }
  if (canonical.includes("shrimp")) return "shrimp";
  if (canonical.includes("tofu")) return "tofu";
  if (canonical.includes("cod")) return "cod";
  if (canonical.includes("halibut")) return "halibut";
  if (canonical.includes("trout")) return "trout";
  if (canonical.includes("tuna")) return "tuna";
  if (canonical.includes("asparag")) return "asparagus";
  if (canonical.includes("chickpea")) return "chickpea";
  if (canonical.includes("chile") || canonical.includes("chili")) return canonical.includes("powder") ? "chile powder" : "chile";
  if (canonical.includes("scallion") || canonical.includes("green onion")) return "scallion";
  if (canonical.includes("basil")) return "basil";
  if (canonical.includes("parsley")) return "parsley";
  if (canonical.includes("cilantro")) return "cilantro";
  if (canonical.includes("mint")) return "mint";
  if (canonical.includes("cherry tomato") || canonical.includes("grape tomato")) return "cherry tomatoes";
  if (canonical.includes("tomato")) return "tomato";
  if (canonical.includes("salad green") || (canonical.includes("green") && canonical.includes("salad"))) return "salad greens";
  if (canonical.includes("leaf lettuce")) return "leaf lettuce";
  if (canonical.includes("lettuce")) return "lettuce";
  if (canonical.includes("ssamjang")) return "ssamjang";

  if (canonical.includes("garlic")) {
    if (canonical.includes("sauce") && /\bchil(?:e|i)\b/.test(canonical)) return "chile-garlic sauce";
    if (canonical.includes("powder")) return "garlic powder";
    return "garlic";
  }

  return canonical;
}

function labelizeIngredient(id: string) {
  return id.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const BASIC_PANTRY_PRESET = [
  "salt",
  "pepper",
  "olive oil",
  "neutral oil",
  "butter",
  "sugar",
  "flour",
  "vinegar",
  "soy sauce",
  "garlic",
  "onion",
  "rice",
  "pasta",
  "red pepper flakes",
];

const BASIC_PANTRY_IDS = BASIC_PANTRY_PRESET.map(canonicalizeIngredient);

const FRIDGE_STARTER_INGREDIENTS = [
  "chicken thigh",
  "salmon",
  "egg",
  "broccoli",
  "asparagus",
  "lemon",
  "lime",
  "tomato",
  "mushroom",
  "feta",
].map(canonicalizeIngredient);

const FREE_STAPLES = new Set(
  [
    ...BASIC_PANTRY_PRESET,
    "water",
    "kosher salt",
    "black pepper",
    "salt pepper",
    "oil",
    "extra virgin olive oil",
    "vegetable oil",
    "canola oil",
    "honey",
    "cumin",
    "paprika",
    "turmeric",
    "oregano",
    "thyme",
    "cinnamon",
    "cornstarch",
  ].map(canonicalizeIngredient),
);

const SUBSTITUTION_GROUPS = [
  ["scallion", "chive", "green onion"],
  ["cilantro", "parsley", "mint", "basil"],
  ["lemon", "lime"],
  ["vinegar", "rice vinegar", "sherry vinegar", "red wine vinegar", "white wine vinegar", "balsamic vinegar"],
  ["soy sauce", "tamari"],
  ["yogurt", "sour cream"],
  ["parmesan", "pecorino"],
  ["mozzarella", "fontina"],
  ["salmon", "fish", "cod", "trout"],
  ["chickpea", "white bean", "black bean", "lentil"],
].map((group) => group.map(canonicalizeIngredient));

const PRIMARY_PROTEINS = [
  "chicken",
  "salmon",
  "fish",
  "cod",
  "trout",
  "shrimp",
  "tuna",
  "tofu",
  "beef",
  "pork",
  "sausage",
  "turkey",
  "lamb",
  "egg",
  "chickpea",
  "lentil",
  "white bean",
  "black bean",
].map(canonicalizeIngredient);

const PRIMARY_VEGETABLES = [
  "asparagus",
  "broccoli",
  "cauliflower",
  "tomato",
  "zucchini",
  "mushroom",
  "spinach",
  "kale",
  "green bean",
  "brussels sprout",
  "sweet potato",
  "potato",
  "corn",
  "eggplant",
  "cabbage",
  "snap pea",
].map(canonicalizeIngredient);

const GARNISHES = [
  "sesame seed",
  "cilantro",
  "parsley",
  "mint",
  "basil",
  "chive",
  "scallion",
  "lemon",
  "lime",
  "peanut",
  "almond",
  "cashew",
  "red pepper flakes",
].map(canonicalizeIngredient);

const MEDIUM_INGREDIENTS = [
  "garlic",
  "ginger",
  "shallot",
  "onion",
  "miso",
  "gochujang",
  "coconut milk",
  "feta",
  "parmesan",
  "ricotta",
  "mozzarella",
  "capers",
  "olives",
].map(canonicalizeIngredient);

function buildIngredientCatalog(recipes: RecipeLibraryEntry[]) {
  const ingredients = new Map<string, IngredientCatalogItem>();

  for (const item of BASIC_PANTRY_PRESET) {
    const id = canonicalizeIngredient(item);
    ingredients.set(id, { id, label: labelizeIngredient(id), count: 0, priority: true, group: "pantry" });
  }

  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredients ?? []) {
      const id = canonicalizeIngredient(ingredient.item);
      if (!id || FREE_STAPLES.has(id)) continue;

      const existing = ingredients.get(id);
      const importance = getIngredientImportance(id, ingredient.category);
      ingredients.set(id, {
        id,
        label: existing?.label ?? labelizeIngredient(id),
        count: (existing?.count ?? 0) + 1,
        priority: existing?.priority || importance !== "garnish",
        group: existing?.group ?? ingredient.category,
      });
    }
  }

  return [...ingredients.values()].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority ? -1 : 1;
    if (a.count !== b.count) return b.count - a.count;
    return a.label.localeCompare(b.label);
  });
}

function getIngredientSearchRelevance(ingredient: IngredientCatalogItem, terms: string[]) {
  if (!terms.length) return ingredient.priority ? 2 : 1;
  const searchable = `${ingredient.label} ${ingredient.id}`;
  if (!terms.every((term) => searchTermMatches(searchable, term))) return 0;
  const normalizedLabel = singularize(normalizeIngredient(ingredient.label).replace(/-/g, " "));
  const normalizedId = singularize(normalizeIngredient(ingredient.id).replace(/-/g, " "));
  const startsWithTerm = terms.some((term) => normalizedLabel.startsWith(term) || normalizedId.startsWith(term));

  return (startsWithTerm ? 20 : 10) + (ingredient.priority ? 4 : 0) + Math.min(ingredient.count, 12) / 12;
}

function groupIngredientCatalogItems<T extends IngredientCatalogItem>(ingredients: T[]) {
  const groups = new Map<GroceryGroup, T[]>();

  for (const ingredient of ingredients) {
    const group = ingredient.group;
    groups.set(group, [...(groups.get(group) ?? []), ingredient]);
  }

  const orderedGroups: GroceryGroup[] = ["protein", "produce", "fridge", "pantry", "frozen"];
  return orderedGroups
    .filter((group) => groups.has(group))
    .map((group) => ({
      group,
      ingredients: groups.get(group) ?? [],
    }));
}

function countGroceryItems(groceryList: Record<GroceryGroup, string[]>) {
  return Object.values(groceryList).reduce((total, items) => total + items.length, 0);
}

function matchFridgeRecipes(recipes: RecipeLibraryEntry[], pantryIngredients: Set<string>, weekIngredients: Set<string>) {
  const available = new Set([...FREE_STAPLES, ...pantryIngredients, ...weekIngredients]);
  const activeSelections = new Set([...pantryIngredients, ...weekIngredients]);
  const equivalents = buildEquivalentMap(available);

  return recipes
    .map((recipe) => {
      const recipeIngredients = dedupeRecipeIngredients(recipe);
      const matched = recipeIngredients.filter((ingredient) => isIngredientCovered(ingredient.id, activeSelections, equivalents));
      const covered = recipeIngredients.filter((ingredient) => isIngredientCovered(ingredient.id, available, equivalents));
      const missingIngredients = recipeIngredients.filter((ingredient) => !covered.some((coveredIngredient) => coveredIngredient.id === ingredient.id));
      const visibleMissingIngredients = missingIngredients
        .filter((ingredient) => ingredient.importance !== "free")
        .sort((a, b) => getIngredientWeight(b.importance) - getIngredientWeight(a.importance));
      const weightedMissing = missingIngredients.reduce((total, ingredient) => total + getIngredientWeight(ingredient.importance), 0);
      const blockerMissing = missingIngredients.filter((ingredient) => ingredient.importance === "blocker").length;
      const missingCount = visibleMissingIngredients.length;
      const weekMatched = matched.filter((ingredient) => isIngredientCovered(ingredient.id, weekIngredients, equivalents)).length;
      const coverage = covered.length / Math.max(recipeIngredients.length, 1);
      const score = weekMatched * 16 + matched.length * 5 + coverage * 12 - weightedMissing * 2.5 - blockerMissing * 18;

      return {
        recipe,
        matched: matched.map((ingredient) => ingredient.label),
        missing: visibleMissingIngredients.map((ingredient) => ingredient.label),
        score,
        blockerMissing,
        missingCount,
        matchRank: getFridgeMatchRank(missingCount, blockerMissing),
        badge: getFridgeBadge(missingCount, blockerMissing),
      };
    })
    .filter((match) => match.matched.length > 0 || match.score > 0)
    .sort((a, b) => a.matchRank - b.matchRank || b.score - a.score || a.recipe.title.localeCompare(b.recipe.title));
}

function summarizeFridgeMatches(matches: ReturnType<typeof matchFridgeRecipes>) {
  return {
    ready: matches.filter((match) => match.missing.length === 0).length,
    oneMissing: matches.filter((match) => match.missingCount === 1).length,
    missingTwoOrMore: matches.filter((match) => match.missingCount >= 2).length,
  };
}

function dedupeRecipeIngredients(recipe: RecipeLibraryEntry) {
  const ingredients = new Map<string, { id: string; label: string; importance: IngredientImportance }>();

  for (const ingredient of recipe.ingredients ?? []) {
    const id = canonicalizeIngredient(ingredient.item);
    if (!id) continue;

    const importance = getIngredientImportance(id, ingredient.category);
    const existing = ingredients.get(id);
    if (!existing || getIngredientWeight(importance) > getIngredientWeight(existing.importance)) {
      ingredients.set(id, { id, label: labelizeIngredient(id), importance });
    }
  }

  return [...ingredients.values()];
}

function getIngredientImportance(id: string, category?: GroceryGroup): IngredientImportance {
  if (FREE_STAPLES.has(id)) return "free";
  if (PRIMARY_PROTEINS.includes(id) || category === "protein") return "blocker";
  if (PRIMARY_VEGETABLES.includes(id) || category === "produce" || category === "frozen") return "primary";
  if (GARNISHES.includes(id)) return "garnish";
  if (MEDIUM_INGREDIENTS.includes(id) || category === "fridge") return "medium";
  return "medium";
}

function getIngredientWeight(importance: IngredientImportance) {
  const weights: Record<IngredientImportance, number> = {
    blocker: 8,
    primary: 4,
    medium: 2,
    garnish: 0.5,
    free: 0,
  };

  return weights[importance];
}

function getFridgeBadge(missingCount: number, blockerMissing: number) {
  if (missingCount === 0) return "Ready to cook";
  if (blockerMissing) return `Missing ${blockerMissing} main item${blockerMissing === 1 ? "" : "s"}`;
  return `Missing ${missingCount} item${missingCount === 1 ? "" : "s"}`;
}

function getFridgeMatchRank(missingCount: number, blockerMissing: number) {
  if (missingCount === 0) return 0;
  if (blockerMissing) return 4;
  if (missingCount === 1) return 1;
  if (missingCount === 2) return 2;
  return 3;
}

function buildEquivalentMap(available: Set<string>) {
  const equivalents = new Map<string, Set<string>>();

  for (const item of available) {
    equivalents.set(item, new Set([item]));
  }

  for (const group of SUBSTITUTION_GROUPS) {
    const hasAvailableSubstitute = group.some((item) => available.has(item));
    if (!hasAvailableSubstitute) continue;

    for (const item of group) {
      const current = equivalents.get(item) ?? new Set([item]);
      group.forEach((substitute) => current.add(substitute));
      equivalents.set(item, current);
    }
  }

  return equivalents;
}

function isIngredientCovered(ingredientId: string, available: Set<string>, equivalents: Map<string, Set<string>>) {
  if (available.has(ingredientId)) return true;
  const substitutes = equivalents.get(ingredientId);
  if (!substitutes) return false;
  return [...substitutes].some((item) => available.has(item));
}

function getRecipeKind(recipe: RecipeLibraryEntry) {
  const haystack = recipeHaystack(recipe);
  if (/(salmon|fish|tuna|shrimp|seafood|cod|trout)/i.test(haystack)) return "fish";
  if (/(chicken|sausage|beef|pork|turkey|meatball|lamb)/i.test(haystack)) return "meat";
  return "vegetarian";
}

function getEmptySmartFilterSelections(): SmartFilterSelections {
  return {
    time: [],
    diet: [],
    protein: [],
    method: [],
  };
}

function applySmartFilterSelections(
  recipes: RecipeLibraryEntry[],
  selections: SmartFilterSelections,
  search: string,
  hiddenTerms: string[],
) {
  const queryTerms = tokenize(search);

  return recipes.filter((recipe) => {
    const haystack = recipeHaystack(recipe);
    if (queryTerms.length && !queryTerms.every((term) => searchTermMatches(haystack, term))) return false;
    if (hiddenTerms.length && recipeMatchesHiddenIngredients(recipe, hiddenTerms)) return false;

    return SMART_FILTER_GROUPS.every((group) => {
      const selectedIds = selections[group.id];
      if (!selectedIds.length) return true;

      return group.options.some((option) => selectedIds.includes(option.id) && option.matches(recipe));
    });
  });
}

function countSmartFilterOption(
  recipes: RecipeLibraryEntry[],
  selections: SmartFilterSelections,
  groupId: SmartFilterGroupId,
  option: SmartFilterOption,
  search: string,
) {
  const nextSelections = { ...selections, [groupId]: [option.id] };
  return applySmartFilterSelections(recipes, nextSelections, search, []).length;
}

function getSelectedSmartFilterLabels(selections: SmartFilterSelections) {
  return SMART_FILTER_GROUPS.flatMap((group) =>
    group.options
      .filter((option) => selections[group.id].includes(option.id))
      .map((option) => option.label),
  );
}

function recipeMatchesHiddenIngredients(recipe: RecipeLibraryEntry, hiddenTerms: string[]) {
  if (!hiddenTerms.length) return false;
  const ingredientText = (recipe.ingredients ?? []).map((ingredient) => ingredient.item).join(" ");
  const haystack = ingredientText || recipeHaystack(recipe);

  return hiddenTerms.some((term) => searchTermMatches(haystack, term));
}

function sortSmartFilterRecipes(recipes: RecipeLibraryEntry[], sortKey: SortKey) {
  return [...recipes].sort((a, b) => {
    if (sortKey === "alpha") return a.title.localeCompare(b.title);
    if (sortKey === "recent") return b.id.localeCompare(a.id);
    if (sortKey === "popular") return getRecipePopularityScore(b) - getRecipePopularityScore(a) || a.title.localeCompare(b.title);

    return getPrepMinutes(a.prepTime) - getPrepMinutes(b.prepTime) || a.title.localeCompare(b.title);
  });
}

function getRecipePopularityScore(recipe: RecipeLibraryEntry) {
  const haystack = recipeHaystack(recipe);
  let score = 0;
  if (recipe.imageUrl && !recipe.imageUrl.includes("planner-logo")) score += 8;
  if (/quick|weeknight|easy|one[-\s]?(pot|pan)|sheet[-\s]?pan/i.test(haystack)) score += 5;
  if (recipe.ingredients?.length) score += Math.min(6, recipe.ingredients.length / 2);
  if (recipe.instructions?.length) score += Math.min(6, recipe.instructions.length);
  return score;
}

function getRecipeCardTags(recipe: RecipeLibraryEntry) {
  const tags = new Set<string>();
  const kind = getRecipeKind(recipe);
  if (kind === "vegetarian") tags.add("Vegetarian");
  if (kind === "fish") tags.add("Fish");
  if (kind === "meat") tags.add("Meat");
  if (isLowCarbRecipe(recipe)) tags.add("Low carb");

  for (const group of SMART_FILTER_GROUPS) {
    if (group.id === "protein" || group.id === "diet") continue;
    const match = group.options.find((option) => option.matches(recipe));
    if (match) tags.add(match.label);
  }

  if (recipeHaystack(recipe).includes("tofu")) tags.add("Tofu");
  return [...tags].slice(0, 3);
}

function recipeHaystack(recipe: RecipeLibraryEntry) {
  return [recipe.title, recipe.description, recipe.prepTime, ...(recipe.tags ?? []), ...(recipe.ingredients ?? []).map((item) => item.item)]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isLowCarbRecipe(recipe: RecipeLibraryEntry) {
  const text = [recipe.title, recipe.description, ...(recipe.tags ?? []), ...(recipe.ingredients ?? []).map((ingredient) => ingredient.item)]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return !/\b(pasta|spaghetti|noodles?|rice|risotto|orzo|bread|toast|breadcrumbs?|panko|tortillas?|tacos?|tostadas?|chips?|potatoes?|sweet potatoes?|yams?|quinoa|couscous|farro|barley|oats?|flour|masa|polenta|beans?|lentils?|chickpeas?|peas|corn|gnocchi|crackers?)\b/i.test(text);
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .split(/[,\n]/)
    .map(normalizeIngredient)
    .filter(Boolean);
}

function searchTermMatches(haystack: string, term: string) {
  const normalizedHaystack = singularize(normalizeIngredient(haystack).replace(/-/g, " "));
  const normalizedTerm = singularize(normalizeIngredient(term).replace(/-/g, " "));
  const termWords = normalizedTerm.split(/\s+/).filter(Boolean);

  return normalizedHaystack.includes(normalizedTerm) || termWords.every((word) => normalizedHaystack.includes(word));
}

function normalizeIngredient(value: string) {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/\b(fresh|large|small|medium|chopped|sliced|thinly|optional|boneless|skinless|cup|cups|tablespoon|tablespoons|teaspoon|teaspoons)\b/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function singularize(value: string) {
  const keepPlural = new Set(["asparagus"]);

  return value
    .split(/\s+/)
    .map((word) => (word.length > 3 && word.endsWith("s") && !keepPlural.has(word) ? word.slice(0, -1) : word))
    .join(" ");
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

function getPrepMinutes(prepTime?: string) {
  if (!prepTime) return 45;

  const normalized = prepTime.toLowerCase();
  const hourMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/);
  const minuteMatch = normalized.match(/(\d+)\s*(?:minutes?|mins?|m)\b/);
  const hours = hourMatch ? Number(hourMatch[1]) * 60 : 0;
  const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;

  if (hours || minutes) return hours + minutes;

  return Number(normalized.match(/\d+/)?.[0] ?? 45);
}
