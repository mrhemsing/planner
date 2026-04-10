export type Ingredient = {
  item: string;
  amount: string;
  category: "produce" | "protein" | "pantry" | "fridge" | "frozen";
};

export type MealType = "Lunch" | "Dinner";
export type RecipeCategory = "Lunch" | "Dinner" | "Bonus";

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
  highlights: string[];
  ingredients: Ingredient[];
};

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

const dinnerSourceName = "NYT Cooking · Healthy Weeknight Dinners";
const lunchSourceName = "NYT Cooking · Healthy Weekday Lunches";
const bonusSourceName = "NYT Cooking · Top 50 Reader Favorites";

const dinnerRecipes: RecipeLibraryEntry[] = [
  {
    id: "sheet-pan-feta-with-chickpeas-and-tomatoes",
    title: "Sheet-Pan Feta With Chickpeas and Tomatoes",
    category: "Dinner",
    sourceName: dinnerSourceName,
    sourceUrl: "https://cooking.nytimes.com/recipes/1021953-sheet-pan-feta-with-chickpeas-and-tomatoes",
    imageUrl: "/princess-planner-logo.jpg",
    description: "A strong weeknight dinner anchor with pantry-friendly ingredients and minimal cleanup.",
    favourite: true,
    tags: ["dinner", "sheet pan", "vegetarian", "weeknight"],
    plannedDays: ["Today"],
  },
  {
    id: "gochujang-buttered-noodles",
    title: "Gochujang Buttered Noodles",
    category: "Dinner",
    sourceName: dinnerSourceName,
    sourceUrl: "https://cooking.nytimes.com/recipes/1020979-gochujang-buttered-noodles",
    imageUrl: "/princess-planner-logo.jpg",
    description: "Fast, pantry-led dinner energy for nights that need something comforting and easy.",
    favourite: true,
    tags: ["dinner", "noodles", "quick", "weeknight"],
    plannedDays: ["Day 3"],
  },
  {
    id: "miso-salmon-with-greens-and-scallions",
    title: "Miso Salmon With Greens and Scallions",
    category: "Dinner",
    sourceName: dinnerSourceName,
    sourceUrl: "https://cooking.nytimes.com/recipes/1020330-miso-salmon-with-greens-and-scallions",
    imageUrl: "/princess-planner-logo.jpg",
    description: "A lighter dinner choice with protein and greens built into the main plate.",
    favourite: false,
    tags: ["dinner", "salmon", "healthy", "greens"],
    plannedDays: ["Day 5"],
  },
  {
    id: "crispy-gnocchi-with-burst-tomatoes-and-mozzarella",
    title: "Crispy Gnocchi With Burst Tomatoes and Mozzarella",
    category: "Dinner",
    sourceName: dinnerSourceName,
    sourceUrl: "https://cooking.nytimes.com/recipes/1021174-crispy-gnocchi-with-burst-tomatoes-and-mozzarella",
    imageUrl: "/princess-planner-logo.jpg",
    description: "A crowd-pleasing weeknight dinner that still feels simple enough for a normal evening.",
    favourite: false,
    tags: ["dinner", "vegetarian", "gnocchi", "comfort"],
    plannedDays: [],
  },
];

