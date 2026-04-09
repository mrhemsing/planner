const urls = [
  "https://wildrose.ca/blogs/recipes",
  "https://wildrose.ca/blogs/recipes?page=2",
  "https://wildrose.ca/blogs/recipes?page=3",
  "https://wildrose.ca/blogs/recipes?view=all",
];

for (const url of urls) {
  const response = await fetch(url);
  const html = await response.text();
  const recipePaths = Array.from(
    new Set(
      Array.from(html.matchAll(/href="(\/blogs\/recipes\/[^"]+)"/g), (match) => match[1]),
    ),
  );

  console.log(
    JSON.stringify({
      url,
      status: response.status,
      count: recipePaths.length,
      sample: recipePaths.slice(0, 10),
    }),
  );
}
