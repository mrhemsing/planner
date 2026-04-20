import fs from "node:fs";
import path from "node:path";

const sourcePath = path.join(process.cwd(), "reports", "nyt-placeholder-recipes.txt");
const outputPath = path.join(process.cwd(), "reports", "image-upload-manifest.csv");
const text = fs.readFileSync(sourcePath, "utf8");
const rows = text
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => /^\d+\. /.test(line))
  .map((line) => {
    const [, rest] = line.split(/\.\s+/, 2);
    const [id, title, sourceUrl] = rest.split(" | ");
    return {
      id,
      title,
      sourceUrl,
      suggestedFile: `${id}.jpg`,
      targetPath: `/recipe-images/${id}.jpg`,
    };
  });

const csv = [
  ["id", "title", "sourceUrl", "suggestedFile", "targetPath"].join(","),
  ...rows.map((row) => [row.id, row.title, row.sourceUrl, row.suggestedFile, row.targetPath].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")),
  "",
].join("\n");

fs.writeFileSync(outputPath, csv, "utf8");
console.log(JSON.stringify({ outputPath, count: rows.length }, null, 2));
