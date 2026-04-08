export type Ingredient = {
  item: string;
  amount: string;
  category: "produce" | "protein" | "pantry" | "fridge" | "frozen";
};

export type Recipe = {
  id: string;
  title: string;
  mealType: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  day: string;
  description: string;
  serves: number;
  prepTime: string;
  sourceName: string;
  sourceUrl: string;
  ingredients: Ingredient[];
  highlights: string[];
};

export const recipes: Recipe[] = [
  {
    id: "day-1-veggie-egg-bites",
    title: "Veggie Egg Bites",
    mealType: "Breakfast",
    day: "Day 1",
    description:
      "A make-ahead breakfast that keeps the first day easy and protein-forward.",
    serves: 2,
    prepTime: "20 min",
    sourceName: "Wild Rose",
    sourceUrl: "https://wildrose.ca/blogs/recipes/veggie-egg-bites",
    highlights: ["make-ahead", "high protein", "weekday friendly"],
    ingredients: [
      { item: "eggs", amount: "6", category: "fridge" },
      { item: "spinach", amount: "2 cups", category: "produce" },
      { item: "bell pepper", amount: "1", category: "produce" },
      { item: "green onion", amount: "2 stalks", category: "produce" },
      { item: "olive oil", amount: "1 tbsp", category: "pantry" },
    ],
  },
  {
    id: "day-2-morning-movement-smoothie",
    title: "Morning Movement Smoothie",
    mealType: "Breakfast",
    day: "Day 2",
    description:
      "A quick-glance smoothie option for a light reset day.",
    serves: 2,
    prepTime: "10 min",
    sourceName: "Wild Rose",
    sourceUrl: "https://wildrose.ca/blogs/recipes/morning-movement-smoothie",
    highlights: ["hydrating", "light", "blender friendly"],
    ingredients: [
      { item: "frozen berries", amount: "2 cups", category: "frozen" },
      { item: "banana", amount: "1", category: "produce" },
      { item: "almond milk", amount: "2 cups", category: "fridge" },
      { item: "chia seeds", amount: "2 tbsp", category: "pantry" },
      { item: "ginger", amount: "1 tsp", category: "produce" },
    ],
  },
  {
    id: "day-3-tofu-veggie-stir-fry",
    title: "Tofu Veggie Stir Fry",
    mealType: "Dinner",
    day: "Day 3",
    description:
      "A nourishing, fast dinner with a strong vegetable base.",
    serves: 2,
    prepTime: "25 min",
    sourceName: "Wild Rose",
    sourceUrl: "https://wildrose.ca/blogs/recipes/tofu-veggie-stir-fry",
    highlights: ["plant-based", "fast dinner", "clean ingredients"],
    ingredients: [
      { item: "firm tofu", amount: "1 block", category: "protein" },
      { item: "broccoli", amount: "1 head", category: "produce" },
      { item: "carrots", amount: "2", category: "produce" },
      { item: "garlic", amount: "3 cloves", category: "produce" },
      { item: "tamari", amount: "3 tbsp", category: "pantry" },
      { item: "sesame oil", amount: "1 tbsp", category: "pantry" },
    ],
  },
  {
    id: "day-4-turmeric-chicken-soup",
    title: "Turmeric Chicken Soup",
    mealType: "Lunch",
    day: "Day 4",
    description:
      "Comforting soup with enough structure to anchor the middle of the plan.",
    serves: 2,
    prepTime: "35 min",
    sourceName: "Wild Rose",
    sourceUrl: "https://wildrose.ca/blogs/recipes/turmeric-chicken-soup",
    highlights: ["comforting", "meal prep friendly", "warming"],
    ingredients: [
      { item: "chicken broth", amount: "2 cups", category: "pantry" },
      { item: "chicken breast", amount: "2 breasts", category: "protein" },
      { item: "onion", amount: "1", category: "produce" },
      { item: "acorn squash", amount: "1 small", category: "produce" },
      { item: "ginger", amount: "1 tsp", category: "produce" },
      { item: "milk", amount: "1 cup", category: "fridge" },
      { item: "avocado oil", amount: "1 tbsp", category: "pantry" },
    ],
  },
  {
    id: "day-5-apple-crumble",
    title: "Apple Crumble - No sugar added",
    mealType: "Snack",
    day: "Day 5",
    description:
      "A simple finish for the 5-day block, still aligned to a lighter recipe set.",
    serves: 4,
    prepTime: "40 min",
    sourceName: "Wild Rose",
    sourceUrl: "https://wildrose.ca/blogs/recipes/apple-crumble-no-sugar-added",
    highlights: ["naturally sweet", "cozy", "end-of-week treat"],
    ingredients: [
      { item: "apples", amount: "4", category: "produce" },
      { item: "rolled oats", amount: "1 cup", category: "pantry" },
      { item: "cinnamon", amount: "1 tsp", category: "pantry" },
      { item: "coconut oil", amount: "3 tbsp", category: "pantry" },
      { item: "walnuts", amount: "1/2 cup", category: "pantry" },
    ],
  },
];
