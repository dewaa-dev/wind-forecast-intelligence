import os
from datetime import datetime, timedelta, timezone
from math import sqrt
from statistics import mean

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Wind Forecast Analytics API",
    description="UK wind forecast and actual analysis for January 2026",
    version="0.2.0",
)

frontend_origin = os.getenv("FRONTEND_ORIGIN", "").rstrip("/")

allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

if frontend_origin:
    allowed_origins.append(frontend_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"
UTC = timezone.utc


def parse_time(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def get_rows(response: httpx.Response) -> list[dict]:
    response.raise_for_status()
    result = response.json()

    if isinstance(result, dict):
        return result.get("data", [])

    return result


@app.get("/")
def root():
    return {"message": "Wind Forecast Analytics API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/analysis")
def analysis():
    # Include late-December publications so January 1 forecasts
    # can be evaluated against the day-ahead decision cutoff.
    actual_params = {
        "settlementDateFrom": "2026-01-01",
        "settlementDateTo": "2026-01-31",
        "fuelType": "WIND",
    }

    forecast_params = {
        "publishDateTimeFrom": "2025-12-30T00:00:00Z",
        "publishDateTimeTo": "2026-02-01T00:00:00Z",
    }

    try:
        with httpx.Client(timeout=120) as client:
            actual_response = client.get(
                f"{BASE_URL}/datasets/FUELHH/stream",
                params=actual_params,
            )
            forecast_response = client.get(
                f"{BASE_URL}/datasets/WINDFOR/stream",
                params=forecast_params,
            )

        actual_rows = get_rows(actual_response)
        forecast_rows = get_rows(forecast_response)

    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Unable to retrieve Elexon data: {exc}",
        ) from exc

    # Keep only actual intervals inside January 2026.
    actual_by_time = {
        row["startTime"]: row
        for row in actual_rows
        if row.get("fuelType") == "WIND"
        and row.get("generation") is not None
        and row.get("startTime", "").startswith("2026-01-")
    }

    # For each target interval, select the latest forecast published
    # no later than 12:00 UTC on the previous calendar day.
    forecast_by_time = {}

    for row in forecast_rows:
        start = row.get("startTime")
        published = row.get("publishTime")
        generation = row.get("generation")

        if not start or not published or generation is None:
            continue

        if not start.startswith("2026-01-"):
            continue

        target_time = parse_time(start)
        publish_time = parse_time(published)

        cutoff = (
            target_time.replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            - timedelta(days=1)
            + timedelta(hours=12)
        )

        if publish_time > cutoff:
            continue

        existing = forecast_by_time.get(start)

        if existing is None or publish_time > existing["published"]:
            forecast_by_time[start] = {
                "generation": float(generation),
                "published": publish_time,
                "cutoff": cutoff,
            }

    matched = []

    for start, forecast in sorted(forecast_by_time.items()):
        actual = actual_by_time.get(start)

        if actual is None:
            continue

        actual_value = float(actual["generation"])
        forecast_value = forecast["generation"]
        error = forecast_value - actual_value

        matched.append({
            "startTime": start,
            "publishTime": forecast["published"].isoformat(),
            "decisionCutoff": forecast["cutoff"].isoformat(),
            "forecast": forecast_value,
            "actual": actual_value,
            "error": error,
            "absoluteError": abs(error),
        })

    if matched:
        errors = [row["error"] for row in matched]
        absolute_errors = [abs(value) for value in errors]

        metrics = {
            "mae": round(mean(absolute_errors), 2),
            "rmse": round(sqrt(mean(value ** 2 for value in errors)), 2),
            "bias": round(mean(errors), 2),
        }
    else:
        metrics = {"mae": None, "rmse": None, "bias": None}

    return {
        "source": "Elexon BMRS API",
        "period": "January 2026",
        "unit": "MW",
        "decisionRule": (
            "Latest forecast published by 12:00 UTC "
            "on the day before the target date"
        ),
        "actualIntervals": len(actual_by_time),
        "forecastIntervalsAfterCutoff": len(forecast_by_time),
        "matchedIntervals": len(matched),
        "metrics": metrics,
        "data": matched,
    }
