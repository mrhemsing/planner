export type Ingredient = {
  item: string;
  amount: string;
  category: "produce" | "protein" | "pantry" | "fridge" | "frozen";
};

export type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snack";
export type RecipeCategory = "Main" | "Side" | "Snack";

export type MealPlanEntry = {
  id: string;
  day: string;
  mealType: MealType;
  title: string;
  description: string;
  serves: number;
  prepTime: string;
  sourceName: string;
  sourceUrl: string;
  main: string;
  side?: string;
  snackNote?: string;
  highlights: string[];
  ingredients: Ingredient[];
};

import wildRoseImports from "@/data/wildrose-imports.json";
import generatedWildRoseImports from "@/data/wildrose-imports.generated.json";

export type RecipeLibraryEntry = {
  id: string;
  title: string;
  category: RecipeCategory;
  sourceName: string;
  sourceUrl: string;
  imageUrl: string;
  description: string;
  favourite: boolean;
  tags: string[];
  plannedDays: string[];
};

export const mealPlan: MealPlanEntry[] = [
  {
    id: "day-1-breakfast",
    day: "Today",
    mealType: "Breakfast",
    title: "Veggie Egg Bites with fresh fruit",
    description:
      "A complete breakfast with a protein-forward main and a simple side to make the morning feel finished.",
    serves: 2,
    prepTime: "20 min",
    sourceName: "Wild Rose",
    sourceUrl: "https://wildrose.ca/blogs/recipes/veggie-egg-bites",
    main: "Veggie Egg Bites",
    side: "Fresh berries and orange slices",
    highlights: ["make-ahead", "full breakfast", "weekday friendly"],
    ingredients: [
      { item: "eggs", amount: "6", category: "fridge" },
      { item: "spinach", amount: "2 cups", category: "produce" },
      { item: "bell pepper", amount: "1", category: "produce" },
      { item: "green onion", amount: "2 stalks", category: "produce" },
      { item: "olive oil", amount: "1 tbsp", category: "pantry" },
      { item: "fresh berries", amount: "2 cups", category: "produce" },
      { item: "oranges", amount: "2", category: "produce" },
    ],
  },
  {
    id: "day-2-lunch",
    day: "Tomorrow",
    mealType: "Lunch",
    title: "Turmeric Chicken Soup with greens",
    description:
      "A fuller lunch built from the Wild Rose soup recipe plus a light green side.",
    serves: 2,
    prepTime: "35 min",
    sourceName: "Wild Rose",
    sourceUrl: "https://wildrose.ca/blogs/recipes/turmeric-chicken-soup",
    main: "Turmeric Chicken Soup",
    side: "Simple arugula salad with lemon",
    highlights: ["warming", "full lunch", "meal prep friendly"],
    ingredients: [
      { item: "chicken broth", amount: "2 cups", category: "pantry" },
      { item: "chicken breast", amount: "2 breasts", category: "protein" },
      { item: "onion", amount: "1", category: "produce" },
      { item: "acorn squash", amount: "1 small", category: "produce" },
      { item: "ginger", amount: "1 tsp", category: "produce" },
      { item: "milk", amount: "1 cup", category: "fridge" },
      { item: "avocado oil", amount: "1 tbsp", category: "pantry" },
      { item: "arugula", amount: "1 bag", category: "produce" },
      { item: "lemon", amount: "1", category: "produce" },
    ],
  },
  {
    id: "day-3-dinner",
    day: "Day 3",
    mealType: "Dinner",
    title: "Tofu Veggie Stir Fry with brown rice",
    description:
      "A complete dinner with a satisfying main dish and a steady side for the evening meal.",
    serves: 2,
    prepTime: "25 min",
    sourceName: "Wild Rose",
    sourceUrl: "https://wildrose.ca/blogs/recipes/tofu-veggie-stir-fry",
    main: "Tofu Veggie Stir Fry",
    side: "Brown rice",
    highlights: ["plant-based", "full dinner", "fast cook"],
    ingredients: [
      { item: "firm tofu", amount: "1 block", category: "protein" },
      { item: "broccoli", amount: "1 head", category: "produce" },
      { item: "carrots", amount: "2", category: "produce" },
      { item: "garlic", amount: "3 cloves", category: "produce" },
      { item: "tamari", amount: "3 tbsp", category: "pantry" },
      { item: "sesame oil", amount: "1 tbsp", category: "pantry" },
      { item: "brown rice", amount: "1 cup dry", category: "pantry" },
    ],
  },
  {
    id: "day-4-breakfast",
    day: "Day 4",
    mealType: "Breakfast",
    title: "Morning Movement Smoothie with egg bites",
    description:
      "A lighter breakfast balanced with a ready-made protein side so it still lands as a full meal.",
    serves: 2,
    prepTime: "10 min",
    sourceName: "Wild Rose",
    sourceUrl: "https://wildrose.ca/blogs/recipes/morning-movement-smoothie",
    main: "Morning Movement Smoothie",
    side: "Leftover veggie egg bites",
    highlights: ["quick", "balanced breakfast", "mobile morning friendly"],
    ingredients: [
      { item: "frozen berries", amount: "2 cups", category: "frozen" },
      { item: "banana", amount: "1", category: "produce" },
      { item: "almond milk", amount: "2 cups", category: "fridge" },
      { item: "chia seeds", amount: "2 tbsp", category: "pantry" },
      { item: "ginger", amount: "1 tsp", category: "produce" },
      { item: "eggs", amount: "4", category: "fridge" },
      { item: "spinach", amount: "1 cup", category: "produce" },
    ],
  },
  {
    id: "day-5-snack",
    day: "Day 5",
    mealType: "Snack",
    title: "Simple reset snack box",
    description:
      "An optional in-between meal snack to keep energy up without turning into dessert.",
    serves: 2,
    prepTime: "5 min",
    sourceName: "Wild Rose",
    sourceUrl: "https://wildrose.ca/blogs/recipes",
    main: "Apple slices with walnuts",
    snackNote: "Optional afternoon snack",
    highlights: ["optional snack", "not sweet-heavy", "quick assemble"],
    ingredients: [
      { item: "apples", amount: "2", category: "produce" },
      { item: "walnuts", amount: "1/2 cup", category: "pantry" },
      { item: "pumpkin seeds", amount: "1/4 cup", category: "pantry" },
    ],
  },
];

