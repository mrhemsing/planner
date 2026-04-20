import fs from "node:fs";
import path from "node:path";

const text = fs.readFileSync(path.join(process.cwd(), "src", "data", "recipes.ts"), "utf8");
const ids = [...text.matchAll(/id: "([^"]+)"/g)].map((m) => m[1]);
const entryIds = [...text.matchAll(/\{\s*id: "([^"]+)",([\s\S]*?)\n  \},/g)].map((m) => m[1]);
const missing = ids.filter((id) => !entryIds.includes(id));
console.log(JSON.stringify({ idCount: ids.length, entryCount: entryIds.length, missing }, null, 2));
