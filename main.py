# Here is where we will create the backend
# FastAPI and Pandas will be utilized
from fastapi import FastAPI, UploadFile, File
import pandas as pd

app = FastAPI()

@app.get("/")
def root():
    return {"message": "OpsForge backend is running"}

# This is just a test API endpoint to ensure that the backend is working properly. We want to upload a CSV file. It will be removed in the future.
@app.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    df = pd.read_csv(file.file)

    # Remove duplicate rows
    df = df.drop_duplicates()

    # Remove completely empty rows
    df = df.dropna(how="all")

    # Fill missing numeric values with 0
    numeric_columns = df.select_dtypes(include="number").columns
    df[numeric_columns] = df[numeric_columns].fillna(0)

    # Fill missing text values with "Unknown"
    text_columns = df.select_dtypes(include="object").columns
    df[text_columns] = df[text_columns].fillna("Unknown")

    # Identify numeric columns
    numeric_columns = df.select_dtypes(include="number").columns

    # Create analytics dictionary
    metrics = {
        "rows": len(df),
        "columns": list(df.columns),
        "numeric_columns": list(numeric_columns),
        "missing_values": int(df.isnull().sum().sum()),
        "duplicate_rows": int(df.duplicated().sum())
    }

    # Statistical analysis for numeric columns
    metrics["statistics"] = {}

    for column in numeric_columns:
        metrics["statistics"][column] = {
            "mean": round(float(df[column].mean()), 2),
            "median": round(float(df[column].median()), 2),
            "minimum": round(float(df[column].min()), 2),
            "maximum": round(float(df[column].max()), 2),
            "standard_deviation": round(float(df[column].std()), 2)
        }
    
    # Detect issues
    issues = []

    # Missing values
    if metrics["missing_values"] > 0:
        issues.append({
            "title": "Missing Data",
            "severity": "Medium",
            "description": f"{metrics['missing_values']} missing values were found."
        })

    # Duplicate rows
    if metrics["duplicate_rows"] > 0:
        issues.append({
            "title": "Duplicate Records",
            "severity": "Medium",
            "description": f"{metrics['duplicate_rows']} duplicate rows were found."
        })

    # No numerical data
    if len(metrics["numeric_columns"]) == 0:
        issues.append({
            "title": "No Numeric Data",
            "severity": "Low",
            "description": "The dataset contains no numerical columns to analyze."
        })

    # Check for constant-value columns
    for column in metrics["numeric_columns"]:

        if df[column].nunique() == 1:
            issues.append({
                "title": "No Variation",
                "severity": "Low",
                "description": f"Column '{column}' contains the same value in every row."
            })

    # Detect potential outliers
    for column in metrics["numeric_columns"]:

        std = df[column].std()

        if std == 0:
            continue

        mean = df[column].mean()

        outliers = df[
            (df[column] > mean + (3 * std)) |
            (df[column] < mean - (3 * std))
        ]

        if len(outliers) > 0:
            issues.append({
                "title": "Potential Outliers",
                "severity": "Medium",
                "description": f"{len(outliers)} unusual values detected in '{column}'."
            })

    return {
    "filename": file.filename,
    "metrics": metrics,
    "issues": issues,
    "preview": df.head().to_dict(orient="records")
    }



