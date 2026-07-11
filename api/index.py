# api/index.py — Vercel Python serverless entry point
#
# Vercel's Python runtime looks for a file inside the api/ directory.
# This thin shim adds the project root to sys.path so that the imports
# inside main.py (database, model, etc.) resolve correctly when the
# serverless function is executed from this subdirectory.

import sys
import os

# Add the repo root to the module search path so that main.py can import
# database.py and model.py which live alongside it in the root directory.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import and re-export the FastAPI application object.
# Vercel's Python runtime detects the ASGI app automatically from this module.
from main import app  # noqa: F401, E402
