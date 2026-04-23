const fs = require('fs');
const path = require('path');
const { recipeLibrary } = require('../src/data/recipes.ts');

const missing = recipeLibrary
  .filter((recipe) => !(recipe.instructions && recipe.instructions.length) || !(recipe.ingredients && recipe.ingredients.length))
  .map((recipe) => ({
    id: recipe.id,
    title: recipe.title,
    category: recipe.category,
    sourceName: recipe.sourceName,
    sourceUrl: recipe.sourceUrl,
    hasIngredients: Boolean(recipe.ingredients && recipe.ingredients.length),
    hasInstructions: Boolean(recipe.instructions && recipe.instructions.length),
  }))
  .sort((a, b) => a.title.localeCompare(b.title));

const json = {
  totalRecipes: recipeLibrary.length,
  missingCount: missing.length,
  missing,
};

fs.writeFileSync(path.join(process.cwd(), 'reports', 'recipes-missing-full-details.json'), JSON.stringify(json, null, 2) + '\n');

const md = [
  '# Recipes missing full details',
  '',
  `- Total recipes: ${recipeLibrary.length}`,
  `- Missing ingredients or instructions: ${missing.length}`,
  '',
  '## Recipes',
  ...missing.map(
    (recipe) =>
      `- [ ] ${recipe.title} (${recipe.category}) — ingredients: ${recipe.hasIngredients ? 'yes' : 'no'}, instructions: ${recipe.hasInstructions ? 'yes' : 'no'} — ${recipe.id}`,
  ),
].join('\n');

fs.writeFileSync(path.join(process.cwd(), 'reports', 'recipes-missing-full-details.md'), md + '\n');
console.log(JSON.stringify({ missingCount: missing.length, first: missing.slice(0, 10) }, null, 2));
