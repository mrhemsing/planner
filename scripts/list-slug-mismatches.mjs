import fs from 'node:fs';

const text = fs.readFileSync(new URL('../src/data/recipes.ts', import.meta.url), 'utf8');
const blocks = text.split(/\n\s*\},\n\s*\{/);
const items = [];

for (const block of blocks) {
  const id = (block.match(/id: "([^"]+)"/) || [])[1];
  const title = (block.match(/title: "([^"]+)"/) || [])[1];
  const url = (block.match(/sourceUrl: "([^"]+)"/) || [])[1];
  if (!id || !title || !url.includes('cooking.nytimes.com/recipes/')) continue;
  const slug = url.split('/recipes/')[1] || '';
  const core = slug.replace(/^\d+-/, '');
  if (core && core !== id) items.push({ id, title, slug });
}

console.log(JSON.stringify(items, null, 2));
