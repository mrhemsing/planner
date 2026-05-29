"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { RecipeLibraryEntry } from "@/data/recipes";

type ShuffleState = "idle" | "shuffling" | "revealing" | "revealed";
type DinnerSuit = "flame" | "leaf" | "wave" | "crown";

type RoyaleRecipe = RecipeLibraryEntry & {
  dinnerSuit: DinnerSuit;
};

type CategoryId = "all" | "quick" | "vegetarian" | "fish" | "meat" | "wild";

type Category = {
  id: CategoryId;
  label: string;
  icon: string;
  description: string;
  matches: (recipe: RoyaleRecipe) => boolean;
};

const suitGlyphs: Record<DinnerSuit, string> = {
  flame: "F",
  leaf: "L",
  wave: "W",
  crown: "C",
};

const suitLabels: Record<DinnerSuit, string> = {
  flame: "Ember",
  leaf: "Verdant",
  wave: "Tide",
  crown: "Atelier",
};

const categories: Category[] = [
  {
    id: "all",
    label: "House",
    icon: "🍽️",
    description: "Full dinner deck",
    matches: () => true,
  },
  {
    id: "quick",
    label: "Quick",
    icon: "⚡",
    description: "Fast weeknights",
    matches: (recipe) => getPrepMinutes(recipe.prepTime) <= 30,
  },
  {
    id: "vegetarian",
    label: "Green",
    icon: "🥦",
    description: "Vegetarian picks",
    matches: (recipe) => recipe.dinnerSuit === "leaf",
  },
  {
    id: "fish",
    label: "Sea",
    icon: "🐟",
    description: "Fish and seafood",
    matches: (recipe) => recipe.dinnerSuit === "wave",
  },
  {
    id: "meat",
    label: "Meat",
    icon: "🥩",
    description: "Chicken, beef, sausage",
    matches: (recipe) => recipe.dinnerSuit === "flame",
  },
  {
    id: "wild",
    label: "Wild",
    icon: "✨",
    description: "Chef's choice",
    matches: () => true,
  },
];

