
# Wind Forecast Intelligence

A data analytics dashboard comparing Great Britain's national wind power forecasts with actual wind generation for January 2026, using the Elexon BMRS API.

## Live Application

- **Frontend dashboard:** https://wind.dewapratama.com
- **Backend API:** https://wind-forecast-intelligence-mu.vercel.app
- **Backend health check:** https://wind-forecast-intelligence-mu.vercel.app/health
- **API documentation:** https://wind-forecast-intelligence-mu.vercel.app/docs

## Overview

The application helps electricity procurement teams inspect forecast accuracy, identify forecast errors, and understand the difference between predicted and actual wind generation.

### Key Features

- Actual wind generation and forecast data retrieved from the Elexon API.
- Forecast-versus-actual visualisation.
- Forecast error analysis over time.
- Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), and forecast bias.
- Forecast publication-time filtering to reduce look-ahead bias.
- React and TypeScript frontend with a Python FastAPI backend.
- Docker Compose setup for local deployment.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Recharts
- **Backend:** Python, FastAPI, Uvicorn
- **Data source:** Elexon BMRS API
- **Testing:** pytest
- **Containerisation:** Docker and Docker Compose


## Project Structure

```text
wind-forecast-analytics/
|-- backend/
|   |-- main.py
|   |-- requirements.txt
|   |-- Dockerfile
|   |-- test_main.py
|   |-- test_elexon.py
|   `-- check_intervals.py
|-- frontend/
|   |-- src/
|   |-- public/
|   |-- package.json
|   |-- package-lock.json
|   |-- vite.config.ts
|   `-- Dockerfile
|-- docs/
|-- docker-compose.yml
|-- .gitignore
`-- README.md
```

## Data Source


## Data Source

The application uses the Elexon BMRS API:

- API base URL: https://data.elexon.co.uk/bmrs/api/v1
- Actual wind generation: FUELHH dataset
- Wind generation forecasts: WINDFOR dataset

The analysis covers January 1–31, 2026.

## Forecast Evaluation Methodology

Forecasts are filtered using a day-ahead availability assumption: the latest forecast publication available by **12:00 UTC on the preceding day** is selected for each target timestamp.

Forecast values are matched to actual generation using their target timestamps. Evaluation metrics are calculated only for matched timestamps.

The current dataset contains hourly matched forecast timestamps, while actual generation data is available at half-hourly resolution. Therefore, the metrics represent the matched hourly sample, not all half-hourly actual intervals.

The 12:00 UTC cutoff is an explicit modelling assumption for this analysis and should not be interpreted as a verified procurement rule.

### Metrics

- **MAE:** Average absolute difference between forecast and actual generation.
- **RMSE:** Square root of the average squared forecast error, giving larger errors greater weight.
- **Bias:** Mean signed forecast error, calculated as forecast minus actual. A positive bias indicates overforecasting.

Metrics depend on the selected publication cutoff, timestamp matching, and available API data.

## Run Locally with Docker

### Requirements

- Docker Desktop
- Docker Compose

### Start the Application

Clone the repository and navigate to its root directory:

```bash
git clone https://github.com/dewaa-dev/wind-forecast-intelligence.git
cd wind-forecast-intelligence
docker compose up --build -d
```

Open the following URLs:

- Frontend: http://localhost:5173
- Backend health check: http://localhost:8000/health
- Interactive API documentation: http://localhost:8000/docs

### Stop the Application

```bash
docker compose down
```

## Tests

Run the backend tests inside the Docker container:

```bash
docker compose exec backend python -m pytest -v
```

Run this command after starting the application with Docker Compose. The test service and command must match the actual Docker configuration.

## Limitations

- The analysis covers January 2026 only.
- Metrics use matched hourly forecast timestamps rather than every half-hourly actual interval.
- Forecast availability is determined using the stated 12:00 UTC cutoff assumption.
- Results depend on the records returned by the Elexon API.
- Forecast accuracy metrics alone do not establish the financial impact of procurement decisions.

## AI Usage Disclosure

AI assistance was used during development for coding guidance, troubleshooting, and documentation drafting. The implementation, test results, data-handling assumptions, and final submission should be reviewed by the author before use.

## License

No license has been specified. All rights are reserved by default unless a license is added to the repository.
