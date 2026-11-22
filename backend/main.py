from pathlib import Path
from typing import Optional

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

BASE_DIR = Path(__file__).resolve().parent
CSV_PATH = BASE_DIR / "data" / "force_labour_monthly.csv"

app = FastAPI(
    title="Malaysia Labour Force API",
    description="API for the monthly labour force dashboard.",
    version="1.0.0",
)

# Allows the local Vite development server to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

REQUIRED_COLUMNS = [
    "date", "lf", "lf_employed", "lf_unemployed", "lf_outside",
    "p_rate", "ep_ratio", "u_rate"
]


def load_data() -> pd.DataFrame:
    if not CSV_PATH.exists():
        raise HTTPException(status_code=500, detail="Dataset file was not found.")
    df = pd.read_csv(CSV_PATH)
    missing = [column for column in REQUIRED_COLUMNS if column not in df.columns]
    if missing:
        raise HTTPException(
            status_code=500,
            detail=f"Dataset is missing required columns: {', '.join(missing)}",
        )
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date"]).sort_values("date")
    for column in REQUIRED_COLUMNS[1:]:
        df[column] = pd.to_numeric(df[column], errors="coerce")
    df = df.dropna(subset=REQUIRED_COLUMNS[1:])
    return df


def filtered_data(start: Optional[str], end: Optional[str]) -> pd.DataFrame:
    df = load_data()
    if start:
        try:
            df = df[df["date"] >= pd.to_datetime(start)]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start date.")
    if end:
        try:
            df = df[df["date"] <= pd.to_datetime(end)]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end date.")
    return df


def records(df: pd.DataFrame):
    output = df.copy()
    output["date"] = output["date"].dt.strftime("%Y-%m-%d")
    return output.to_dict(orient="records")


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/summary")
def summary():
    df = load_data()
    if df.empty:
        raise HTTPException(status_code=404, detail="No data available.")
    latest = df.iloc[-1]
    previous = df.iloc[-2] if len(df) > 1 else None

    def change(column):
        if previous is None:
            return None
        return round(float(latest[column] - previous[column]), 2)

    return {
        "latest_date": latest["date"].strftime("%Y-%m-%d"),
        "first_date": df.iloc[0]["date"].strftime("%Y-%m-%d"),
        "total_months": int(len(df)),
        "latest": {
            "lf": round(float(latest["lf"]), 2),
            "lf_employed": round(float(latest["lf_employed"]), 2),
            "lf_unemployed": round(float(latest["lf_unemployed"]), 2),
            "lf_outside": round(float(latest["lf_outside"]), 2),
            "p_rate": round(float(latest["p_rate"]), 2),
            "ep_ratio": round(float(latest["ep_ratio"]), 2),
            "u_rate": round(float(latest["u_rate"]), 2),
        },
        "month_change": {
            "lf": change("lf"),
            "lf_employed": change("lf_employed"),
            "lf_unemployed": change("lf_unemployed"),
            "u_rate": change("u_rate"),
        },
    }


@app.get("/api/timeseries")
def timeseries(
    start: Optional[str] = Query(default=None, description="Start date YYYY-MM-DD"),
    end: Optional[str] = Query(default=None, description="End date YYYY-MM-DD"),
):
    df = filtered_data(start, end)
    return records(df)


@app.get("/api/records")
def get_records(
    start: Optional[str] = None,
    end: Optional[str] = None,
):
    df = filtered_data(start, end).sort_values("date", ascending=False)
    return records(df)