const lunchRecipes: RecipeLibraryEntry[] = [
  {
    id: "chickpea-salad-sandwich",
    title: "Chickpea Salad Sandwich",
    category: "Lunch",
    sourceName: lunchSourceName,
    sourceUrl: "https://cooking.nytimes.com/recipes/1023207-chickpea-salad-sandwich",
    imageUrl: "/princess-planner-logo.jpg",
    description: "A reliable weekday lunch that is practical, filling, and easy to repeat.",
    favourite: true,
    tags: ["lunch", "sandwich", "weekday", "vegetarian"],
    plannedDays: ["Tomorrow"],
  },
  {
    id: "turmeric-black-pepper-chicken-with-asparagus",
    title: "Turmeric-Black Pepper Chicken With Asparagus",
    category: "Lunch",
    sourceName: lunchSourceName,
    sourceUrl: "https://cooking.nytimes.com/recipes/1022086-turmeric-black-pepper-chicken-with-asparagus",
    imageUrl: "/princess-planner-logo.jpg",
    description: "A lunch option with strong protein and vegetables that can also handle leftovers well.",
    favourite: false,
    tags: ["lunch", "chicken", "healthy", "meal prep"],
    plannedDays: ["Day 4"],
  },
  {
    id: "tofu-and-herb-salad",
    title: "Tofu and Herb Salad",
    category: "Lunch",
    sourceName: lunchSourceName,
    sourceUrl: "https://cooking.nytimes.com/recipes/1020223-tofu-and-herb-salad",
    imageUrl: "/princess-planner-logo.jpg",
    description: "A lighter lunch built around herbs, texture, and a clean protein base.",
    favourite: false,
    tags: ["lunch", "tofu", "salad", "light"],
    plannedDays: [],
  },
];

const bonusRecipes: RecipeLibraryEntry[] = [
  {
    id: "top-50-reader-favorites",
    title: "Top 50 Reader Favorites",
    category: "Bonus",
    sourceName: bonusSourceName,
    sourceUrl: "https://cooking.nytimes.com/68861692-nyt-cooking/13395693-our-50-most-popular-recipes-of-all-time-so-far",
    imageUrl: "/princess-planner-logo.jpg",
    description: "A browse-only list of beloved NYT Cooking recipes for inspiration outside the core planner flow.",
    favourite: false,
    tags: ["bonus", "popular", "browse"],
    plannedDays: [],
  },
];

export const recipeLibrary: RecipeLibraryEntry[] = [
  ...dinnerRecipes,
  ...lunchRecipes,
  ...bonusRecipes,
].sort((a, b) => a.title.localeCompare(b.title));

const recipeById = new Map(recipeLibrary.map((recipe) => [recipe.id, recipe]));

function getRecipe(id: string) {
  const recipe = recipeById.get(id);
  if (!recipe) {
    throw new Error(`Missing recipe for meal plan entry: ${id}`);
  }
  return recipe;
}

