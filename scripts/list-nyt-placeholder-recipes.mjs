import fs from "node:fs";
import path from "node:path";

const filePath = path.join(process.cwd(), "src", "data", "recipes.ts");
const txtOutputPath = path.join(process.cwd(), "reports", "nyt-placeholder-recipes.txt");
const mdOutputPath = path.join(process.cwd(), "reports", "remaining-placeholder-worklist.md");
const text = fs.readFileSync(filePath, "utf8");

const between = (startMarker, endMarker) => {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker);
  if (start === -1 || end === -1 || end <= start) return "";
  return text.slice(start, end);
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

const defaultOgImage = "https://cooking.nytimes.com/assets/defaultOg.png";
const literalPlaceholderImage = "/princess-planner-logo.jpg";

const matches = [...libraryText.matchAll(entryPattern)]
  .map((match) => {
    const [, id, block] = match;
    if (!/sourceUrl:\s*/.test(block) || !/imageUrl:\s*/.test(block)) return null;

    const title = stringValue(block, "title");
    const category = stringValue(block, "category");
    const sourceUrl = stringValue(block, "sourceUrl");
    const imageUrl = /imageUrl:\s*placeholderImage,/.test(block) ? literalPlaceholderImage : stringValue(block, "imageUrl");
    if (!title || !category || !sourceUrl || !sourceUrl.startsWith("https://cooking.nytimes.com/recipes/")) return null;
    if (!imageUrl || (imageUrl !== defaultOgImage && imageUrl !== literalPlaceholderImage)) return null;

    return {
      id,
      title,
      category,
      sourceUrl,
      imageStatus: imageUrl === defaultOgImage ? "default-og" : "placeholder",
    };
  })
  .filter(Boolean)
  .sort((a, b) => a.title.localeCompare(b.title));

const byCategory = {
  Dinner: matches.filter((recipe) => recipe.category === "Dinner"),
  Lunch: matches.filter((recipe) => recipe.category === "Lunch"),
};

const txtLines = [
  `NYT recipes without real images: ${matches.length}`,
  "",
  ...matches.map((recipe, index) => `${index + 1}. ${recipe.category} | ${recipe.imageStatus} | ${recipe.id} | ${recipe.title} | ${recipe.sourceUrl}`),
  "",
];

const mdLines = [
  "# Remaining placeholder-image recipes",
  "",
  `Total remaining: ${matches.length}`,
  "",
  `## Dinner (${byCategory.Dinner.length})`,
  "",
  ...(byCategory.Dinner.length ? byCategory.Dinner.map((recipe) => `- ${recipe.id} | ${recipe.title} | ${recipe.imageStatus}`) : ["- None"]),
  "",
  `## Lunch (${byCategory.Lunch.length})`,
  "",
  ...(byCategory.Lunch.length ? byCategory.Lunch.map((recipe) => `- ${recipe.id} | ${recipe.title} | ${recipe.imageStatus}`) : ["- None"]),
  "",
];

fs.mkdirSync(path.dirname(txtOutputPath), { recursive: true });
fs.writeFileSync(txtOutputPath, txtLines.join("\n"), "utf8");
fs.writeFileSync(mdOutputPath, mdLines.join("\n"), "utf8");

console.log(JSON.stringify({
  txtOutputPath,
  mdOutputPath,
  count: matches.length,
  dinnerCount: byCategory.Dinner.length,
  lunchCount: byCategory.Lunch.length,
}, null, 2));
