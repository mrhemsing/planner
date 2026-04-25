import fs from "node:fs";
import path from "node:path";

const filePath = path.join(process.cwd(), "src", "data", "recipes.ts");
const text = fs.readFileSync(filePath, "utf8");

const recipeEntryPattern = /\{\s*id: "([^"]+)",([\s\S]*?)\n  \},/g;
const stringValue = (block, key) => {
  const match = block.match(new RegExp(`${key}:\\s*"([\\s\\S]*?)",`));
  return match ? match[1].replace(/\s*\n\s*/g, "") : null;
};

const slugify = (value) => value
  .toLowerCase()
  .replace(/['’.:,()]/g, "")
  .replace(/&/g, " and ")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .replace(/-+/g, "-");

const normalizeTitle = (title) => title
  .replace(/ recipe$/i, "")
  .replace(/ \(with video\)$/i, "")
  .trim();

const entries = [...text.matchAll(recipeEntryPattern)].map((match) => {
  const [, id, block] = match;
  const sourceUrl = stringValue(block, "sourceUrl");
  if (!sourceUrl || !/imageUrl:\s*placeholderImage,/.test(block)) return null;
  return {
    id,
    title: stringValue(block, "title"),
    sourceUrl,
  };
}).filter(Boolean).filter((entry) => entry.sourceUrl.includes("cooking.nytimes.com/recipes/"));

const results = [];
for (const entry of entries) {
  try {
    const response = await fetch(entry.sourceUrl, { redirect: "follow" });
    const html = await response.text();
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const finalUrl = response.url;
    const finalTitle = normalizeTitle(titleMatch?.[1]?.replace(/\s+/g, " ").trim() ?? "");
    const finalSlug = finalUrl.split("/").filter(Boolean).pop() ?? "";
    const normalizedFinalSlug = finalSlug.replace(/^\d+-/, "");
    const normalizedTitleSlug = slugify(finalTitle);
    results.push({
      ...entry,
      status: response.status,
      finalUrl,
      finalTitle,
      redirected: finalUrl !== entry.sourceUrl,
      finalSlug,
      titleSlugMatchesId: normalizedTitleSlug === entry.id,
      finalSlugMatchesId: normalizedFinalSlug === entry.id,
    });
  } catch (error) {
    results.push({
      ...entry,
      status: "error",
      error: String(error),
      finalUrl: null,
      finalTitle: null,
      redirected: false,
      titleSlugMatchesId: false,
      finalSlugMatchesId: false,
    });
  }
}

const redirectedCount = results.filter((r) => r.redirected).length;
const titleMismatchCount = results.filter((r) => r.finalTitle && !r.titleSlugMatchesId).length;
const finalSlugMismatchCount = results.filter((r) => r.finalUrl && !r.finalSlugMatchesId).length;
const fetchErrorCount = results.filter((r) => r.status === "error").length;

console.log(JSON.stringify({
  placeholderNytRecipeCount: results.length,
  redirectedCount,
  titleMismatchCount,
  finalSlugMismatchCount,
  fetchErrorCount,
}, null, 2));

const flagged = results.filter((r) => r.redirected || !r.titleSlugMatchesId || !r.finalSlugMatchesId || r.status === "error");
if (flagged.length) {
  console.log("\nFlagged placeholder NYT links:");
  for (const entry of flagged) {
    console.log(`- id=${entry.id}`);
    console.log(`  sourceUrl=${entry.sourceUrl}`);
    if (entry.finalUrl) console.log(`  finalUrl=${entry.finalUrl}`);
    if (entry.finalTitle) console.log(`  finalTitle=${entry.finalTitle}`);
    if (entry.error) console.log(`  error=${entry.error}`);
  }
}
