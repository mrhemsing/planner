import re
import pathlib

text = pathlib.Path(r"C:\Users\Matt\.openclaw\workspace-sui\planner\src\data\recipes.ts").read_text(encoding="utf-8")
ids = re.findall(r'id: "([^"]+)"', text)
section = text.split('const recipeDetailsMap', 1)[1]
detail_ids = re.findall(r'^\s*"([^"]+)": \{', section, re.M)
missing = [recipe_id for recipe_id in ids if recipe_id not in set(detail_ids)]
print('\n'.join(missing))
