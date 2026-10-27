# Wind Forecast Intelligence

A data analytics dashboard comparing Great Britain's national wind power forecasts with actual wind generation for January 2026, using the Elexon BMRS API.

## Live Application

- **Frontend Dashboard:** https://wind.dewapratama.com
- **Backend API:** https://wind-forecast-intelligence-mu.vercel.app
- **Backend Health Check:** https://wind-forecast-intelligence-mu.vercel.app/health
- **API Documentation:** https://wind-forecast-intelligence-mu.vercel.app/docs

## Overview

Wind Forecast Intelligence helps electricity procurement teams inspect forecast accuracy, identify forecast errors, and understand differences between predicted and actual wind generation.

The application provides a dashboard for analysing Great Britain's national wind generation data and evaluating forecast performance over January 2026.

### Key Features

- Actual wind generation and forecast data retrieved from the Elexon BMRS API.
- Forecast-versus-actual visualisation.
- Forecast error analysis over time.
- Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), and forecast bias.
- Forecast publication-time filtering to reduce look-ahead bias.
- React and TypeScript frontend with a Python FastAPI backend.
- Docker Compose setup for local development and testing.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Recharts
- **Backend:** Python, FastAPI, Uvicorn
- **Data Source:** Elexon BMRS API
- **Testing:** pytest
- **Containerisation:** Docker and Docker Compose
- **Deployment:** Cloudflare Pages (frontend) and Vercel (backend)

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

The application uses the Elexon BMRS API.

- **API Base URL:** https://data.elexon.co.uk/bmrs/api/v1
- **Actual Wind Generation:** FUELHH dataset
- **Wind Generation Forecasts:** WINDFOR dataset

The analysis covers January 1–31, 2026.

## Forecast Evaluation Methodology

Forecasts are filtered using a day-ahead availability assumption: the latest forecast publication available by **12:00 UTC on the preceding day** is selected for each target timestamp.

Forecast values are matched to actual generation using their target timestamps. Evaluation metrics are calculated only for matched timestamps.

The current dataset contains hourly matched forecast timestamps, while actual generation data is available at half-hourly resolution. Therefore, the metrics represent the matched hourly sample, not all half-hourly actual intervals.

The 12:00 UTC cutoff is an explicit modelling assumption for this analysis and should not be interpreted as a verified official procurement rule.

### Evaluation Metrics

- **Mean Absolute Error (MAE):** The average absolute difference between forecast and actual generation.
- **Root Mean Squared Error (RMSE):** The square root of the average squared forecast error, giving larger errors greater weight.
- **Forecast Bias:** The mean signed forecast error, calculated as forecast minus actual. A positive bias indicates overforecasting.

Metrics depend on the selected publication cutoff, timestamp matching, and available API data.

## Run Locally with Docker

### Requirements

- Docker Desktop
- Docker Compose
- Git

### Start the Application

Clone the repository and navigate to its root directory:

```bash
git clone https://github.com/dewaa-dev/wind-forecast-intelligence.git
cd wind-forecast-intelligence
docker compose up --build -d
```

Once the containers are running, open the following URLs:

- **Frontend Dashboard:** http://localhost:5173
- **Backend Health Check:** http://localhost:8000/health
- **Interactive API Documentation:** http://localhost:8000/docs

### Check Container Status

```bash
docker compose ps
```

### Stop the Application

```bash
docker compose down
```

## Tests

Run the backend tests inside the Docker container after starting the application:

```bash
docker compose exec backend python -m pytest -v
```

The current basic backend test suite includes checks for the root and health endpoints.

## Limitations

- The analysis covers January 2026 only.
- Metrics use matched hourly forecast timestamps rather than every half-hourly actual interval.
- Forecast availability is determined using the stated 12:00 UTC cutoff assumption.
- Results depend on the records returned by the Elexon BMRS API.
- Forecast accuracy metrics alone do not establish the financial impact of procurement decisions.
- The cutoff assumption should be validated against the intended operational decision time before using the analysis for real procurement decisions.

## AI Usage Disclosure

AI assistance was used during development for coding guidance, troubleshooting, and documentation drafting. The author is responsible for reviewing the implementation, test results, data-handling assumptions, and final submission.

## License

No license has been specified for this repository. Unless a license is added, the project remains subject to applicable copyright law and no additional permissions are granted by the author.