const importedRecipeMeta: Record<
  string,
  Partial<{ category: RecipeCategory; favourite: boolean; tags: string[] }>
> = {
  "veggie-egg-bites": { category: "Main", favourite: true, tags: ["breakfast"] },
  "turmeric-chicken-soup": { category: "Main", favourite: true, tags: ["soup"] },
  "tofu-veggie-stir-fry": { category: "Main", favourite: false, tags: ["dinner"] },
  "morning-movement-smoothie": { category: "Snack", favourite: false, tags: ["breakfast", "drink"] },
  "berry-popsicles": { category: "Snack", favourite: true, tags: ["cool"] },
  "quinoa-salad": { category: "Side", favourite: false, tags: ["salad"] },
  "peach-arugula-salad": { category: "Side", favourite: false, tags: ["salad"] },
  "curried-spinach-soup": { category: "Main", favourite: false, tags: ["soup"] },
  falafel: { category: "Main", favourite: true, tags: ["protein"] },
  "coconut-chicken-with-spinach": { category: "Main", favourite: true, tags: ["dinner"] },
  "caesar-salad-dressing": { category: "Side", favourite: false, tags: ["dressings"] },
  "rice-pilaf": { category: "Side", favourite: true, tags: ["grain"] },
  "lentil-dhal": { category: "Main", favourite: true, tags: ["comfort"] },
  "strawberry-lemonade-slushy": { category: "Snack", favourite: false, tags: ["drink"] },
  "rustic-buckwheat-bread": { category: "Side", favourite: false, tags: ["bread"] },
  "sweet-bell-pepper-and-fresh-herb-fritatta": {
    category: "Main",
    favourite: true,
    tags: ["breakfast"],
  },
  "savoury-almond-biscuits": { category: "Snack", favourite: false, tags: ["baked"] },
  "almond-milk": { category: "Snack", favourite: false, tags: ["drink"] },
  "almond-butter-on-celery": { category: "Snack", favourite: true, tags: ["quick"] },
  "coconut-milk": { category: "Snack", favourite: false, tags: ["drink"] },
  "veggie-juice": { category: "Snack", favourite: false, tags: ["drink"] },
  "green-drink": { category: "Snack", favourite: false, tags: ["drink"] },
  "chocolate-avocado-smoothie": { category: "Snack", favourite: true, tags: ["drink"] },
  "rosemary-zucchini-soup": { category: "Main", favourite: false, tags: ["soup"] },
  "tomato-zucchini-soup": { category: "Main", favourite: false, tags: ["soup"] },
  "vegetable-stock": { category: "Side", favourite: false, tags: ["basics"] },
  "vegetable-rice-soup": { category: "Main", favourite: false, tags: ["soup"] },
  "vegetable-chowder": { category: "Main", favourite: false, tags: ["soup"] },
  "fresh-beet-borscht": { category: "Main", favourite: false, tags: ["soup"] },
  kitcheri: { category: "Main", favourite: true, tags: ["comfort"] },
  "moroccan-chickpea-and-millet-soup": { category: "Main", favourite: false, tags: ["soup"] },
  "warm-sesame-cucumber-rice-salad": { category: "Side", favourite: false, tags: ["salad"] },
  "salmon-seaweed-salad": { category: "Main", favourite: true, tags: ["salad", "protein"] },
  "kale-corn-and-beet-salad": { category: "Side", favourite: false, tags: ["salad"] },
};

