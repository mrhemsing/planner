import fs from "node:fs";
import path from "node:path";

const text = fs.readFileSync(path.join(process.cwd(), "src", "data", "recipes.ts"), "utf8");
const entries = [...text.matchAll(/\{\s*id: "([^"]+)",([\s\S]*?)\n  \},/g)].map((m) => ({ id: m[1], block: m[2] }));
const missing = entries.filter((e) => !/imageUrl:\s*/.test(e.block)).map((e) => e.id);
console.log(JSON.stringify({ count: missing.length, missing }, null, 2));
