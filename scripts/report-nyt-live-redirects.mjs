import fs from "node:fs";
import path from "node:path";

const auditPath = path.join(process.cwd(), "reports", "nyt-live-url-audit-2026-04-17.txt");
const outputPath = path.join(process.cwd(), "reports", "nyt-live-redirects-summary.txt");
const text = fs.readFileSync(auditPath, "utf8");

const lines = text.split(/\r?\n/);
const redirectedHeaderIndex = lines.findIndex((line) => line.trim() === "Redirected URLs:");
const slugMismatchHeaderIndex = lines.findIndex((line) => line.trim() === "Slug mismatches:");

const redirectLines = lines
  .slice(redirectedHeaderIndex + 1, slugMismatchHeaderIndex === -1 ? undefined : slugMismatchHeaderIndex)
  .map((line) => line.trim())
  .filter((line) => line.startsWith("- "));

const redirects = redirectLines.map((line) => {
  const match = line.match(/^- ([^:]+): (https:\/\/[^\s]+) -> (https:\/\/[^\s]+)$/);
  if (!match) {
    return null;
  }

  const [, id, sourceUrl, finalUrl] = match;
  const finalSlug = finalUrl.split("/").filter(Boolean).pop() ?? "";

  return { id, sourceUrl, finalUrl, finalSlug };
}).filter(Boolean);

const outputLines = [
  `Redirecting NYT recipe URLs: ${redirects.length}`,
  "",
];

redirects.forEach((entry, index) => {
  outputLines.push(`${index + 1}. ${entry.id}`);
  outputLines.push(`   source: ${entry.sourceUrl}`);
  outputLines.push(`   live:   ${entry.finalUrl}`);
  outputLines.push(`   final slug: ${entry.finalSlug}`);
});

fs.writeFileSync(outputPath, `${outputLines.join("\n")}\n`, "utf8");
console.log(JSON.stringify({ outputPath, count: redirects.length }, null, 2));
