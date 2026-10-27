# Wind Forecast Intelligence

A data analytics dashboard comparing Great Britain’s national wind power forecasts with actual wind generation for January 2026, using the Elexon BMRS API.

## Overview

The application helps electricity procurement teams inspect forecast accuracy, identify forecast errors, and understand the difference between predicted and actual wind generation.

### Key features

- Actual wind generation and forecast data retrieved from the Elexon API.
- Forecast-versus-actual visualisation.
- Forecast error analysis over time.
- Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), and forecast bias.
- Forecast publication-time filtering to reduce look-ahead bias.
- React and TypeScript frontend with a Python FastAPI backend.
- Docker Compose setup for local deployment.

## Tech stack

- **Frontend:** React, TypeScript, Vite, Recharts
- **Backend:** Python, FastAPI, Uvicorn
- **Data source:** Elexon BMRS API
- **Testing:** pytest
- **Containerisation:** Docker and Docker Compose

## Data source

The application uses the Elexon BMRS API:

`https://data.elexon.co.uk/bmrs/api/v1`

The analysis retrieves actual wind generation and wind forecast publication data for January 1–31, 2026.

## Forecast evaluation methodology

Forecasts are filtered using a day-ahead availability assumption: the latest forecast publication available by **12:00 UTC on the preceding day** is selected for each target timestamp.

Forecast values are matched to actual generation using their target timestamps. Evaluation metrics are calculated only for matched timestamps.

The current dataset contains hourly matched forecast timestamps, while actual generation data is available at half-hourly resolution. Therefore, the metrics represent the matched hourly sample, not all half-hourly actual intervals.

The 12:00 UTC cutoff is an explicit modelling assumption for this analysis and should not be interpreted as a verified procurement rule.

### Metrics

- **MAE:** Average absolute difference between forecast and actual generation.
- **RMSE:** Square root of the average squared forecast error, giving larger errors greater weight.
- **Bias:** Mean signed forecast error, calculated as forecast minus actual. A positive bias indicates overforecasting.

Metrics depend on the selected publication cutoff, timestamp matching, and available API data.

## Run locally with Docker

### Requirements

- Docker Desktop
- Docker Compose

### Start the application

Clone the repository, navigate to its root directory, and run:

```bash
docker compose up --build -d
```

Open the following URLs:

- Frontend: http://localhost:5173
- Backend health check: http://localhost:8000/health
- Interactive API documentation: http://localhost:8000/docs

### Stop the application

```bash
docker compose down
```

## Tests

Run the backend tests inside the Docker container:

```bash
docker compose exec backend python -m pytest -v
```

## Limitations

- The analysis covers January 2026 only.
- Metrics use matched hourly forecast timestamps rather than every half-hourly actual interval.
- Forecast availability is determined using the stated 12:00 UTC cutoff assumption.
- Results depend on the records returned by the Elexon API.
- Forecast accuracy metrics alone do not establish the financial impact of procurement decisions.

## AI usage disclosure

AI assistance was used during development for coding guidance, troubleshooting, and documentation drafting. The implementation, test results, data-handling assumptions, and final submission should be reviewed by the author before use.

## License

Specify an appropriate license before redistributing or reusing this project.
