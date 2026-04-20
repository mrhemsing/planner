import fs from "node:fs";
import path from "node:path";

const recipesPath = path.join(process.cwd(), "src", "data", "recipes.ts");
const auditPath = path.join(process.cwd(), "reports", "nyt-live-url-audit-2026-04-17.txt");
const outputPath = path.join(process.cwd(), "reports", "nyt-safe-placeholder-image-candidates.txt");

const recipesText = fs.readFileSync(recipesPath, "utf8");
const auditText = fs.readFileSync(auditPath, "utf8");

const between = (startMarker, endMarker) => {
  const start = recipesText.indexOf(startMarker);
  const end = recipesText.indexOf(endMarker);
  if (start === -1 || end === -1 || end <= start) return "";
  return recipesText.slice(start, end);
};

const libraryText = [
  between("const dinnerRecipes: RecipeLibraryEntry[] = [", "const lunchRecipes: RecipeLibraryEntry[] = ["),
  between("const lunchRecipes: RecipeLibraryEntry[] = [", "const ingredientMap: Record<string, Ingredient[]> = {"),
].join("\n");

const entryPattern = /\{\s*id: "([^"]+)",([\s\S]*?)\n  \},/g;
const stringValue = (block, key) => {
  const match = block.match(new RegExp(`${key}:\\s*"([\\s\\S]*?)",`));
  return match ? match[1].replace(/\s*\n\s*/g, "") : null;
};

const redirectedIds = new Set(
  [...auditText.matchAll(/^- ([^:]+): https:\/\/cooking\.nytimes\.com\/recipes\/[^\s]+ -> https:\/\/cooking\.nytimes\.com\/recipes\/[^\s]+$/gm)]
    .map((match) => match[1])
);

const candidates = [...libraryText.matchAll(entryPattern)]
  .map((match) => {
    const [, id, block] = match;
    if (!/imageUrl:\s*placeholderImage,/.test(block)) return null;

    const title = stringValue(block, "title");
    const sourceUrl = stringValue(block, "sourceUrl");
    if (!title || !sourceUrl || !sourceUrl.startsWith("https://cooking.nytimes.com/recipes/")) return null;
    if (redirectedIds.has(id)) return null;

    return { id, title, sourceUrl };
  })
  .filter(Boolean);

const lines = [
  `NYT placeholder-image recipes with non-redirecting live URLs: ${candidates.length}`,
  "",
  ...candidates.map((recipe, index) => `${index + 1}. ${recipe.id} | ${recipe.title} | ${recipe.sourceUrl}`),
  "",
];

fs.writeFileSync(outputPath, lines.join("\n"), "utf8");
console.log(JSON.stringify({ outputPath, count: candidates.length }, null, 2));
