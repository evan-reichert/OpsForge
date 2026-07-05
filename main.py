# Import dependencies
import os

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from model import interpret_csv

# FastAPI app initialization
app = FastAPI()

# CORS configuration
cors_origins_env = os.getenv("CORS_ALLOW_ORIGINS", "")
cors_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

# Add CORS middleware to the FastAPI app
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_methods=["*"],
    allow_headers=["*"],
)

# GET Endpoint for root path
@app.get("/")
def root():
    return {"message": "OpsForge backend is running"}

# POST Endpoint for CSV file upload and analysis
@app.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a valid CSV file.")
    # Error handling for CSV parsing
    try:
        raw_df = pd.read_csv(file.file)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Unable to parse CSV file.") from exc

    if raw_df.empty:
        raise HTTPException(status_code=400, detail="CSV file has no rows.")

    # Data Cleaning and Metrics Calculation
    duplicate_rows = int(raw_df.duplicated().sum())
    missing_values = int(raw_df.isnull().sum().sum())

    df = raw_df.drop_duplicates().dropna(how="all")

    numeric_columns = df.select_dtypes(include="number").columns
    df[numeric_columns] = df[numeric_columns].fillna(0)

    text_columns = df.select_dtypes(include="object").columns
    df[text_columns] = df[text_columns].fillna("Unknown")

    numeric_columns = df.select_dtypes(include="number").columns

    metrics = {
        "rows": len(df),
        "columns": list(df.columns),
        "numeric_columns": list(numeric_columns),
        "missing_values": missing_values,
        "duplicate_rows": duplicate_rows,
    }

    metrics["statistics"] = {}
    for column in numeric_columns:
        metrics["statistics"][column] = {
            "mean": round(float(df[column].mean()), 2),
            "median": round(float(df[column].median()), 2),
            "minimum": round(float(df[column].min()), 2),
            "maximum": round(float(df[column].max()), 2),
            "standard_deviation": round(float(df[column].std()), 2),
        }

    # Issue Detection
    issues = []

    if metrics["missing_values"] > 0:
        issues.append({
            "title": "Missing Data",
            "severity": "Medium",
            "description": f"{metrics['missing_values']} missing values were found.",
        })

    if metrics["duplicate_rows"] > 0:
        issues.append({
            "title": "Duplicate Records",
            "severity": "Medium",
            "description": f"{metrics['duplicate_rows']} duplicate rows were found.",
        })

    if len(metrics["numeric_columns"]) == 0:
        issues.append({
            "title": "No Numeric Data",
            "severity": "Low",
            "description": "The dataset contains no numerical columns to analyze.",
        })

    for column in metrics["numeric_columns"]:
        if df[column].nunique() == 1:
            issues.append({
                "title": "No Variation",
                "severity": "Low",
                "description": f"Column '{column}' contains the same value in every row.",
            })

    for column in metrics["numeric_columns"]:
        std = df[column].std()
        if std == 0:
            continue
        mean = df[column].mean()
        outliers = df[(df[column] > mean + (3 * std)) | (df[column] < mean - (3 * std))]
        if len(outliers) > 0:
            issues.append({
                "title": "Potential Outliers",
                "severity": "Medium",
                "description": f"{len(outliers)} unusual values detected in '{column}'.",
            })

    # Results call the interpret_csv function to generate report and advice
    result = interpret_csv(df, metrics)
    issue_counts = result["issue_counts"]
    report_text = result["report_text"]
    advice_text = result["advice"]
    health_score = result["health_score"]
    health_label = result["health_label"]
    model_used = result["model_used"]

    return {
        "filename": file.filename,
        "metrics": metrics,
        "issues": issues,
        "issue_counts": issue_counts,
        "report_text": report_text,
        "advice": advice_text,
        "health_score": health_score,
        "health_label": health_label,
        "preview": df.head().to_dict(orient="records"),
        "model_used": model_used,
    }



