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

const dinnerSource = {
  name: "NYT Cooking · Healthy Weeknight Dinners",
  url: "https://cooking.nytimes.com/68861692-nyt-cooking/2110373-healthy-weeknight-dinners",
};

const lunchSource = {
  name: "NYT Cooking · Healthy Weekday Lunches",
  url: "https://cooking.nytimes.com/68861692-nyt-cooking/2110355-healthy-weekday-lunches",
};

const bonusSource = {
  name: "NYT Cooking · Top 50 Reader Favorites",
  url: "https://cooking.nytimes.com/68861692-nyt-cooking/13395693-our-50-most-popular-recipes-of-all-time-so-far",
};

export const mealPlan: MealPlanEntry[] = [
  {
    id: "today-dinner",
    day: "Today",
    mealType: "Dinner",
    title: "Dinner pick from Healthy Weeknight Dinners",
    description:
      "Dinner planning now pulls from the NYT Cooking Healthy Weeknight Dinners collection, with priority on strong ratings and weeknight-friendly meals.",
    serves: 2,
    prepTime: "TBD",
    sourceName: dinnerSource.name,
    sourceUrl: dinnerSource.url,
    main: "Choose from the top-rated Healthy Weeknight Dinners list",
    side: "Optional simple vegetable or grain side",
    highlights: ["nyt cooking", "weeknight dinner", "top rated pool"],
    ingredients: [
      { item: "dinner recipe ingredients", amount: "depends on selected recipe", category: "pantry" },
      { item: "vegetable side ingredients", amount: "optional", category: "produce" },
    ],
  },
  {
    id: "tomorrow-lunch",
    day: "Tomorrow",
    mealType: "Lunch",
    title: "Lunch pick from Healthy Weekday Lunches",
    description:
      "Lunch planning now pulls from the NYT Cooking Healthy Weekday Lunches collection so lunches stay lighter, practical, and weekday-friendly.",
    serves: 2,
    prepTime: "TBD",
    sourceName: lunchSource.name,
    sourceUrl: lunchSource.url,
    main: "Choose from the Healthy Weekday Lunches list",
    side: "Optional fruit, soup, or salad add-on",
    highlights: ["nyt cooking", "weekday lunch", "lighter meal"],
    ingredients: [
      { item: "lunch recipe ingredients", amount: "depends on selected recipe", category: "pantry" },
      { item: "simple lunch add-on", amount: "optional", category: "produce" },
    ],
  },
  {
    id: "day-3-dinner",
    day: "Day 3",
    mealType: "Dinner",
    title: "Another top-rated NYT dinner slot",
    description:
      "A second dinner slot reserved for another highly rated dinner from the NYT Healthy Weeknight Dinners collection.",
    serves: 2,
    prepTime: "TBD",
    sourceName: dinnerSource.name,
    sourceUrl: dinnerSource.url,
    main: "Pick another dinner from the top-rated dinner pool",
    side: "Optional easy side",
    highlights: ["dinner", "planner slot", "nyt cooking"],
    ingredients: [
      { item: "selected dinner ingredients", amount: "depends on selected recipe", category: "pantry" },
    ],
  },
  {
    id: "day-4-lunch",
    day: "Day 4",
    mealType: "Lunch",
    title: "Another weekday lunch slot",
    description:
      "A second lunch slot reserved for a practical lunch option from the NYT Healthy Weekday Lunches collection.",
    serves: 2,
    prepTime: "TBD",
    sourceName: lunchSource.name,
    sourceUrl: lunchSource.url,
    main: "Pick another lunch from the weekday lunch pool",
    side: "Optional fresh side",
    highlights: ["lunch", "planner slot", "nyt cooking"],
    ingredients: [
      { item: "selected lunch ingredients", amount: "depends on selected recipe", category: "pantry" },
    ],
  },
  {
    id: "day-5-dinner",
    day: "Day 5",
    mealType: "Dinner",
    title: "Bonus dinner slot from the same pool",
    description:
      "A fifth planning slot keeps the 5-day structure while staying centered on NYT Cooking dinner and lunch collections.",
    serves: 2,
    prepTime: "TBD",
    sourceName: dinnerSource.name,
    sourceUrl: dinnerSource.url,
    main: "Choose another top-rated dinner recipe",
    side: "Optional household favourite side",
    highlights: ["5 day planning", "dinner", "nyt cooking"],
    ingredients: [
      { item: "selected recipe ingredients", amount: "depends on selected recipe", category: "pantry" },
    ],
  },
];

export const recipeLibrary: RecipeLibraryEntry[] = [
  {
    id: "nyt-healthy-weeknight-dinners",
    title: "Healthy Weeknight Dinners",
    category: "Dinner",
    sourceName: dinnerSource.name,
    sourceUrl: dinnerSource.url,
    imageUrl: "/princess-planner-logo.jpg",
    description:
      "Primary dinner source for the planner. This pool should drive dinner selection, with emphasis on the strongest-rated recipes.",
    favourite: true,
    tags: ["dinner", "weeknight", "top rated"],
    plannedDays: ["Today", "Day 3", "Day 5"],
  },
  {
    id: "nyt-healthy-weekday-lunches",
    title: "Healthy Weekday Lunches",
    category: "Lunch",
    sourceName: lunchSource.name,
    sourceUrl: lunchSource.url,
    imageUrl: "/princess-planner-logo.jpg",
    description:
      "Primary lunch source for the planner. This pool should drive weekday lunch selection.",
    favourite: true,
    tags: ["lunch", "weekday", "planning"],
    plannedDays: ["Tomorrow", "Day 4"],
  },
  {
    id: "nyt-top-50-reader-favorites",
    title: "Top 50 Reader Favorites",
    category: "Bonus",
    sourceName: bonusSource.name,
    sourceUrl: bonusSource.url,
    imageUrl: "/princess-planner-logo.jpg",
    description:
      "Bonus browse-only section. This is a listing source for inspiration, not part of the active planner pool.",
    favourite: false,
    tags: ["bonus", "browse", "popular"],
    plannedDays: [],
  },
];
