# NYT slug mismatch review

Reviewed against current `src/data/recipes.ts` titles and `sourceUrl` slugs.

## Likely alternate-title or shortened-title matches

## Live-verified canonical NYT titles, still pending local rename-or-keep decision
- `roasted-gochujang-chicken` -> `1020829-sheet-pan-gochujang-chicken-and-roasted-vegetables`
  - Live title fetch: `Sheet-Pan Gochujang Chicken and Roasted Vegetables`
- `spinach-artichoke-pasta` -> `1020080-baked-spinach-artichoke-pasta`
  - Live title fetch: `Baked Spinach-Artichoke Pasta`
- `chicken-thighs-with-coconut-creamed-corn` -> `1021157-one-pan-chicken-thighs-with-coconut-creamed-corn`
  - Live title fetch: `One-Pan Chicken Thighs With Coconut Creamed Corn`
- `tomato-white-bean-soup-with-lots-of-garlic` -> `1020733-tomato-and-white-bean-soup-with-lots-of-garlic`
  - Live title fetch: `Tomato and White Bean Soup With Lots of Garlic`
- `cold-tofu-with-tomatoes-and-peaches` -> `1022319-cold-tofu-salad-with-tomatoes-and-peaches`
  - Live title fetch: `Cold Tofu Salad With Tomatoes and Peaches`
- `miso-salmon-with-greens-and-scallions` -> `1019857-maple-and-miso-sheet-pan-salmon-with-green-beans`
  - Live title fetch: `Maple and Miso Sheet-Pan Salmon With Green Beans`
- `tofu-and-herb-salad` -> `1020751-tofu-and-herb-salad-with-sesame`
  - Live title fetch: `Tofu and Herb Salad With Sesame`
- `tofu-with-coconut-sauce` -> `1020530-baked-tofu-with-peanut-sauce-and-coconut-lime-rice`
  - Live title fetch: `Baked Tofu With Peanut Sauce and Coconut-Lime Rice`
- `braised-chicken-with-tomatoes-and-olives` -> `1014718-braised-chicken-with-tomatoes-olives-and-capers`
  - Live title fetch: `Braised Chicken With Tomatoes, Olives and Capers`
- `white-bean-and-tuna-salad` -> `767637776-white-bean-tuna-and-kale-salad`
  - Live title fetch: `White Bean, Tuna and Kale Salad`
- `chickpea-tuna-salad` -> `12272-tuna-chickpeas-and-broccoli-salad`
  - Live title fetch: `Tuna, Chickpeas and Broccoli Salad`
- `saucy-skillet-mushroom-chicken` -> `1022068-skillet-chicken-with-mushrooms-and-caramelized-onions`
  - Live title fetch: `Skillet Chicken With Mushrooms and Caramelized Onions`

## Recommended next-action buckets

### Strong rename-or-prune candidates
- `tofu-with-coconut-sauce`
  - Canonical NYT title is materially different and adds `peanut sauce` plus `coconut-lime rice`
- `braised-chicken-with-tomatoes-and-olives`
  - Canonical NYT title explicitly includes `capers`
- `white-bean-and-tuna-salad`
  - Canonical NYT title explicitly includes `kale`
- `chickpea-tuna-salad`
  - Canonical NYT title explicitly includes `broccoli`
- `saucy-skillet-mushroom-chicken`
  - Canonical NYT title is substantially different in structure and ingredients emphasis
- `miso-salmon-with-greens-and-scallions`
  - Canonical NYT title explicitly includes `maple`, `sheet-pan`, and `green beans`

### Likely acceptable shorthand, if we deliberately want planner-friendly shorter names
- `roasted-gochujang-chicken`
- `spinach-artichoke-pasta`
- `chicken-thighs-with-coconut-creamed-corn`
- `tofu-and-herb-salad`
- `tomato-white-bean-soup-with-lots-of-garlic`
- `cold-tofu-with-tomatoes-and-peaches`

## Audit tooling note
- The duplicate mismatch rows that previously inflated the review list were removed by fixing the audit script to track recipe index directly instead of using `indexOf` on repeated URLs.

## Conclusion
- Current mismatch count is not evidence of broken links.
- The verified URL-format problem is currently clean.
- All 12 current mismatch entries now have live-verified canonical NYT titles.
- The current reported slug-core mismatch count is 12.
- Of those 12, 6 now look like strong rename-or-prune candidates, while 6 look like defensible shorthand if we intentionally keep planner-friendly naming.
