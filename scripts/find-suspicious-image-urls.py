from pathlib import Path
import re

text = Path(r"C:\Users\Matt\.openclaw\workspace-sui\planner\src\data\recipes.ts").read_text(encoding="utf-8")
entry_re = re.compile(r'id: "([^"]+)",[\s\S]*?imageUrl: "([^"]+)"', re.M)
keywords = [
    "tart", "cookie", "cookies", "bars", "brownie", "cake", "pie", "smores", "smore",
    "ramen", "pork", "pecan", "dessert", "chocolate", "hazelnut", "hamburger", "beignet"
]
count = 0
for recipe_id, url in entry_re.findall(text):
    low = url.lower()
    hits = [keyword for keyword in keywords if keyword in low]
    if hits:
        count += 1
        print(f"{recipe_id} :: {', '.join(hits)} :: {url}")
print(f"COUNT {count}")
