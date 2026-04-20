from pathlib import Path
import re

text = Path(r"C:\Users\Matt\.openclaw\workspace-sui\planner\src\data\recipes.ts").read_text(encoding="utf-8")
entry_re = re.compile(r'id: "([^"]+)",[\s\S]*?title: "([^"]+)",[\s\S]*?imageUrl: "([^"]+)"', re.M)
for recipe_id, title, url in entry_re.findall(text):
    if "nyt.com/images" in url:
        print(f"{recipe_id} | {title} | {url}")
