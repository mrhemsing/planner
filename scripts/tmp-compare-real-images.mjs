import fs from "node:fs";
import path from "node:path";

const text = fs.readFileSync(path.join(process.cwd(), "src", "data", "recipes.ts"), "utf8");

const byImageLine = [...text.matchAll(/imageUrl:\s*"([^"]+)"/g)].map((m) => m[1]);

const entryPattern = /\{\s*id: "([^"]+)",([\s\S]*?)\n  \},/g;
const stringValue = (block, key) => {
  const match = block.match(new RegExp(`${key}:\\s*"([\\s\\S]*?)",`));
  return match ? match[1].replace(/\s*\n\s*/g, "") : null;
};

const rows = [];
for (const match of text.matchAll(entryPattern)) {
  const [, id, block] = match;
  if (!/sourceUrl:\s*/.test(block) || !/imageUrl:\s*/.test(block) || /imageUrl:\s*placeholderImage,/.test(block)) continue;
  rows.push({ id, imageUrl: stringValue(block, "imageUrl") });
}

const rowIds = new Set(rows.map((r) => r.id));
const missingBlocks = [];
for (const match of text.matchAll(/id: "([^"]+)",([\s\S]*?)plannedDays: \[[^\]]*\],/g)) {
  const [, id, block] = match;
  if (/imageUrl:\s*placeholderImage,/.test(block)) continue;
  const imageUrl = stringValue(block, "imageUrl");
  if (!rowIds.has(id)) missingBlocks.push({ id, imageUrl });
}

console.log(JSON.stringify({ inlineImageCount: byImageLine.length, parsedRowCount: rows.length, missingBlocks }, null, 2));
