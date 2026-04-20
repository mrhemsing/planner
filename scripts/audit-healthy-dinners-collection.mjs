import fs from "node:fs";
import path from "node:path";

const pages = [
  "https://cooking.nytimes.com/68861692-nyt-cooking/2110373-healthy-weeknight-dinners",
  "https://cooking.nytimes.com/68861692-nyt-cooking/2110373-healthy-weeknight-dinners?page=2",
  "https://cooking.nytimes.com/68861692-nyt-cooking/2110373-healthy-weeknight-dinners?page=3",
];

async function fetchCollectionPage(url) {
  const html = await fetch(url).then((r) => r.text());
  const scriptMatch = html.match(/<script type="application\/ld\+json"[^>]*>(\{[\s\S]*?\})<\/script>/);
  if (!scriptMatch) throw new Error(`No JSON-LD found for ${url}`);
  const data = JSON.parse(scriptMatch[1]);
  const items = Array.isArray(data.itemListElement) ? data.itemListElement : [];
  return items.map((item) => {
    const recipe = item.item ?? {};
    const url = item.url ?? recipe.url ?? null;
    return {
      position: item.position,
      title: recipe.name ?? null,
      url,
      id: String(url || "").match(/\/recipes\/(\d+)-/)?.[1] ?? null,
      slug: String(url || "").match(/\/recipes\/\d+-(.+)$/)?.[1] ?? null,
    };
  });
}

const pageResults = [];
for (const page of pages) {
  pageResults.push({ page, items: await fetchCollectionPage(page) });
}

const allItems = pageResults.flatMap((entry) => entry.items);
const recipesPath = path.join(process.cwd(), "src", "data", "recipes.ts");
const recipesText = fs.readFileSync(recipesPath, "utf8");

const dinnerStart = recipesText.indexOf("const dinnerRecipes: RecipeLibraryEntry[] = [");
const lunchStart = recipesText.indexOf("const lunchRecipes: RecipeLibraryEntry[] = [");
if (dinnerStart === -1 || lunchStart === -1 || lunchStart <= dinnerStart) {
  throw new Error("Could not locate dinnerRecipes/lunchRecipes boundaries in recipes.ts");
}
const dinnerBlock = recipesText.slice(dinnerStart, lunchStart);
const entryChunks = dinnerBlock
  .split(/\r?\n  \{\r?\n/)
  .slice(1)
  .map((chunk) => `  {\n${chunk}`);
const dinnerEntries = entryChunks
  .map((chunk) => {
    const id = chunk.match(/\r?\n\s*id: "([^"]+)"/)?.[1] ?? null;
    const sourceUrl = chunk.match(/\r?\n\s*sourceUrl:\s*\r?\n?\s*"([^"]+)"/)?.[1] ?? null;
    return {
      id,
      sourceUrl,
      sourceId: sourceUrl?.match(/\/recipes\/(\d+)-/)?.[1] ?? null,
      sourceSlug: sourceUrl?.match(/\/recipes\/\d+-(.+)$/)?.[1] ?? null,
    };
  })
  .filter((entry) => entry.id && entry.sourceUrl);

const collectionIds = new Set(allItems.map((item) => item.id).filter(Boolean));
const plannerDinnerIds = new Set(dinnerEntries.map((entry) => entry.sourceId).filter(Boolean));

const missingFromPlanner = allItems.filter((item) => item.id && !plannerDinnerIds.has(item.id));
const extraInPlanner = dinnerEntries.filter((entry) => entry.sourceId && !collectionIds.has(entry.sourceId));
const matched = allItems.filter((item) => item.id && plannerDinnerIds.has(item.id));

const report = {
  pageCounts: pageResults.map((entry) => ({ page: entry.page, count: entry.items.length })),
  collectionCount: allItems.length,
  plannerDinnerCount: dinnerEntries.length,
  matchedCount: matched.length,
  missingFromPlannerCount: missingFromPlanner.length,
  extraInPlannerCount: extraInPlanner.length,
  missingFromPlanner,
  extraInPlanner,
};

const outPath = path.join(process.cwd(), "reports", "healthy-dinners-collection-audit.json");
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outPath, ...report }, null, 2));
