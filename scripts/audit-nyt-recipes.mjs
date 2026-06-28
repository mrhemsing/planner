import fs from "node:fs";
import path from "node:path";

const filePath = path.join(process.cwd(), "src", "data", "recipes.ts");
const text = fs.readFileSync(filePath, "utf8");

const recipeEntryPattern = /\{\s*id: "([^"]+)",([\s\S]*?)\n  \},/g;
const stringValue = (block, key) => {
  const match = block.match(new RegExp(`${key}:\\s*"([\\s\\S]*?)",`));
  return match ? match[1].replace(/\s*\n\s*/g, "") : null;
};

const recipeEntries = [...text.matchAll(recipeEntryPattern)].map((match) => {
  const [, id, block] = match;
  if (!/sourceUrl:\s*/.test(block) || !/imageUrl:\s*/.test(block)) return null;
  return {
    id,
    title: stringValue(block, "title"),
    category: stringValue(block, "category"),
    sourceUrl: stringValue(block, "sourceUrl"),
    imageUrl: /imageUrl:\s*placeholderImage,/.test(block) ? null : stringValue(block, "imageUrl"),
  };
}).filter(Boolean);

const ids = [...text.matchAll(/id: "([^"]+)"/g)].map((match) => match[1]);
const titleCategoryPairs = recipeEntries.map((entry) => `${entry.category ?? "unknown"}::${entry.title}`);
const urls = [...text.matchAll(/sourceUrl: "([^"]+)"/g)].map((match) => match[1]);
const images = recipeEntries.map((entry) => entry.imageUrl).filter(Boolean);
const nytUrls = urls.filter((url) => url.includes("cooking.nytimes.com"));

function duplicates(values) {
  const counts = new Map();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => a[0].localeCompare(b[0]));
}

const duplicateIds = duplicates(ids);
const duplicateTitles = duplicates(titleCategoryPairs).map(([value, count]) => {
  const [category, title] = value.split("::");
  return [`${title} [${category}]`, count];
});

const slugMismatches = [];
for (const [index, entry] of recipeEntries.entries()) {
  const url = entry.sourceUrl;
  if (!url.includes("cooking.nytimes.com")) continue;
  const pathname = new URL(url).pathname;
  const slug = pathname.split("/").filter(Boolean).pop() ?? "";
  const id = entry.id;
  if (!id || !slug || id === slug) continue;
  slugMismatches.push({
    index: index + 1,
    id,
    slug,
    url,
  });
}

const invalidNytUrls = nytUrls.filter(
  (url) => !/^https:\/\/cooking\.nytimes\.com\/recipes\/\d+-[a-z0-9-]+$/.test(url),
);

const nonRecipeUrls = urls.filter((url) => !url.includes("/recipes/") && !url.includes("/blogs/recipes/"));

const normalizePlannerIdForSlug = (id) => id.replace(/-(dinner|lunch)$/, "");

