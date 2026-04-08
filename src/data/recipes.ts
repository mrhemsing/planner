export type Ingredient = {
  item: string;
  amount: string;
  category: "produce" | "protein" | "pantry" | "fridge" | "frozen";
};

export type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snack";

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

export const mealPlan: MealPlanEntry[] = [
  {
    id: "day-1-breakfast",
    day: "Day 1",
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
    day: "Day 2",
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
