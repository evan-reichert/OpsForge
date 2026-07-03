# Here is where we will create the backend
# FastAPI and Pandas will be utilized
from fastapi import FastAPI, UploadFile, File

app = FastAPI()

@app.get("/")
def root():
    return {"message": "OpsForge backend is running"}

# This is just a test API endpoint to ensure that the backend is working properly. We want to upload a CSV file. It will be removed in the future.
@app.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "message": "Upload successful!"
    }