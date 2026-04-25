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

const slugMismatchMap = new Map();
for (const [index, url] of urls.entries()) {
  if (!url.includes("cooking.nytimes.com")) continue;
  const slug = url.split("/").filter(Boolean).pop() ?? "";
  const id = ids[index];
  if (!id || !slug || id === slug) continue;
  const key = `${index}:${id}:${slug}`;
  slugMismatchMap.set(key, {
    index: index + 1,
    id,
    slug,
    url,
  });
}
const slugMismatches = [...slugMismatchMap.values()];

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

if (!duplicateIds.length && !duplicateTitles.length && !slugCoreMismatches.length && !invalidNytUrls.length) {
  console.log("\nAudit passed without duplicate titles, duplicate IDs, slug core mismatches, or NYT URL format errors.");
}