export function DinnerRoyale({ recipes }: { recipes: RecipeLibraryEntry[] }) {
  const deck = useMemo(() => recipes.map(enrichRecipe), [recipes]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<CategoryId>("all");
  const [shuffleState, setShuffleState] = useState<ShuffleState>("idle");
  const [drawCount, setDrawCount] = useState(0);
  const [currentRecipe, setCurrentRecipe] = useState<RoyaleRecipe>(() => drawRecipe(deck, "opening-night", "all"));
  const [isCardRevealed, setCardRevealed] = useState(true);
  const [isRecipeOpen, setRecipeOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const timeoutsRef = useRef<number[]>([]);

  const selectedCategory = categories.find((category) => category.id === selectedCategoryId) ?? categories[0];
  const categoryDeck = useMemo(() => getCategoryDeck(deck, selectedCategoryId), [deck, selectedCategoryId]);
  const tableStateClass =
    shuffleState === "shuffling"
      ? "royale-table-shuffling"
      : shuffleState === "revealing"
        ? "royale-table-revealing"
        : shuffleState === "revealed"
          ? "royale-table-revealed"
          : "";

  useEffect(() => {
    return () => {
      for (const timeoutId of timeoutsRef.current) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  function schedule(callback: () => void, delay: number) {
    const timeoutId = window.setTimeout(callback, delay);
    timeoutsRef.current.push(timeoutId);
  }

  function runShuffle(categoryId = selectedCategoryId) {
    for (const timeoutId of timeoutsRef.current) {
      window.clearTimeout(timeoutId);
    }
    timeoutsRef.current = [];

    const nextDraw = drawCount + 1;
    setDrawCount(nextDraw);
    setCardRevealed(false);
    setShuffleState("shuffling");

    schedule(() => {
      const nextRecipe = drawRecipe(deck, `dinner-royale-${categoryId}-${nextDraw}`, categoryId, currentRecipe.id);
      setCurrentRecipe(nextRecipe);
      setShuffleState("revealing");
    }, 1180);

    schedule(() => setCardRevealed(true), 1500);
    schedule(() => setShuffleState("revealed"), 2120);
  }

  function chooseCategory(categoryId: CategoryId) {
    setSelectedCategoryId(categoryId);
    runShuffle(categoryId);
  }

  return (
    <main className="royale-stage red-texture-background min-h-screen overflow-x-hidden text-stone-900">
      <div className="royale-ambient" aria-hidden="true" />
      <section className={`royale-table-scene royale-single-scene ${tableStateClass}`}>
        <div className="royale-topbar">
          <Link
            href="/"
            className="rounded-full border border-[#d7bb72]/40 bg-black/30 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#ead7a1] backdrop-blur transition hover:border-[#f7e4a8] hover:text-white"
          >
            Recipes
          </Link>
          <button
            type="button"
            onClick={() => setSoundEnabled((value) => !value)}
            className="rounded-full border border-white/15 bg-white/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/75 backdrop-blur transition hover:border-white/40 hover:text-white"
          >
            Sound {soundEnabled ? "On" : "Off"}
          </button>
        </div>

        <div className="royale-title-lockup royale-single-title">
          <p>Private Dinner House</p>
          <h1>
            <span>Dinner</span> <span>Royale</span>
          </h1>
          <span>Choose a deck. Reveal one perfect dinner.</span>
        </div>

        <div className="royale-category-bar" aria-label="Dinner category">
          {categories.map((category) => (
            <button
              type="button"
              key={category.id}
              className={`royale-category-button ${category.id === selectedCategoryId ? "royale-category-button-active" : ""}`}
              onClick={() => chooseCategory(category.id)}
              disabled={shuffleState === "shuffling" || shuffleState === "revealing"}
            >
              <span>
                <span aria-hidden="true">{category.icon}</span> {category.label}
              </span>
              <small>{category.description}</small>
            </button>
          ))}
        </div>

        <div className="royale-table royale-single-table">
          <div className="royale-table-rim" aria-hidden="true" />
          <div className="royale-mobile-shuffle-stage royale-single-shuffle-stage" aria-hidden="true">
            {Array.from({ length: 9 }).map((_, index) => (
              <span key={index} style={{ "--shuffle-i": index } as CSSProperties} />
            ))}
          </div>

          <div className="royale-single-card-wrap" aria-live="polite">
            <RecipePlayingCard
              recipe={currentRecipe}
              category={selectedCategory}
              hidden={!isCardRevealed}
              shuffleState={shuffleState}
              onOpen={() => setRecipeOpen(true)}
            />
          </div>
        </div>

        <div className="royale-controls royale-single-controls">
          <button
            type="button"
            onClick={() => runShuffle()}
            className="royale-deal-button"
            disabled={shuffleState === "shuffling" || shuffleState === "revealing" || categoryDeck.length === 0}
          >
            <span>{shuffleState === "idle" ? "Shuffle Dinner" : "Shuffle Again"}</span>
          </button>
        </div>
      </section>

      {isRecipeOpen ? (
        <RecipeDetailDialog recipe={currentRecipe} onClose={() => setRecipeOpen(false)} />
      ) : null}
    </main>
  );
}

function RecipePlayingCard({
  recipe,
  category,
  hidden,
  shuffleState,
  onOpen,
}: {
  recipe: RoyaleRecipe;
  category: Category;
  hidden: boolean;
  shuffleState: ShuffleState;
  onOpen: () => void;
}) {
  const prepRank = getPrepRank(recipe.prepTime);

  return (
    <article
      className={`royale-card-shell royale-single-card-shell ${hidden ? "royale-card-facedown" : ""} ${shuffleState === "revealing" ? "royale-card-revealed" : ""}`}
    >
      <button
        type="button"
        className="royale-card royale-recipe-card-button"
        onClick={onOpen}
        disabled={hidden || shuffleState === "shuffling" || shuffleState === "revealing"}
        aria-label={`Open full recipe for ${recipe.title}`}
      >
        <div className="royale-card-back">
          <div className="royale-card-back-pattern" />
          <span>DR</span>
        </div>
        <div className="royale-card-front">
          <div className="royale-card-foil" />
          <div className="royale-card-corners">
            <span>{prepRank}</span>
            <span>{suitGlyphs[recipe.dinnerSuit]}</span>
          </div>
          <div className="royale-card-image">
            <Image src={recipe.imageUrl} alt="" fill sizes="(max-width: 760px) 82vw, 26vw" priority />
          </div>
          <div className="royale-card-content">
            <div className="royale-card-meta">
              <span>{category.label}</span>
              <span>{suitLabels[recipe.dinnerSuit]}</span>
            </div>
            <h2>{recipe.title}</h2>
            <p>{recipe.description}</p>
            <div className="royale-card-badges">
              <span>{recipe.prepTime ?? "Weeknight"}</span>
              <span>{recipe.serves ? `Serves ${recipe.serves}` : category.description}</span>
            </div>
          </div>
        </div>
      </button>
    </article>
  );
}

function RecipeDetailDialog({ recipe, onClose }: { recipe: RoyaleRecipe; onClose: () => void }) {
  return (
    <div className="royale-recipe-overlay" role="dialog" aria-modal="true" aria-label={recipe.title}>
      <button type="button" className="royale-recipe-backdrop" onClick={onClose} aria-label="Close recipe" />
      <article className="royale-recipe-dialog">
        <div className="royale-recipe-dialog-header">
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-stone-300 sm:hidden" aria-hidden="true" />
          <button type="button" onClick={onClose} className="royale-recipe-close" aria-label="Close recipe">
            ×
          </button>
        </div>

        <div className="relative h-56 w-full overflow-hidden rounded-[16px] bg-amber-50 sm:h-72">
          <Image src={recipe.imageUrl} alt={recipe.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 700px" />
        </div>

        <div className="mt-5">
          <h2 className="text-3xl font-semibold text-stone-900 sm:text-4xl">{recipe.title}</h2>
          <p className="mt-3 text-lg leading-8 text-stone-700 sm:text-xl sm:leading-9">{recipe.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {recipe.prepTime ? <RecipeChip label={`Prep ${recipe.prepTime}`} /> : null}
            {recipe.serves ? <RecipeChip label={`Serves ${recipe.serves}`} /> : null}
          </div>
        </div>

        {recipe.ingredients?.length ? (
          <section className="mt-5 rounded-[16px] border border-stone-300 bg-amber-50/60 p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">Ingredients</p>
            <ul className="mt-3 grid gap-2">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={`${recipe.id}-${ingredient.item}-${index}`} className="rounded-[12px] bg-white px-3 py-2 text-sm text-stone-800">
                  {`${ingredient.amount} ${ingredient.item}`.replace(/\s+/g, " ").trim()}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {recipe.instructions?.length ? (
          <section className="mt-5 rounded-[16px] border border-stone-300 bg-white p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-700">Instructions</p>
            <ol className="mt-3 space-y-3 text-base leading-7 text-stone-700">
              {recipe.instructions.map((step, index) => (
                <li key={`${recipe.id}-step-${index}`} className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-xl bg-amber-50 text-sm font-semibold text-amber-700">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center border-b border-black text-sm font-normal text-black transition hover:border-black/70"
          >
            Open recipe on NYT Cooking
          </a>
        </div>
      </article>
    </div>
  );
}

function RecipeChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800">
      {label}
    </span>
  );
}

function enrichRecipe(recipe: RecipeLibraryEntry): RoyaleRecipe {
  const categoryText = [recipe.title, recipe.description, ...(recipe.tags ?? [])].join(" ").toLowerCase();
  let dinnerSuit: DinnerSuit = "crown";

  if (/(salmon|fish|tuna|shrimp|sea|cod|trout)/i.test(categoryText)) {
    dinnerSuit = "wave";
  } else if (/(tofu|bean|lentil|chickpea|vegetarian|greens|salad|feta)/i.test(categoryText)) {
    dinnerSuit = "leaf";
  } else if (/(chicken|sausage|meatball|beef|pork|turkey)/i.test(categoryText)) {
    dinnerSuit = "flame";
  }

  return {
    ...recipe,
    dinnerSuit,
  };
}

function getCategoryDeck(deck: RoyaleRecipe[], categoryId: CategoryId) {
  const category = categories.find((item) => item.id === categoryId) ?? categories[0];
  return deck.filter(category.matches);
}

function drawRecipe(deck: RoyaleRecipe[], seed: string, categoryId: CategoryId, previousRecipeId?: string) {
  const categoryDeck = getCategoryDeck(deck, categoryId);
  const candidates = categoryDeck.length ? categoryDeck : deck;
  const shuffled = [...candidates].sort((a, b) => hashString(`${seed}-${a.id}`) - hashString(`${seed}-${b.id}`));
  return shuffled.find((recipe) => recipe.id !== previousRecipeId) ?? shuffled[0] ?? deck[0];
}

function getPrepRank(prepTime?: string) {
  const minutes = getPrepMinutes(prepTime);
  if (minutes <= 20) return "A";
  if (minutes <= 30) return "K";
  if (minutes <= 45) return "Q";
  return "J";
}

function getPrepMinutes(prepTime?: string) {
  return Number(prepTime?.match(/\d+/)?.[0] ?? 45);
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}
