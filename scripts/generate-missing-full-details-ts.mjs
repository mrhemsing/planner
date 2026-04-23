import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { recipeLibrary } = require("../src/data/recipes.ts");
const worklist = require("../reports/recipes-missing-full-details-worklist.json").missing;

function preferDinner(current, candidate) {
  if (!current) return candidate;
  if (current.category === "Dinner") return current;
  if (candidate.category === "Dinner") return candidate;
  return current;
}

function mapIngredientCategory(item) {
  const lower = item.toLowerCase();
  if (/(chicken|salmon|shrimp|fish|tofu|egg|eggs|tuna|turkey|sausage|meatball|meatballs|yogurt|feta|parmesan|mozzarella|ricotta|cheese|butter|milk|cream|paneer|cod|halibut|swordfish|pork|beef|anchovy|anchovies|sardine|sardines)/.test(lower)) return "protein";
  if (/(tomato|shallot|onion|garlic|scallion|scallions|lemon|lime|broccoli|asparagus|spinach|greens|kale|pepper|peppers|cucumber|avocado|herb|herbs|parsley|mint|dill|cilantro|chard|peaches|apple|apples|grapes|cauliflower|snap peas|green beans|zucchini|carrot|carrots|lettuce|cabbage|radicchio|squash|jalape|chile|chili|mushroom|mushrooms|beans|bean|chickpeas|chickpea|corn|potato|potatoes|sweet potato|sweet potatoes|fennel|celery|ginger|coconut|pumpkin|eggplant|okra|beet|beets)/.test(lower)) return "produce";
  if (/(frozen)/.test(lower)) return "frozen";
  if (/(mayo|mayonnaise|yogurt|cream|milk|buttermilk)/.test(lower)) return "fridge";
  return "pantry";
}

