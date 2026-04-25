import re
from pathlib import Path

text = Path("src/data/recipes.ts").read_text(encoding="utf-8")
entries = re.findall(r'\{\s*id: "([^"]+)",[\s\S]*?category: "([^"]+)"[\s\S]*?\n  \},', text)
ing = set(re.findall(r'"([^"]+)": \[', text.split('const recipeDetailsMap')[0]))
det = set(re.findall(r'"([^"]+)": \{', text.split('const recipeDetailsMap')[1]))
missing = [(recipe_id, category) for recipe_id, category in entries if recipe_id in ing and recipe_id not in det]
print(f"count {len(missing)}")
for recipe_id, category in missing:
    print(category, recipe_id)
