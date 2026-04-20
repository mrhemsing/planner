import fs from "node:fs";
import path from "node:path";

const filePath = path.join(process.cwd(), "src", "data", "recipes.ts");
const outputPath = path.join(process.cwd(), "reports", "remaining-real-image-assignments.txt");
const text = fs.readFileSync(filePath, "utf8");

const entryPattern = /\{\s*id: "([^"]+)",([\s\S]*?)\n  \},/g;
const stringValue = (block, key) => {
  const match = block.match(new RegExp(`${key}:\\s*"([\\s\\S]*?)",`));
  return match ? match[1].replace(/\s*\n\s*/g, "") : null;
};

const rows = [];
for (const match of text.matchAll(entryPattern)) {
  const [, id, block] = match;
  if (!/sourceUrl:\s*/.test(block) || !/imageUrl:\s*/.test(block) || /imageUrl:\s*placeholderImage,/.test(block)) continue;

  const title = stringValue(block, "title");
  const sourceUrl = stringValue(block, "sourceUrl");
  const imageUrl = stringValue(block, "imageUrl");
  if (!title || !sourceUrl || !imageUrl) continue;

  rows.push({ id, title, sourceUrl, imageUrl });
}

const lines = [
  `Recipes with real image assignments: ${rows.length}`,
  "",
  ...rows.map((row, index) => `${index + 1}. ${row.id} | ${row.title} | ${row.sourceUrl} | ${row.imageUrl}`),
  "",
];

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, lines.join("\n"), "utf8");
console.log(JSON.stringify({ outputPath, count: rows.length }, null, 2));
