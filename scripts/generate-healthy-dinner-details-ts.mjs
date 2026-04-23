import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { recipeLibrary } = require("../src/data/recipes.ts");
const targetList = require("../reports/healthy-dinners-target-list.json").items;

function preferDinner(current, candidate) {
  if (!current) return candidate;
  if (current.category === "Dinner") return current;
  if (candidate.category === "Dinner") return candidate;
  return current;
}

function mapIngredientCategory(item) {
  const lower = item.toLowerCase();
  if (/(chicken|salmon|shrimp|fish|tofu|egg|eggs|tuna|turkey|sausage|meatball|meatballs|yogurt|feta|parmesan|mozzarella|ricotta|cheese|butter|milk|cream|paneer|cod|halibut|swordfish|pork|beef)/.test(lower)) return "protein";
  if (/(tomato|shallot|onion|garlic|scallion|scallions|lemon|lime|broccoli|asparagus|spinach|greens|kale|pepper|peppers|cucumber|avocado|herb|herbs|parsley|mint|dill|cilantro|chard|peaches|apple|apples|grapes|cauliflower|snap peas|green beans|zucchini|carrot|carrots|lettuce|cabbage|radicchio|squash|jalape|chile|chili|mushroom|mushrooms|beans|chickpeas)/.test(lower)) return "produce";
  if (/(frozen)/.test(lower)) return "frozen";
  if (/(mayo|mayonnaise)/.test(lower)) return "fridge";
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
for (const item of targetList) {
  const recipe =
    recipesByUrl.get(item.url.toLowerCase()) ??
    recipesById.get(item.recipeId.toLowerCase()) ??
    recipesById.get(item.slug.toLowerCase()) ??
    recipesBySourceId.get(item.id);
  if (!recipe) throw new Error(`Missing recipe for target #${item.position}`);

  const html = await fetch(item.url).then((r) => r.text());
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

const content = `import type { RecipeDetailsEntry } from "./recipes";\n\nconst healthyDinnerGeneratedDetails: Record<string, RecipeDetailsEntry> = ${JSON.stringify(detailMap, null, 2)};\n\nexport default healthyDinnerGeneratedDetails;\n`;
const outPath = path.join(process.cwd(), "src", "data", "healthy-dinner-details.generated.ts");
fs.writeFileSync(outPath, content, "utf8");
console.log(`Wrote ${outPath}`);
