import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const indexUrl = "https://wildrose.ca/blogs/recipes";
const discoveredUrls = new Set();

for (let page = 1; page <= 6; page += 1) {
  const pageUrl = page === 1 ? indexUrl : `${indexUrl}?page=${page}`;
  const html = await fetch(pageUrl).then((response) => response.text());
  const pageMatches = Array.from(
    new Set(
      Array.from(html.matchAll(/href="(\/blogs\/recipes\/[^"]+)"/g), (match) =>
        new URL(match[1], indexUrl).toString(),
      ),
    ),
  ).filter((url) => url !== indexUrl);

  if (!pageMatches.length) {
    break;
  }

  let newCount = 0;

  for (const url of pageMatches) {
    if (!discoveredUrls.has(url)) {
      discoveredUrls.add(url);
      newCount += 1;
    }
  }

  if (page > 1 && newCount === 0) {
    break;
  }
}

const urls = Array.from(discoveredUrls);
const results = [];

for (const url of urls) {
  const html = await fetch(url).then((response) => response.text());
  const id = url.split("/").pop();
  const fallbackTitle = id
    ?.split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  const title =
    html.match(/<meta property="og:title" content="([^"]+)"/)?.[1] ??
    html.match(/<title>([^<]+)<\/title>/)?.[1] ??
    fallbackTitle ??
    "";
  const imageUrl =
    html.match(/<meta property="og:image" content="([^"]+)"/)?.[1] ?? "";
  const description =
    html.match(/<meta property="og:description" content="([^"]+)"/)?.[1] ??
    html.match(/<meta name="description" content="([^"]+)"/)?.[1] ??
    "";

  results.push({
    id,
    title,
    sourceUrl: url,
    imageUrl,
    description,
  });
}

const outputPath = fileURLToPath(new URL("../src/data/wildrose-imports.generated.json", import.meta.url));
await writeFile(outputPath, `${JSON.stringify(results, null, 2)}\n`);
console.log(`Discovered ${urls.length} Wild Rose recipe URLs from ${indexUrl}`);
console.log(`Wrote ${results.length} Wild Rose recipe imports to ${outputPath}`);
