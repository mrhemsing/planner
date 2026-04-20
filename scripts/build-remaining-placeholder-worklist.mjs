import fs from 'node:fs';

const text = fs.readFileSync('src/data/recipes.ts', 'utf8');
const lines = text.split(/\r?\n/);
const items = [];

for (let i = 0; i < lines.length; i += 1) {
  const idMatch = lines[i].match(/id: "([^"]+)"/);
  if (!idMatch) continue;

  let title = '';
  let category = '';
  let image = '';

  for (let j = i + 1; j < Math.min(i + 14, lines.length); j += 1) {
    if (!title) {
      const match = lines[j].match(/title: "([^"]+)"/);
      if (match) title = match[1];
    }
    if (!category) {
      const match = lines[j].match(/category: "([^"]+)"/);
      if (match) category = match[1];
    }
    if (!image) {
      const match = lines[j].match(/imageUrl: (.+),/);
      if (match) image = match[1].trim();
    }
  }

  if (title && category && image === 'placeholderImage') {
    items.push({ id: idMatch[1], title, category });
  }
}

const byCategory = new Map();
for (const item of items) {
  if (!byCategory.has(item.category)) byCategory.set(item.category, []);
  byCategory.get(item.category).push(item);
}

const output = ['# Remaining placeholder-image recipes', '', `Total remaining: ${items.length}`];
for (const category of [...byCategory.keys()].sort()) {
  const categoryItems = byCategory.get(category);
  output.push('', `## ${category} (${categoryItems.length})`, '');
  for (const item of categoryItems) {
    output.push(`- ${item.id} | ${item.title}`);
  }
}

fs.writeFileSync('reports/remaining-placeholder-worklist.md', `${output.join('\n')}\n`);
console.log(JSON.stringify({
  total: items.length,
  byCategory: Object.fromEntries([...byCategory.entries()].map(([key, value]) => [key, value.length])),
}, null, 2));
