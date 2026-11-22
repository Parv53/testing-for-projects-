# Malaysia Labour Force Dashboard

A simple full-stack dashboard built with **React + Vite** (frontend) and **Python FastAPI + pandas** (backend).

The dashboard reads the supplied monthly dataset and displays:
- Latest labour force, employed persons, unemployed persons and unemployment rate
- Monthly trends for labour force, employment and unemployment rate
- Participation rate and employment-to-population ratio
- A searchable monthly data table

## Dataset

The supplied CSV is stored at `backend/data/force_labour_monthly.csv`.

Columns used:
- `date`
- `lf` — labour force
- `lf_employed` — employed persons
- `lf_unemployed` — unemployed persons
- `lf_outside` — persons outside the labour force
- `p_rate` — participation rate
- `ep_ratio` — employment-to-population ratio
- `u_rate` — unemployment rate

The source file does not include a data dictionary or explicit units. The dashboard therefore labels the population counts as **dataset units** and rates as **percentages**. Confirm the count unit from the original data provider before publishing.

## Requirements

- Python 3.10+
- Node.js 18+

## 1. Start the backend

Open a terminal in the project folder:

```bash
cd backend
python -m venv .venv
```

Activate the environment:

**Windows PowerShell**
```powershell
.venv\Scripts\Activate.ps1
```

**Windows Command Prompt**
```cmd
.venv\Scripts\activate
```

**macOS / Linux**
```bash
source .venv/bin/activate
```

Install packages and run the API:

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend API: http://127.0.0.1:8000  
Interactive API documentation: http://127.0.0.1:8000/docs

## 2. Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite (normally http://localhost:5173).

Keep both terminals running while using the dashboard.

## API endpoints

- `GET /api/summary` — latest values and overall date range
- `GET /api/timeseries` — monthly observations for charts
- `GET /api/records` — all rows, newest first
- `GET /api/health` — basic API health check

Optional date filtering is supported by `start` and `end` query parameters, e.g.
`/api/timeseries?start=2020-01-01&end=2024-12-01`.

## GitHub

Create a GitHub repository, then place the contents of this folder in it. Do not upload your local `.venv` or `node_modules` folders; they are excluded by `.gitignore`.

For a deployed version, host the FastAPI backend and React frontend separately, then set `VITE_API_URL` to the deployed backend URL before building the frontend.