function normalizeText(value) {
  return String(value)
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitIngredient(line) {
  const cleaned = normalizeText(line).replace(/\s*see Note.*$/i, "");
  const tokens = cleaned.split(" ");
  let splitIndex = -1;
  for (let i = 1; i < tokens.length; i++) {
    if (/^[A-Za-z(\[]/.test(tokens[i])) {
      splitIndex = i;
      break;
    }
  }
  if (splitIndex === -1) {
    return { amount: "", item: cleaned };
  }
  return {
    amount: tokens.slice(0, splitIndex).join(" "),
    item: tokens.slice(splitIndex).join(" "),
  };
}

function parseDuration(value) {
  if (!value || typeof value !== "string") return undefined;
  const m = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/i);
  if (!m) return undefined;
  const hours = m[1] ? Number(m[1]) : 0;
  const minutes = m[2] ? Number(m[2]) : 0;
  const totalMinutes = hours * 60 + minutes;
  return totalMinutes ? `${totalMinutes} min` : undefined;
}

function extractRecipeJsonLd(html) {
  const matches = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const match of matches) {
    const raw = match[1].trim();
    try {
      const parsed = JSON.parse(raw);
      const candidates = Array.isArray(parsed) ? parsed : [parsed];
      for (const candidate of candidates) {
        const type = candidate?.["@type"];
        const types = Array.isArray(type) ? type : [type];
        if (types.includes("Recipe") || candidate?.recipeIngredient || candidate?.recipeInstructions) {
          return candidate;
        }
      }
    } catch {
      // ignore malformed blocks
    }
  }
  return null;
}

const recipesByUrl = new Map();
const recipesById = new Map();
const recipesBySourceId = new Map();
for (const recipe of recipeLibrary) {
  const urlKey = recipe.sourceUrl.toLowerCase();
  recipesByUrl.set(urlKey, preferDinner(recipesByUrl.get(urlKey), recipe));
  const idKey = recipe.id.toLowerCase();
  recipesById.set(idKey, preferDinner(recipesById.get(idKey), recipe));
  const sourceIdKey = recipe.sourceUrl.match(/\/recipes\/(\d+)/i)?.[1] ?? recipe.id;
  recipesBySourceId.set(sourceIdKey, preferDinner(recipesBySourceId.get(sourceIdKey), recipe));
}

const detailMap = {};
for (const item of worklist) {
  const sourceId = item.sourceUrl.match(/\/recipes\/(\d+)/i)?.[1] ?? item.id;
  const recipe =
    recipesById.get(item.id.toLowerCase()) ??
    recipesByUrl.get(item.sourceUrl.toLowerCase()) ??
    recipesBySourceId.get(sourceId);

  if (!recipe) throw new Error(`Missing recipe match for ${item.id}`);

  const html = await fetch(item.sourceUrl).then((r) => r.text());
  const data = extractRecipeJsonLd(html);
  if (!data) throw new Error(`No Recipe JSON-LD found for ${recipe.id}`);

  const ingredients = (Array.isArray(data.recipeIngredient) ? data.recipeIngredient : [])
    .map((line) => splitIngredient(line))
    .map(({ amount, item }) => ({ amount, item, category: mapIngredientCategory(item) }));

  const rawInstructions = Array.isArray(data.recipeInstructions)
    ? data.recipeInstructions
    : data.recipeInstructions
      ? [data.recipeInstructions]
      : [];

  const instructions = rawInstructions
    .flatMap((step) => {
      if (typeof step === "string") return [normalizeText(step)];
      if (typeof step?.text === "string") return [normalizeText(step.text)];
      if (Array.isArray(step?.itemListElement)) {
        return step.itemListElement
          .map((entry) => (typeof entry === "string" ? entry : entry?.text))
          .filter((entry) => typeof entry === "string")
          .map((entry) => normalizeText(entry));
      }
      return [];
    })
    .filter(Boolean);

  if ((!ingredients.length || !instructions.length) && recipe.id === "fried-egg-quesadilla") {
    ingredients.splice(
      0,
      ingredients.length,
      { amount: "1 tablespoon", item: "butter, plus more as needed", category: "fridge" },
      { amount: "2", item: "corn tortillas", category: "pantry" },
      { amount: "to taste", item: "grated Cheddar", category: "protein" },
      { amount: "optional", item: "1 slice deli ham or some cooked bacon", category: "protein" },
      { amount: "optional", item: "chopped cilantro", category: "produce" },
      { amount: "optional", item: "salsa or hot sauce", category: "pantry" },
      { amount: "1", item: "egg", category: "protein" },
    );
    instructions.splice(
      0,
      instructions.length,
      "Melt some butter in a pan over medium heat and gently cook one corn tortilla in it.",
      "Top the tortilla with grated Cheddar, deli ham or cooked bacon if using, plus a little chopped cilantro, salsa or hot sauce, then add the second tortilla on top.",
      "Cook, flipping the quesadilla a few times, until it is crisp and golden and the cheese has melted into lace at the edges.",
      "Transfer the quesadilla to a cutting board and let it rest briefly.",
      "Add a little more butter to the pan, fry an egg, cut the quesadilla into quarters, and place the egg on top. Finish with more cilantro and hot sauce or salsa.",
    );
  }

  const duration = parseDuration(data.totalTime || data.prepTime);
  const servesMatch = String(data.recipeYield ?? "").match(/\d+/);

  detailMap[recipe.id] = {
    ...(duration ? { prepTime: duration } : {}),
    ...(servesMatch ? { serves: Number(servesMatch[0]) } : {}),
    ingredients,
    instructions,
  };

  console.log(`Generated ${recipe.id}`);
}

const content = `import type { RecipeDetailsEntry } from "./recipes";\n\nconst missingFullDetailsGenerated: Record<string, RecipeDetailsEntry> = ${JSON.stringify(detailMap, null, 2)};\n\nexport default missingFullDetailsGenerated;\n`;
const outPath = path.join(process.cwd(), "src", "data", "missing-full-details.generated.ts");
fs.writeFileSync(outPath, content, "utf8");
console.log(`Wrote ${outPath}`);