const sideKeywords = [
  "salad",
  "rice",
  "pilaf",
  "bread",
  "stock",
  "dressing",
  "slaw",
  "sauce",
];
const snackKeywords = [
  "smoothie",
  "juice",
  "drink",
  "slushy",
  "slushie",
  "popsicle",
  "popsicles",
  "milk",
  "biscuit",
  "bites",
  "crumble",
  "apple",
  "snack",
];

function inferRecipeCategory(id: string, title: string): RecipeCategory {
  const value = `${id} ${title}`.toLowerCase();

  if (sideKeywords.some((keyword) => value.includes(keyword))) {
    return "Side";
  }

  if (snackKeywords.some((keyword) => value.includes(keyword))) {
    return "Snack";
  }

  return "Main";
}

function inferTags(title: string, category: RecipeCategory) {
  const value = title.toLowerCase();
  const tags = new Set<string>();

  if (value.includes("soup")) tags.add("soup");
  if (value.includes("salad")) tags.add("salad");
  if (value.includes("smoothie") || value.includes("juice") || value.includes("drink")) {
    tags.add("drink");
  }
  if (value.includes("breakfast") || value.includes("egg") || value.includes("fritatta")) {
    tags.add("breakfast");
  }
  if (category === "Main" && !tags.size) tags.add("meal");
  if (category === "Side" && !tags.size) tags.add("side");
  if (category === "Snack" && !tags.size) tags.add("snack");

  return Array.from(tags);
}

const importedOverrides = new Map(wildRoseImports.map((recipe) => [recipe.id, recipe]));

const mergedWildRoseImports = generatedWildRoseImports.map((generatedRecipe) => {
  const override = importedOverrides.get(generatedRecipe.id);

  return {
    id: generatedRecipe.id,
    title: override?.title || generatedRecipe.title || generatedRecipe.id,
    sourceUrl: override?.sourceUrl || generatedRecipe.sourceUrl,
    imageUrl: override?.imageUrl || generatedRecipe.imageUrl || "",
    description: override?.description || generatedRecipe.description || "",
  };
});

function buildImportedDescription(title: string, category: RecipeCategory) {
  if (category === "Main") {
    return `${title} is a Wild Rose main recipe that can anchor a full meal in the planner.`;
  }

  if (category === "Side") {
    return `${title} is a Wild Rose side recipe that can round out lunches and dinners.`;
  }

  return `${title} is a Wild Rose snack or drink option for lighter moments between meals.`;
}

const plannedRecipeDays = new Map<string, string[]>();

for (const entry of mealPlan) {
  const recipeId = entry.sourceUrl.split("/").filter(Boolean).pop();
  if (!recipeId) continue;

  const days = plannedRecipeDays.get(recipeId) ?? [];
  days.push(entry.day);
  plannedRecipeDays.set(recipeId, days);
}

const importedRecipes: RecipeLibraryEntry[] = mergedWildRoseImports.map((recipe) => {
  const meta = importedRecipeMeta[recipe.id];
  const category = meta?.category ?? inferRecipeCategory(recipe.id, recipe.title);
  const plannedDays = plannedRecipeDays.get(recipe.id) ?? [];
  const tags = Array.from(
    new Set([...(meta?.tags ?? []), ...inferTags(recipe.title, category), ...(plannedDays.length ? ["planned"] : [])]),
  );

  return {
    id: recipe.id,
    title: recipe.title,
    category,
    sourceName: "Wild Rose",
    sourceUrl: recipe.sourceUrl,
    imageUrl: recipe.imageUrl,
    description: recipe.description || buildImportedDescription(recipe.title, category),
    favourite: meta?.favourite ?? false,
    tags,
    plannedDays,
  };
});

export const recipeLibrary: RecipeLibraryEntry[] = importedRecipes.sort((a, b) =>
  a.title.localeCompare(b.title),
);
