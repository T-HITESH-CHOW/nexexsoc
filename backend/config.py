import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BASE_DIR / "sentinel_x.db"

SECRET_KEY = os.environ.get("SENTINEL_SECRET", "sentinel-x-cyber-range-secret-2026")
PORT = int(os.environ.get("PORT", 5000))
HOST = os.environ.get("HOST", "127.0.0.1")

# Containment Engine parameters
CONTAINMENT_DURATION_SECONDS = 60
AUTO_CONTAIN_CRITICAL_COUNT = 1
AUTO_CONTAIN_HIGH_COUNT = 2

# Stress testing bounds
MAX_STRESS_REQUESTS = 500
MAX_STRESS_CONCURRENCY = 10
