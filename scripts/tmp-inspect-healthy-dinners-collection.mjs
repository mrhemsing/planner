const url = "https://cooking.nytimes.com/68861692-nyt-cooking/2110373-healthy-weeknight-dinners";
const html = await fetch(url).then((r) => r.text());
const scriptMatch = html.match(/<script type="application\/ld\+json"[^>]*>(\{[\s\S]*?\})<\/script>/);
if (!scriptMatch) throw new Error("No JSON-LD found");
const data = JSON.parse(scriptMatch[1]);
const items = Array.isArray(data.itemListElement) ? data.itemListElement : [];
console.log(JSON.stringify(items.slice(0, 5), null, 2));
