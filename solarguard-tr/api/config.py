"""
SolarGuard-TR API Configuration
================================
Centralized configuration management
"""
import os
from datetime import timedelta
from pathlib import Path


def _load_dotenv() -> None:
    """
    Minimal .env loader without external dependency.
    Looks for .env in project root and solarguard-tr folder.
    """
    candidate_paths = [
        Path(__file__).resolve().parents[2] / ".env",  # /astrobyte/.env
        Path(__file__).resolve().parents[1] / ".env",  # /astrobyte/solarguard-tr/.env
    ]

    for env_path in candidate_paths:
        if not env_path.exists():
            continue
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            os.environ.setdefault(key, value)


_load_dotenv()

class Config:
    """Application configuration"""
    
    # API Keys
    NASA_API_KEY = os.getenv("NASA_API_KEY", "DEMO_KEY")
    
    # API Endpoints
    DONKI_BASE = "https://api.nasa.gov/DONKI"
    NOAA_BASE = "https://services.swpc.noaa.gov"
    CELESTRAK_BASE = "https://celestrak.org/NORAD/elements"
    
    # Cache Settings
    NOAA_CACHE_TTL = timedelta(minutes=5)
    NASA_CACHE_TTL = timedelta(minutes=10)
    TLE_CACHE_TTL = timedelta(hours=12)
    
    # Request Settings
    REQUEST_TIMEOUT = 15.0
    MAX_RETRIES = 3
    RETRY_DELAY = 2.0
    
    # Data Processing
    KP_HISTORY_HOURS = 48
    FORECAST_HOURS = 96
    FLARE_HISTORY_DAYS = 30
    STORM_HISTORY_DAYS = 30
    
    # Risk Thresholds
    KP_STORM_THRESHOLD = 4.0
    KP_SEVERE_STORM_THRESHOLD = 5.0
    
    # Telemetry Defaults
    DEFAULT_SOLAR_WIND = 400.0
    DEFAULT_DENSITY = 5.0
    DEFAULT_BZ = 0.0

config = Config()
