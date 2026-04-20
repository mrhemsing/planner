import fs from 'node:fs';

const text = fs.readFileSync('src/data/recipes.ts', 'utf8');
const lines = text.split(/\r?\n/);
const items = [];

for (let i = 0; i < lines.length; i += 1) {
  const idMatch = lines[i].match(/id: "([^"]+)"/);
  if (!idMatch) continue;

  let title = '';
  let url = '';
  let image = '';

  for (let j = i + 1; j < Math.min(i + 14, lines.length); j += 1) {
    if (!title) {
      const match = lines[j].match(/title: "([^"]+)"/);
      if (match) title = match[1];
    }
    if (!url) {
      const match = lines[j].match(/sourceUrl: "([^"]+)"/);
      if (match) url = match[1];
    }
    if (!image) {
      const match = lines[j].match(/imageUrl: (.+),/);
      if (match) image = match[1].trim();
    }
  }

  if (image === 'placeholderImage') {
    items.push({ title, url });
  }
}

console.log(JSON.stringify({ count: items.length, items }, null, 2));
