import fs from "node:fs";
import path from "node:path";

const sourcePath = path.join(process.cwd(), "reports", "remaining-real-image-assignments.txt");
const outputPath = path.join(process.cwd(), "reports", "high-risk-image-review.txt");
const text = fs.readFileSync(sourcePath, "utf8");
const rows = text
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => /^\d+\. /.test(line))
  .map((line) => {
    const [, rest] = line.split(/\.\s+/, 2);
    const [id, title, sourceUrl, imageUrl] = rest.split(" | ");
    return { id, title, sourceUrl, imageUrl };
  });

const riskyTerms = [
  "magazine",
  "videoSixteenByNine",
  "articleLarge",
  "facebookJumbo",
  "merlin_",
  "NORECIPE",
];

const scored = rows.map((row) => {
  let score = 0;
  for (const term of riskyTerms) {
    if (row.imageUrl.includes(term)) score += 2;
  }
  const titleWords = row.title.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const urlLower = row.imageUrl.toLowerCase();
  const shared = titleWords.filter((word) => word.length >= 5 && urlLower.includes(word)).length;
  if (shared === 0) score += 3;
  if (shared === 1) score += 1;
  return { ...row, score, shared };
});

const top = scored
  .filter((row) => row.score > 0)
  .sort((a, b) => b.score - a.score || a.shared - b.shared || a.title.localeCompare(b.title))
  .slice(0, 20);

const lines = [
  "High-risk image review list",
  "",
  ...top.map((row, index) => `${index + 1}. score=${row.score} shared=${row.shared} | ${row.id} | ${row.title} | ${row.sourceUrl} | ${row.imageUrl}`),
  "",
  `Source list: ${sourcePath}`,
];

fs.writeFileSync(outputPath, lines.join("\n"), "utf8");
console.log(JSON.stringify({ outputPath, count: top.length }, null, 2));
