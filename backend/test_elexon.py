
import httpx

BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"

queries = [
    (
        "Actual generation - January 2026",
        f"{BASE_URL}/datasets/FUELHH/stream",
        {
            "settlementDateFrom": "2026-01-01",
            "settlementDateTo": "2026-01-31",
            "fuelType": "WIND",
        },
    ),
    (
        "Wind forecast publications - January 2026",
        f"{BASE_URL}/datasets/WINDFOR/stream",
        {
            "publishDateTimeFrom": "2026-01-01T00:00:00Z",
            "publishDateTimeTo": "2026-02-01T00:00:00Z",
        },
    ),
]

with httpx.Client(timeout=120) as client:
    for name, url, params in queries:
        print(f"\n--- {name} ---")
        response = client.get(url, params=params)
        print("HTTP status:", response.status_code)
        response.raise_for_status()
        rows = response.json()

        if isinstance(rows, dict):
            rows = rows.get("data", [])

        print("Total rows:", len(rows))

        if rows:
            starts = sorted(
                r["startTime"] for r in rows if r.get("startTime")
            )
            publications = sorted(
                r["publishTime"] for r in rows if r.get("publishTime")
            )

            january_targets = [
                r for r in rows
                if r.get("startTime", "").startswith("2026-01-")
            ]

            print("Unique target intervals:", len(set(starts)))
            print("Rows targeting January:", len(january_targets))
            print("Earliest startTime:", starts[0])
            print("Latest startTime:", starts[-1])
            print("Earliest publishTime:", publications[0])
            print("Latest publishTime:", publications[-1])
            print("Sample row:", rows[0])
