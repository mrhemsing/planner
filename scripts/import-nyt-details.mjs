import fs from "node:fs";
import path from "node:path";

const filePath = path.join(process.cwd(), "src", "data", "recipes.ts");
const text = fs.readFileSync(filePath, "utf8");

const targets = process.argv.slice(2);
if (!targets.length) {
  console.error("Usage: node scripts/import-nyt-details.mjs <recipe-id> [recipe-id...]");
  process.exit(1);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractBlock(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  if (start === -1) throw new Error(`Missing marker: ${startMarker}`);
  const end = source.indexOf(endMarker, start);
  if (end === -1) throw new Error(`Missing end marker: ${endMarker}`);
  return source.slice(start + startMarker.length, end);
}

const detailBlock = extractBlock(
  text,
  'const recipeDetailsMap: Record<string, RecipeDetailsEntry> = {',
  '};\r\n\r\nexport const recipeLibrary',
);

function findRecipeUrl(recipeId) {
  const pattern = new RegExp(`id: \"${escapeRegExp(recipeId)}\",[\\s\\S]*?sourceUrl: \"([^\"]+)\"`, "m");
  const match = text.match(pattern);
  if (!match) throw new Error(`Could not find sourceUrl for ${recipeId}`);
  return match[1];
}

function mapIngredientCategory(item) {
  const lower = item.toLowerCase();
  if (/(chicken|salmon|shrimp|fish|tofu|egg|eggs|tuna|turkey|sausage|meatball|meatballs|yogurt|feta|parmesan|mozzarella|ricotta|cheese|butter|milk|cream)/.test(lower)) return "protein";
  if (/(tomato|shallot|onion|garlic|scallion|scallions|lemon|lime|broccoli|asparagus|spinach|greens|kale|pepper|peppers|cucumber|avocado|herb|herbs|parsley|mint|dill|cilantro|chard|peaches|apple|apples|grapes|cauliflower|snap peas|green beans)/.test(lower)) return "produce";
  if (/(frozen)/.test(lower)) return "frozen";
  if (/(mayo|mayonnaise)/.test(lower)) return "fridge";
  return "pantry";
}

function formatIngredient(line) {
  const cleaned = line.replace(/\s*see Note.*$/i, "").trim();
  const match = cleaned.match(/^(.+?)(?:\s+(?=[A-Za-z(]))(.+)$/);
  if (!match) {
    return `{ item: ${JSON.stringify(cleaned)}, amount: "", category: "${mapIngredientCategory(cleaned)}" }`;
  }
  const amount = match[1].trim();
  const item = match[2].trim();
  return `{ item: ${JSON.stringify(item)}, amount: ${JSON.stringify(amount)}, category: "${mapIngredientCategory(item)}" }`;
}

function replaceDetailEntry(block, recipeId, newEntry) {
  const entryPattern = new RegExp(`(^\\s*\"${escapeRegExp(recipeId)}\": \{[\\s\\S]*?^\\s*\\},\\n)`, "m");
  if (entryPattern.test(block)) {
    return block.replace(entryPattern, newEntry);
  }
  return `${block}${newEntry}`;
}

let updatedDetailBlock = detailBlock;

for (const recipeId of targets) {
  const url = findRecipeUrl(recipeId);
  const html = await fetch(url).then((r) => r.text());
  const scriptMatch = html.match(/<script type="application\/ld\+json"[^>]*>(\{[\s\S]*?\})<\/script>/);
  if (!scriptMatch) throw new Error(`No JSON-LD found for ${recipeId}`);

  const data = JSON.parse(scriptMatch[1]);
  const rawIngredients = Array.isArray(data.recipeIngredient) ? data.recipeIngredient : [];
  const rawInstructions = Array.isArray(data.recipeInstructions)
    ? data.recipeInstructions
        .flatMap((step) => {
          if (typeof step === "string") return [step.trim()];
          if (typeof step?.text === "string") return [step.text.trim()];
          if (Array.isArray(step?.itemListElement)) {
            return step.itemListElement
              .map((item) => (typeof item === "string" ? item : item?.text))
              .filter((value) => typeof value === "string")
              .map((value) => value.trim());
          }
          return [];
        })
        .filter(Boolean)
    : [];
  const servingsMatch = String(data.recipeYield ?? "").match(/\d+/);
  const serves = servingsMatch ? Number(servingsMatch[0]) : undefined;
  const prepTime = data.totalTime || data.prepTime || undefined;

  const prepTimeValue = (() => {
    if (!prepTime || typeof prepTime !== "string") return undefined;
    const m = prepTime.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/i);
    if (!m) return undefined;
    const hours = m[1] ? Number(m[1]) : 0;
    const minutes = m[2] ? Number(m[2]) : 0;
    const totalMinutes = hours * 60 + minutes;
    return totalMinutes ? `${totalMinutes} min` : undefined;
  })();

  const ingredientLines = rawIngredients.map((line) => `      ${formatIngredient(line)},`).join("\n");
  const instructionLines = rawInstructions.map((step) => `      ${JSON.stringify(step)},`).join("\n");

  const entry = `  \"${recipeId}\": {\n` +
    (prepTimeValue ? `    prepTime: ${JSON.stringify(prepTimeValue)},\n` : "") +
    (serves ? `    serves: ${serves},\n` : "") +
    `    ingredients: [\n${ingredientLines}\n    ],\n` +
    `    instructions: [\n${instructionLines}\n    ],\n` +
    `  },\n`;

  updatedDetailBlock = replaceDetailEntry(updatedDetailBlock, recipeId, entry);
  console.log(`Imported ${recipeId} from ${url}`);
}

const updatedText = text.replace(
  `const recipeDetailsMap: Record<string, RecipeDetailsEntry> = {${detailBlock}};\r\n\r\nexport const recipeLibrary`,
  `const recipeDetailsMap: Record<string, RecipeDetailsEntry> = {${updatedDetailBlock}};\r\n\r\nexport const recipeLibrary`,
);
fs.writeFileSync(filePath, updatedText);
