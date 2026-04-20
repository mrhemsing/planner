import fs from "node:fs";
import path from "node:path";

const sourcePath = path.join(process.cwd(), "reports", "nyt-placeholder-recipes.txt");
const outputPath = path.join(process.cwd(), "reports", "nyt-placeholder-recipes-top-20.txt");
const text = fs.readFileSync(sourcePath, "utf8");
const lines = text
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => /^\d+\. /.test(line));

const parsed = lines.map((line) => {
  const [, rest] = line.split(/\.\s+/, 2);
  const [id, title, sourceUrl] = rest.split(" | ");
  return { id, title, sourceUrl };
});

const scored = parsed.map((recipe) => {
  const title = recipe.title.toLowerCase();
  let score = 0;
  if (title.includes("chicken")) score += 5;
  if (title.includes("salmon") || title.includes("fish") || title.includes("shrimp")) score += 4;
  if (title.includes("sheet-pan") || title.includes("one-pan") || title.includes("one-pot") || title.includes("skillet")) score += 3;
  if (title.includes("pasta") || title.includes("rice") || title.includes("noodles")) score += 2;
  if (title.includes("salad") || title.includes("sandwich") || title.includes("wrap")) score += 2;
  return { ...recipe, score };
});

const top = scored
  .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
  .slice(0, 20);

const out = [
  "Top priority recipe image list (start here)",
  "",
  ...top.map((recipe, index) => `${index + 1}. ${recipe.id} | ${recipe.title} | ${recipe.sourceUrl}`),
  "",
  `Source list: ${sourcePath}`,
];

fs.writeFileSync(outputPath, out.join("\n"), "utf8");
console.log(JSON.stringify({ outputPath, count: top.length }, null, 2));
