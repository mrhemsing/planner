import re
import socket
import sys
import time
import urllib.request
from pathlib import Path

REQUEST_TIMEOUT_SECONDS = 10
SLEEP_BETWEEN_REQUESTS_SECONDS = 0.05

file_path = Path('planner/src/data/recipes.ts')
text = file_path.read_text(encoding='utf-8')
limit = int(sys.argv[1]) if len(sys.argv) > 1 else 20
socket.setdefaulttimeout(REQUEST_TIMEOUT_SECONDS)

pattern = re.compile(
    r'(?P<prefix>id: "(?P<id>[^"]+)",(?:(?!id: ).)*?title: "(?P<title>[^"]+)",(?:(?!id: ).)*?sourceUrl: "(?P<url>https://cooking\.nytimes\.com/recipes/[^"]+)",\n\s*imageUrl: )placeholderImage(?P<suffix>,)',
    re.S,
)

image_patterns = [
    re.compile(r'<meta property="og:image" content="([^"]+)"'),
    re.compile(r'"image":\s*\{\s*"url":\s*"([^"]+)"'),
    re.compile(r'"imageUrl":\s*"([^"]+)"'),
]

title_pattern = re.compile(r'<title>([^<]+)</title>', re.I)


def normalize_slug(value: str) -> str:
    value = value.lower()
    value = re.sub(r'^\d+-', '', value)
    value = re.sub(r'[^a-z0-9]+', '-', value)
    return value.strip('-')


count = 0
attempted = 0
updated = []
skipped_redirects = []
request_failures = []

for match in list(pattern.finditer(text)):
    if attempted >= limit:
        break

    recipe_id = match.group('id')
    recipe_title = match.group('title')
    url = match.group('url')
    attempted += 1
    print(f'TRY {attempted}: {recipe_id}', flush=True)

    try:
        request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        response = urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS)
        final_url = response.geturl()
        html = response.read().decode('utf-8', 'ignore')
    except Exception as exc:
        request_failures.append((recipe_id, url, str(exc)))
        print(f'FAIL {recipe_id}: {exc}', flush=True)
        continue

    final_slug = final_url.rstrip('/').split('/')[-1]
    normalized_id = normalize_slug(recipe_id)
    normalized_title = normalize_slug(recipe_title)
    normalized_final_slug = normalize_slug(final_slug)

    title_match = title_pattern.search(html)
    live_title = ""
    normalized_live_title = ""
    if title_match:
        live_title = re.sub(r'\s+Recipe\s*$', '', title_match.group(1)).strip()
        normalized_live_title = normalize_slug(live_title)

    if final_url != url and normalized_final_slug != normalized_id:
        skipped_redirects.append((recipe_id, url, final_url, live_title))
        continue

    if normalized_live_title and normalized_live_title != normalized_title:
        skipped_redirects.append((recipe_id, url, final_url, live_title))
        continue

    image_url = None
    for image_pattern in image_patterns:
        image_match = image_pattern.search(html)
        if image_match:
            image_url = image_match.group(1)
            break

    if not image_url or not image_url.startswith('https://'):
        continue

    old = f'{match.group("prefix")}placeholderImage{match.group("suffix")}'
    new = f'{match.group("prefix")}"{image_url}"{match.group("suffix")}'
    text = text.replace(old, new, 1)
    count += 1
    updated.append((recipe_id, image_url, final_url))
    print(f'UPDATED {recipe_id}', flush=True)
    time.sleep(SLEEP_BETWEEN_REQUESTS_SECONDS)

file_path.write_text(text, encoding='utf-8')
print(f'SUMMARY attempted={attempted} updated={count} failures={len(request_failures)} skipped={len(skipped_redirects)}')
for recipe_id, image_url, final_url in updated:
    print(f'{recipe_id} -> {image_url} ({final_url})')

if request_failures:
    print(f'FAILURES {len(request_failures)} request errors')
    for recipe_id, source_url, error_text in request_failures:
        print(f'{recipe_id} -> {source_url} | error: {error_text}')

if skipped_redirects:
    print(f'SKIPPED {len(skipped_redirects)} redirected-or-mismatched pages')
    for recipe_id, source_url, final_url, live_title in skipped_redirects:
        suffix = f' | live title: {live_title}' if live_title else ''
        print(f'{recipe_id} -> {source_url} -> {final_url}{suffix}')
