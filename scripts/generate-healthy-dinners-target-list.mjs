import fs from "node:fs";
import path from "node:path";

const pages = [
  "https://cooking.nytimes.com/68861692-nyt-cooking/2110373-healthy-weeknight-dinners",
  "https://cooking.nytimes.com/68861692-nyt-cooking/2110373-healthy-weeknight-dinners?page=2",
  "https://cooking.nytimes.com/68861692-nyt-cooking/2110373-healthy-weeknight-dinners?page=3",
];

async function fetchCollectionPage(url) {
  const html = await fetch(url).then((r) => r.text());
  const scriptMatch = html.match(/<script type="application\/ld\+json"[^>]*>(\{[\s\S]*?\})<\/script>/);
  if (!scriptMatch) throw new Error(`No JSON-LD found for ${url}`);
  const data = JSON.parse(scriptMatch[1]);
  const items = Array.isArray(data.itemListElement) ? data.itemListElement : [];
  return items.map((item) => {
    const url = item.url ?? item.item?.url ?? null;
    return {
      position: item.position,
      url,
      id: String(url || "").match(/\/recipes\/(\d+)-/)?.[1] ?? null,
      slug: String(url || "").match(/\/recipes\/\d+-(.+)$/)?.[1] ?? null,
    };
  }).filter((item) => item.url && item.id && item.slug);
}

const pageResults = [];
for (const page of pages) {
  pageResults.push({ page, items: await fetchCollectionPage(page) });
}

const allItems = pageResults.flatMap((entry) => entry.items).map((item) => ({
  ...item,
  recipeId: item.slug,
}));

const outPath = path.join(process.cwd(), "reports", "healthy-dinners-target-list.json");
fs.writeFileSync(outPath, JSON.stringify({ count: allItems.length, items: allItems }, null, 2));
console.log(JSON.stringify({ outPath, count: allItems.length, first: allItems.slice(0, 10) }, null, 2));
