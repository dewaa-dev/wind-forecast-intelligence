
import httpx
from collections import Counter

url = "https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream"
params = {
    "publishDateTimeFrom": "2025-12-30T00:00:00Z",
    "publishDateTimeTo": "2026-02-01T00:00:00Z",
}

response = httpx.get(url, params=params, timeout=120)
response.raise_for_status()
rows = response.json()

if isinstance(rows, dict):
    rows = rows.get("data", [])

january = [
    row for row in rows
    if row.get("startTime", "").startswith("2026-01-")
    and row.get("startTime")
]

timestamps = sorted({row["startTime"] for row in january})

print("Forecast rows targeting January:", len(january))
print("Unique target timestamps:", len(timestamps))
print("\nFirst 15 timestamps:")
for timestamp in timestamps[:15]:
    print(timestamp)

print("\nTime-of-day distribution:")
print(Counter(timestamp[11:16] for timestamp in timestamps))