export const mealPlan: MealPlanEntry[] = [
  {
    id: "today-dinner",
    day: "Today",
    mealType: "Dinner",
    title: getRecipe("sheet-pan-feta-with-chickpeas-and-tomatoes").title,
    description:
      "A simple dinner pick with strong weeknight energy, anchored by feta, chickpeas, and burst tomatoes.",
    serves: 4,
    prepTime: "35 min",
    sourceName: getRecipe("sheet-pan-feta-with-chickpeas-and-tomatoes").sourceName,
    sourceUrl: getRecipe("sheet-pan-feta-with-chickpeas-and-tomatoes").sourceUrl,
    main: "Sheet-Pan Feta With Chickpeas and Tomatoes",
    side: "Simple greens or crusty bread",
    highlights: ["dinner", "weeknight", "top pick"],
    ingredients: [
      { item: "feta", amount: "1 block", category: "fridge" },
      { item: "chickpeas", amount: "2 cans", category: "pantry" },
      { item: "cherry tomatoes", amount: "2 pints", category: "produce" },
      { item: "olive oil", amount: "3 tbsp", category: "pantry" },
      { item: "garlic", amount: "3 cloves", category: "produce" },
      { item: "greens", amount: "1 box", category: "produce" },
    ],
  },
  {
    id: "tomorrow-lunch",
    day: "Tomorrow",
    mealType: "Lunch",
    title: getRecipe("chickpea-salad-sandwich").title,
    description:
      "A practical weekday lunch pick that is easy to prep, easy to eat, and good for repeat use.",
    serves: 4,
    prepTime: "20 min",
    sourceName: getRecipe("chickpea-salad-sandwich").sourceName,
    sourceUrl: getRecipe("chickpea-salad-sandwich").sourceUrl,
    main: "Chickpea Salad Sandwich",
    side: "Fruit or a simple soup",
    highlights: ["lunch", "weekday", "easy repeat"],
    ingredients: [
      { item: "chickpeas", amount: "2 cans", category: "pantry" },
      { item: "celery", amount: "2 stalks", category: "produce" },
      { item: "red onion", amount: "1/2", category: "produce" },
      { item: "mayonnaise", amount: "1/3 cup", category: "fridge" },
      { item: "bread", amount: "8 slices", category: "pantry" },
      { item: "apples", amount: "2", category: "produce" },
    ],
  },
  {
    id: "day-3-dinner",
    day: "Day 3",
    mealType: "Dinner",
    title: getRecipe("gochujang-buttered-noodles").title,
    description:
      "A fast comfort dinner that keeps the planning week from getting too heavy or too complicated.",
    serves: 4,
    prepTime: "20 min",
    sourceName: getRecipe("gochujang-buttered-noodles").sourceName,
    sourceUrl: getRecipe("gochujang-buttered-noodles").sourceUrl,
    main: "Gochujang Buttered Noodles",
    side: "Cucumber salad or steamed broccoli",
    highlights: ["dinner", "quick", "comfort"],
    ingredients: [
      { item: "noodles", amount: "12 oz", category: "pantry" },
      { item: "butter", amount: "4 tbsp", category: "fridge" },
      { item: "gochujang", amount: "2 tbsp", category: "pantry" },
      { item: "parmesan", amount: "1/2 cup", category: "fridge" },
      { item: "cucumber", amount: "1", category: "produce" },
    ],
  },
  {
    id: "day-4-lunch",
    day: "Day 4",
    mealType: "Lunch",
    title: getRecipe("turmeric-black-pepper-chicken-with-asparagus").title,
    description:
      "A stronger protein lunch slot that still keeps the weekday plan feeling healthy and straightforward.",
    serves: 4,
    prepTime: "30 min",
    sourceName: getRecipe("turmeric-black-pepper-chicken-with-asparagus").sourceName,
    sourceUrl: getRecipe("turmeric-black-pepper-chicken-with-asparagus").sourceUrl,
    main: "Turmeric-Black Pepper Chicken With Asparagus",
    side: "Rice or leftover grains",
    highlights: ["lunch", "protein", "meal prep"],
    ingredients: [
      { item: "chicken thighs", amount: "1 1/2 lb", category: "protein" },
      { item: "asparagus", amount: "1 bunch", category: "produce" },
      { item: "turmeric", amount: "2 tsp", category: "pantry" },
      { item: "black pepper", amount: "1 tsp", category: "pantry" },
      { item: "rice", amount: "2 cups cooked", category: "pantry" },
    ],
  },
  {
    id: "day-5-dinner",
    day: "Day 5",
    mealType: "Dinner",
    title: getRecipe("miso-salmon-with-greens-and-scallions").title,
    description:
      "A lighter dinner to round out the 5-day block with protein, greens, and clean flavors.",
    serves: 4,
    prepTime: "25 min",
    sourceName: getRecipe("miso-salmon-with-greens-and-scallions").sourceName,
    sourceUrl: getRecipe("miso-salmon-with-greens-and-scallions").sourceUrl,
    main: "Miso Salmon With Greens and Scallions",
    side: "Rice or roasted vegetables",
    highlights: ["dinner", "salmon", "lighter finish"],
    ingredients: [
      { item: "salmon", amount: "4 fillets", category: "protein" },
      { item: "miso", amount: "2 tbsp", category: "fridge" },
      { item: "scallions", amount: "1 bunch", category: "produce" },
      { item: "greens", amount: "1 large bunch", category: "produce" },
      { item: "rice", amount: "2 cups cooked", category: "pantry" },
    ],
  },
];
