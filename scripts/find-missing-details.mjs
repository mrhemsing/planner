import fs from "node:fs";
import path from "node:path";

const filePath = path.join(process.cwd(), "src", "data", "recipes.ts");
const text = fs.readFileSync(filePath, "utf8");
const detailsBlock = text.split("const recipeDetailsMap: Record<string, RecipeDetailsEntry> = {")[1].split("};\n\nexport const recipeLibrary")[0];
const recipeIds = [...text.matchAll(/id: "([^"]+)"/g)].map((m) => m[1]).filter((id) => !id.startsWith("today-") && !id.startsWith("tomorrow-") && !id.startsWith("day-"));
const detailIds = [...detailsBlock.matchAll(/\n\s*"([^"]+)": \{/g)].map((m) => m[1]);
const missing = recipeIds.filter((id) => !detailIds.includes(id));
console.log(JSON.stringify({ recipeCount: recipeIds.length, detailCount: detailIds.length, missing }, null, 2));
