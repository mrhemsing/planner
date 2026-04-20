import re
import sys
import urllib.request

url = sys.argv[1]
html = urllib.request.urlopen(url, timeout=20).read().decode('utf-8', 'ignore')
patterns = [
    r'<meta property="og:image" content="([^"]+)"',
    r'"image":\s*\{\s*"url":\s*"([^"]+)"',
    r'"imageUrl":\s*"([^"]+)"',
]
for pattern in patterns:
    match = re.search(pattern, html)
    if match:
        print(match.group(1))
        break
else:
    print('NO_MATCH')
