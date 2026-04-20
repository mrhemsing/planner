import fs from "node:fs";
import path from "node:path";

const count = Number(process.argv[2] || 10);
if (!Number.isFinite(count) || count < 1) {
  console.error("Usage: node scripts/add-healthy-dinner-batch.mjs <count>");
  process.exit(1);
}

const recipesPath = path.join(process.cwd(), "src", "data", "recipes.ts");
const reportPath = path.join(process.cwd(), "reports", "healthy-dinners-collection-audit.json");
const recipesText = fs.readFileSync(recipesPath, "utf8");
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

const toAdd = report.missingFromPlanner.slice(0, count);
if (!toAdd.length) {
  console.log("No missing dinners to add.");
  process.exit(0);
}

function escapeText(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function summarize(text) {
  const cleaned = String(text || "Healthy NYT dinner recipe.").replace(/\s+/g, " ").trim();
  return cleaned.length > 180 ? `${cleaned.slice(0, 177).trim()}...` : cleaned;
}

async function fetchRecipeMeta(url) {
  const html = await fetch(url).then((r) => r.text());
  const scriptMatch = html.match(/<script type="application\/ld\+json"[^>]*>(\{[\s\S]*?\})<\/script>/);
  if (!scriptMatch) throw new Error(`No JSON-LD found for ${url}`);
  const data = JSON.parse(scriptMatch[1]);
  const image = Array.isArray(data.image)
    ? data.image[0]?.url ?? data.image[0]?.contentUrl ?? data.image[0]
    : typeof data.image === "string"
      ? data.image
      : data.image?.url ?? data.image?.contentUrl ?? null;
  return {
    title: data.name,
    description: summarize(data.description),
    imageUrl: image,
  };
}

const entries = [];
for (const item of toAdd) {
  const meta = await fetchRecipeMeta(item.url);
  entries.push(`  {\r\n    id: "${escapeText(item.slug)}",\r\n    title: "${escapeText(meta.title || item.slug)}",\r\n    category: "Dinner",\r\n    sourceName: dinnerSourceName,\r\n    sourceUrl: "${escapeText(item.url)}",\r\n    imageUrl: "${escapeText(meta.imageUrl || "/princess-planner-logo.jpg")}",\r\n    description: "${escapeText(meta.description)}",\r\n    favourite: false,\r\n    tags: ["dinner", "healthy dinners", "nyt"],\r\n    plannedDays: [],\r\n  },\r\n`);
}

const marker = "\r\n];\r\n\r\nconst lunchRecipes: RecipeLibraryEntry[] = [";
if (!recipesText.includes(marker)) {
  throw new Error("Could not find dinner/lunch boundary marker");
}
const updated = recipesText.replace(marker, `\r\n${entries.join("")}];\r\n\r\nconst lunchRecipes: RecipeLibraryEntry[] = [`);
fs.writeFileSync(recipesPath, updated);
console.log(JSON.stringify({ added: toAdd.map((item) => item.slug), count: toAdd.length }, null, 2));
