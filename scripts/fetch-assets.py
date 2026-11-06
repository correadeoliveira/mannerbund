"""Download the prototype's public illustrative photographs; no accounts or credentials."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import Request, urlopen

photos = {
    "running": "photo-1552674605-db6ffd4facb5",
    "pottery": "photo-1609881582722-4a8ab7cd54d8",
    "trail": "photo-1551632811-561732d1e306",
    "table": "photo-1511795409834-ef04bbd61622",
    "yoga": "photo-1506126613408-eca07ce68773",
    "city": "photo-1486406146926-c627a92ad1ab",
    "rafael": "photo-1500648767791-00dcc994a43e",
    "marina": "photo-1494790108377-be9c29b29330",
    "pedro": "photo-1506794778202-cad84cf45f1d",
}
root = Path(__file__).resolve().parents[1] / "public" / "images"
root.mkdir(parents=True, exist_ok=True)

def download(item):
    name, photo = item
    if (root / f"{name}.jpg").exists():
        return
    size = 160 if name in ("rafael", "marina", "pedro") else 1000
    url = f"https://images.unsplash.com/{photo}?auto=format&fit=crop&w={size}&q=85"
    request = Request(url, headers={"User-Agent": "Mannerbund-local-prototype/0.1"})
    with urlopen(request, timeout=30) as response:
        data = response.read()
        if not response.headers.get("Content-Type", "").startswith("image/"):
            raise ValueError(f"Not an image: {name}")
    (root / f"{name}.jpg").write_bytes(data)
    print(f"Saved {name}.jpg ({len(data)} bytes)")

with ThreadPoolExecutor(max_workers=4) as executor:
    list(executor.map(download, photos.items()))
