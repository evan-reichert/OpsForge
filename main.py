# Import dependencies
import io
import os
import re
from datetime import datetime

from dotenv import load_dotenv
load_dotenv()

import pandas as pd
from fastapi import Depends, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from database import ReportRecord, create_tables, get_db
from model import interpret_csv

# Abuse-prevention constants (override via environment variables)
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", 10 * 1024 * 1024))   # 10 MB
MAX_CSV_ROWS     = int(os.getenv("MAX_CSV_ROWS", 5_000))                   # 5 000 rows
RATE_LIMIT       = os.getenv("UPLOAD_RATE_LIMIT", "10/minute")             # per IP
ACCESS_TOKEN     = os.getenv("ACCESS_TOKEN", "").strip()
REQUIRE_AUTH     = os.getenv("REQUIRE_AUTH", "false").strip().lower() == "true"

# Rate-limiter (keyed by client IP)
limiter = Limiter(key_func=get_remote_address)

# FastAPI app initialization
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.on_event("startup")
def on_startup() -> None:
    create_tables()

# CORS configuration
cors_origins_env = os.getenv("CORS_ALLOW_ORIGINS", "")
cors_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

# Local dev fallback origins (used when CORS_ALLOW_ORIGINS is not set)
if not cors_origins:
    cors_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

# Add CORS middleware to the FastAPI app
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def require_access_token(request: Request, call_next):
    # Never block browser preflight; CORS middleware must be allowed to answer OPTIONS.
    if request.method.upper() == "OPTIONS":
        return await call_next(request)

    protected = request.url.path.startswith("/upload") or request.url.path.startswith("/reports")
    if protected and REQUIRE_AUTH:
        # Never allow protected routes to run without a configured token.
        if not ACCESS_TOKEN:
            return JSONResponse(
                status_code=503,
                content={"detail": "Server auth is not configured. Set ACCESS_TOKEN."},
            )

        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return JSONResponse(status_code=401, content={"detail": "Unauthorized."})
        submitted = auth_header[len("Bearer "):].strip()
        if submitted != ACCESS_TOKEN:
            return JSONResponse(status_code=401, content={"detail": "Unauthorized."})
    return await call_next(request)

# GET Endpoint for root path
@app.get("/")
def root():
    return {"message": "OpsForge backend is running"}


@app.get("/reports")
def list_reports(db: Session = Depends(get_db)):
    reports = db.query(ReportRecord).order_by(ReportRecord.created_at.desc()).all()
    return [
        {
            "id": report.id,
            "title": report.report_title,
            "filename": report.filename,
            "created_at": report.created_at.isoformat() if report.created_at else None,
            "rows_processed": report.rows_processed,
            "column_count": report.column_count,
            "issue_total": report.issue_total,
            "health_score": report.health_score,
            "health_label": report.health_label,
        }
        for report in reports
    ]


@app.get("/reports/{report_id}")
def get_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(ReportRecord).filter(ReportRecord.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    return {
        "id": report.id,
        "title": report.report_title,
        "filename": report.filename,
        "created_at": report.created_at.isoformat() if report.created_at else None,
        **report.payload,
    }

# POST Endpoint for CSV file upload and analysis
@app.post("/upload")
@limiter.limit(RATE_LIMIT)
async def upload_csv(request: Request, file: UploadFile = File(...), db: Session = Depends(get_db)):
    allowed_types = {"text/csv", "application/csv", "application/vnd.ms-excel", "text/plain"}
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a valid CSV file.")
    if file.content_type and file.content_type.lower() not in allowed_types:
        raise HTTPException(status_code=400, detail="Only CSV file uploads are allowed.")

    # --- File-size guard (read into memory once, check before parsing) ---
    raw_bytes = await file.read()
    if len(raw_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum allowed size is {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.",
        )

    # Error handling for CSV parsing
    try:
        raw_df = pd.read_csv(io.BytesIO(raw_bytes))
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Unable to parse CSV file.") from exc

    if raw_df.empty:
        raise HTTPException(status_code=400, detail="CSV file has no rows.")

    # --- Filename sanitization (prevent path-traversal sequences being stored in the DB) ---
    safe_filename = re.sub(r'[\x00-\x1f\/\\:*?"<>|]', '_', file.filename or 'upload.csv')
    safe_filename = safe_filename.lstrip('. ')  # strip leading dots/spaces
    safe_filename = safe_filename[:255] or 'upload.csv'

    # --- Row-count guard (prevents huge AI token bills) ---
    if len(raw_df) > MAX_CSV_ROWS:
        raise HTTPException(
            status_code=422,
            detail=f"CSV exceeds the {MAX_CSV_ROWS:,}-row limit ({len(raw_df):,} rows found). "
                   "Please trim your dataset and re-upload.",
        )

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

    response_payload = {
        "filename": safe_filename,
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

    try:
        total_issues = sum(int(item.get("count", 0)) for item in issue_counts)
        created_on = datetime.utcnow().strftime("%Y-%m-%d")
        report_title = f"{safe_filename} — {created_on}"

        report_record = ReportRecord(
            filename=safe_filename,
            report_title=report_title,
            rows_processed=int(metrics.get("rows", 0) or 0),
            column_count=len(metrics.get("columns", [])),
            issue_total=total_issues,
            health_score=int(health_score or 0),
            health_label=str(health_label or "Unknown"),
            payload=response_payload,
        )
        db.add(report_record)
        db.commit()
        db.refresh(report_record)
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Unable to save report to database.") from exc

    return {
        **response_payload,
        "report_id": report_record.id,
        "created_at": report_record.created_at.isoformat() if report_record.created_at else None,
    }



