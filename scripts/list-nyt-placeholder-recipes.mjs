import fs from "node:fs";
import path from "node:path";

const filePath = path.join(process.cwd(), "src", "data", "recipes.ts");
const outputPath = path.join(process.cwd(), "reports", "nyt-placeholder-recipes.txt");
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

const matches = [...libraryText.matchAll(entryPattern)]
  .map((match) => {
    const [, id, block] = match;
    if (!/sourceUrl:\s*/.test(block) || !/imageUrl:\s*placeholderImage,/.test(block)) return null;

    const title = stringValue(block, "title");
    const sourceUrl = stringValue(block, "sourceUrl");
    if (!title || !sourceUrl || !sourceUrl.startsWith("https://cooking.nytimes.com/recipes/")) return null;

    return { id, title, sourceUrl };
  })
  .filter(Boolean);

const lines = [
  `NYT placeholder-image recipes: ${matches.length}`,
  "",
  ...matches.map((recipe, index) => `${index + 1}. ${recipe.id} | ${recipe.title} | ${recipe.sourceUrl}`),
  "",
];

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, lines.join("\n"), "utf8");

console.log(JSON.stringify({
  outputPath,
  count: matches.length,
}, null, 2));
