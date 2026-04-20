import fs from "node:fs";
import path from "node:path";

const filePath = path.join(process.cwd(), "src", "data", "recipes.ts");
const text = fs.readFileSync(filePath, "utf8");
const limit = Number(process.argv[2] ?? 25);
const offset = Number(process.argv[3] ?? 0);
const concurrency = Number(process.argv[4] ?? 5);
const outputPathArg = process.argv[5];

const between = (startMarker, endMarker) => {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker);
  if (start === -1 || end === -1 || end <= start) return "";
  return text.slice(start, end);
};

const libraryText = [
  between("const dinnerRecipes: RecipeLibraryEntry[] = [", "const lunchRecipes: RecipeLibraryEntry[] = ["),
  between("const lunchRecipes: RecipeLibraryEntry[] = [", "const ingredientMap: Record<string, Ingredient[]> = {"),
].join("\n");

const entryPattern = /\{\s*id: "([^"]+)",([\s\S]*?)\n  \},/g;
const stringValue = (block, key) => {
  const match = block.match(new RegExp(`${key}:\\s*"([\\s\\S]*?)",`));
  return match ? match[1].replace(/\s*\n\s*/g, "") : null;
};

function normalizeSlug(value) {
  return value
    .toLowerCase()
    .replace(/^\d+-/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const recipeMatches = [...libraryText.matchAll(entryPattern)]
  .map((match) => {
    const [, id, block] = match;
    const title = stringValue(block, "title");
    const sourceUrl = stringValue(block, "sourceUrl");
    if (!title || !sourceUrl || !sourceUrl.startsWith("https://cooking.nytimes.com/recipes/")) return null;
    return { id, title, sourceUrl };
  })
  .filter(Boolean);

const candidates = recipeMatches.slice(offset, offset + limit);

const results = [];

async function auditRecipe(recipe) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(recipe.sourceUrl, {
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0" },
      signal: controller.signal,
    });

    const html = await response.text();
    clearTimeout(timeout);
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const finalUrl = response.url;
    const finalSlug = finalUrl.split("/").filter(Boolean).pop() ?? "";
    const normalizedFinalSlug = normalizeSlug(finalSlug);
    const normalizedId = normalizeSlug(recipe.id);
    const normalizedTitle = normalizeSlug(recipe.title);
    const finalTitle = titleMatch?.[1]?.replace(/\s+Recipe\s*$/i, "").trim() ?? "";
    const normalizedFinalTitle = normalizeSlug(finalTitle);

    return {
      ...recipe,
      status: response.status,
      finalUrl,
      finalTitle,
      redirected: finalUrl !== recipe.sourceUrl,
      slugMismatch: normalizedFinalSlug !== normalizedId,
      titleMismatch: Boolean(finalTitle) && normalizedFinalTitle !== normalizedTitle,
    };
  } catch (error) {
    return {
      ...recipe,
      status: "error",
      error: error instanceof Error ? error.message : String(error),
      finalUrl: "",
      finalTitle: "",
      redirected: false,
      slugMismatch: false,
      titleMismatch: false,
    };
  }
}

for (let index = 0; index < candidates.length; index += concurrency) {
  const batch = candidates.slice(index, index + concurrency);
  const batchResults = await Promise.all(batch.map(auditRecipe));
  results.push(...batchResults);
}

const redirected = results.filter((result) => result.redirected);
const slugMismatches = results.filter((result) => result.slugMismatch);
const titleMismatches = results.filter((result) => result.titleMismatch);
const errors = results.filter((result) => result.status === "error");

const summary = {
  checked: results.length,
  offset,
  limit,
  concurrency,
  redirected: redirected.length,
  slugMismatches: slugMismatches.length,
  titleMismatches: titleMismatches.length,
  errors: errors.length,
};

const lines = [JSON.stringify(summary, null, 2)];

if (redirected.length) {
  lines.push("", "Redirected URLs:");
  for (const result of redirected) {
    lines.push(`- ${result.id}: ${result.sourceUrl} -> ${result.finalUrl}`);
  }
}

if (slugMismatches.length) {
  lines.push("", "Slug mismatches:");
  for (const result of slugMismatches) {
    lines.push(`- ${result.id}: final slug ${result.finalUrl.split("/").filter(Boolean).pop()}`);
  }
}

if (titleMismatches.length) {
  lines.push("", "Title mismatches:");
  for (const result of titleMismatches) {
    lines.push(`- ${result.id}: local='${result.title}' live='${result.finalTitle}'`);
  }
}

if (errors.length) {
  lines.push("", "Errors:");
  for (const result of errors) {
    lines.push(`- ${result.id}: ${result.error}`);
  }
}

const output = `${lines.join("\n")}\n`;

if (outputPathArg) {
  const outputPath = path.isAbsolute(outputPathArg)
    ? outputPathArg
    : path.join(process.cwd(), outputPathArg);
  fs.writeFileSync(outputPath, output, "utf8");
}

process.stdout.write(output);
