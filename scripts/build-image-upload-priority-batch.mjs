import fs from "node:fs";
import path from "node:path";

const sourcePath = path.join(process.cwd(), "reports", "image-upload-manifest.csv");
const outputPath = path.join(process.cwd(), "reports", "image-upload-priority-batch.csv");
const text = fs.readFileSync(sourcePath, "utf8").trim();
const lines = text.split(/\r?\n/).slice(1).filter(Boolean);

const rows = lines.map((line) => {
  const cells = [...line.matchAll(/"((?:[^"]|"")*)"/g)].map((m) => m[1].replaceAll('""', '"'));
  const [id, title, sourceUrl, suggestedFile, targetPath] = cells;
  let score = 0;
  const lower = title.toLowerCase();
  if (lower.includes("chicken")) score += 5;
  if (lower.includes("salmon") || lower.includes("fish") || lower.includes("shrimp")) score += 4;
  if (lower.includes("sheet-pan") || lower.includes("one-pan") || lower.includes("one-pot") || lower.includes("skillet")) score += 3;
  if (lower.includes("pasta") || lower.includes("rice") || lower.includes("noodles")) score += 2;
  if (lower.includes("salad") || lower.includes("sandwich") || lower.includes("wrap")) score += 2;
  return { id, title, sourceUrl, suggestedFile, targetPath, score };
});

const top = rows
  .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
  .slice(0, 25);

const csv = [
  ["priority", "id", "title", "sourceUrl", "suggestedFile", "targetPath", "score"].join(","),
  ...top.map((row, index) => [index + 1, row.id, row.title, row.sourceUrl, row.suggestedFile, row.targetPath, row.score].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")),
  "",
].join("\n");

fs.writeFileSync(outputPath, csv, "utf8");
console.log(JSON.stringify({ outputPath, count: top.length }, null, 2));