const slugCoreMismatches = slugMismatches.filter((entry) => {
  const normalizedSlug = entry.slug.replace(/^\d+-/, "");
  return normalizePlannerIdForSlug(entry.id) !== normalizedSlug;
});
const placeholderImageReferences = recipeEntries.filter((entry) => !entry.imageUrl).length;
const recipesMissingImageField = ids.length - recipeEntries.length;
const defaultOgImages = images.filter((url) => url === "https://cooking.nytimes.com/assets/defaultOg.png").length;
const literalPlaceholderImages = images.filter((url) => url === "/princess-planner-logo.jpg").length;
const recipesWithRealImages = images.filter(
  (url) => url !== "https://cooking.nytimes.com/assets/defaultOg.png" && url !== "/princess-planner-logo.jpg",
).length;
const recipesWithoutRealImages = recipesMissingImageField + placeholderImageReferences + defaultOgImages + literalPlaceholderImages;
const detailedRecipeCount = (text.match(/instructions:\s*\[/g) ?? []).length;
const ingredientCoverageCount = (text.match(/ingredients:\s*ingredientMap\[/g) ?? []).length;
const dinnerCount = (text.match(/category: "Dinner"/g) ?? []).length;
const lunchCount = (text.match(/category: "Lunch"/g) ?? []).length;
const favouriteCount = (text.match(/favourite: true/g) ?? []).length;
const plannedCount = (text.match(/plannedDays: \[[^\]]+\]/g) ?? []).filter(
  (entry) => entry !== "plannedDays: []",
).length;

const healthyDinnerTargetsPath = path.join(process.cwd(), "reports", "healthy-dinners-target-list.json");
const healthyDinnerTargets = JSON.parse(fs.readFileSync(healthyDinnerTargetsPath, "utf8"));
const healthyDinnerItems = Array.isArray(healthyDinnerTargets.items) ? healthyDinnerTargets.items : [];

function preferDinner(current, candidate) {
  if (!current) return candidate;
  if (current.category === "Dinner") return current;
  if (candidate.category === "Dinner") return candidate;
  return current;
}

const recipesByUrl = new Map();
const recipesById = new Map();
const recipesBySourceId = new Map();

for (const recipe of recipeEntries) {
  recipesByUrl.set(recipe.sourceUrl.toLowerCase(), preferDinner(recipesByUrl.get(recipe.sourceUrl.toLowerCase()), recipe));
  recipesById.set(recipe.id.toLowerCase(), preferDinner(recipesById.get(recipe.id.toLowerCase()), recipe));

  const sourceId = recipe.sourceUrl.match(/\/recipes\/(\d+)/i)?.[1] ?? recipe.id;
  recipesBySourceId.set(sourceId, preferDinner(recipesBySourceId.get(sourceId), recipe));
}

const matchedHealthyDinnerRecipeIds = new Set();
const missingHealthyDinnerTargets = [];

for (const item of healthyDinnerItems) {
  const recipe =
    recipesByUrl.get(String(item.url ?? "").toLowerCase()) ??
    recipesById.get(String(item.recipeId ?? "").toLowerCase()) ??
    recipesById.get(String(item.slug ?? "").toLowerCase()) ??
    recipesBySourceId.get(String(item.id ?? ""));

  if (recipe) {
    matchedHealthyDinnerRecipeIds.add(recipe.id);
  } else {
    missingHealthyDinnerTargets.push(item);
  }
}

const recentlyAddedWindowMs = 30 * 24 * 60 * 60 * 1000;
const recentCutoff = Date.now() - recentlyAddedWindowMs;
const recentlyAddedTargetRecipeIds = healthyDinnerItems
  .filter((item) => {
    if (typeof item.addedAt !== "string") return false;
    const addedAt = Date.parse(`${item.addedAt}T00:00:00.000Z`);
    return Number.isFinite(addedAt) && addedAt >= recentCutoff;
  })
  .map((item) => String(item.recipeId ?? "").toLowerCase());
const recentlyAddedTargetsMissingRecipes = recentlyAddedTargetRecipeIds.filter((recipeId) => !recipesById.has(recipeId));

const healthyDinnerReportCount = Number(healthyDinnerTargets.count);
const healthyDinnerItemCount = healthyDinnerItems.length;
const healthyDinnerHomepageCount = matchedHealthyDinnerRecipeIds.size;
const recentlyAddedHomepageCount = recentlyAddedTargetRecipeIds.length - recentlyAddedTargetsMissingRecipes.length;

const summary = {
  recipeCount: ids.length,
  dinnerCount,
  lunchCount,
  favouriteCount,
  plannedCount,
  detailedRecipeCount,
  ingredientCoverageCount,
  duplicateIds: duplicateIds.length,
  duplicateTitles: duplicateTitles.length,
  slugIdPrefixDifferences: slugMismatches.length,
  slugCoreMismatches: slugCoreMismatches.length,
  invalidNytUrls: invalidNytUrls.length,
  nonRecipeUrls: nonRecipeUrls.length,
  placeholderImageReferences,
  recipesMissingImageField,
  defaultOgImages,
  literalPlaceholderImages,
  recipesWithoutRealImages,
  recipesWithRealImages,
  healthyDinnerReportCount,
  healthyDinnerItemCount,
  healthyDinnerHomepageCount,
  recentlyAddedTargetCount: recentlyAddedTargetRecipeIds.length,
  recentlyAddedHomepageCount,
};

console.log(JSON.stringify(summary, null, 2));

if (duplicateIds.length) {
  console.log("\nDuplicate IDs:");
  for (const [value, count] of duplicateIds) {
    console.log(`- ${value} (${count})`);
  }
}

if (duplicateTitles.length) {
  console.log("\nDuplicate titles:");
  for (const [value, count] of duplicateTitles) {
    console.log(`- ${value} (${count})`);
  }
}

if (slugCoreMismatches.length) {
  console.log("\nSlug mismatches after stripping numeric NYT recipe IDs:");
  for (const entry of slugCoreMismatches) {
    console.log(`- #${entry.index}: id=${entry.id} slug=${entry.slug}`);
  }
}

if (invalidNytUrls.length) {
  console.log("\nInvalid NYT URLs:");
  for (const url of invalidNytUrls) {
    console.log(`- ${url}`);
  }
}

if (healthyDinnerReportCount !== healthyDinnerItemCount) {
  console.log(`\nHealthy dinner report count mismatch: count=${healthyDinnerReportCount}, items=${healthyDinnerItemCount}`);
}

if (missingHealthyDinnerTargets.length) {
  console.log("\nHealthy dinner targets missing matching recipes:");
  for (const item of missingHealthyDinnerTargets) {
    console.log(`- #${item.position}: ${item.recipeId ?? item.slug ?? item.id} (${item.url})`);
  }
}

if (recentlyAddedTargetsMissingRecipes.length) {
  console.log("\nRecently added healthy dinner targets missing matching recipes:");
  for (const recipeId of recentlyAddedTargetsMissingRecipes) {
    console.log(`- ${recipeId}`);
  }
}

const hasHealthyDinnerCountError =
  healthyDinnerReportCount !== healthyDinnerItemCount ||
  healthyDinnerHomepageCount !== healthyDinnerItemCount ||
  recentlyAddedHomepageCount !== recentlyAddedTargetRecipeIds.length;

if (!duplicateIds.length && !duplicateTitles.length && !slugCoreMismatches.length && !invalidNytUrls.length && !hasHealthyDinnerCountError) {
  console.log(
    "\nAudit passed without duplicate titles, duplicate IDs, slug core mismatches, NYT URL format errors, or homepage/report count drift.",
  );
}

if (hasHealthyDinnerCountError) {
  process.exitCode = 1;
}
