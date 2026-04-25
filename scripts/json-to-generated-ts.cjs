const fs = require('fs');
const path = require('path');
const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src', 'data', 'healthy-dinner-details.generated.json'), 'utf8'));
const content = `import type { RecipeDetailsEntry } from "./recipes";\n\nconst healthyDinnerGeneratedDetails: Record<string, RecipeDetailsEntry> = ${JSON.stringify(data, null, 2)};\n\nexport default healthyDinnerGeneratedDetails;\n`;
fs.writeFileSync(path.join(process.cwd(), 'src', 'data', 'healthy-dinner-details.generated.ts'), content, 'utf8');
console.log('ok');
