"""
SolarGuard-TR — NASA DONKI Multi-Endpoint Data Fetcher
=====================================================
Fetches Solar Flare (FLR), CME, Geomagnetic Storm (GST),
Solar Energetic Particle (SEP), and High Speed Stream (HSS) data
from NASA's DONKI API with built-in rate-limit protection and
local JSON caching to avoid redundant requests.

Rate limits for DEMO_KEY: 30 requests/hour.
Strategy: chunk into 30-day windows, cache each chunk, sleep between batches.
"""

import requests
import pandas as pd
import time
import json
from datetime import datetime, timedelta
from pathlib import Path

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
DEMO_KEY = "DEMO_KEY"  # Replace with real key from https://api.nasa.gov
BASE_URL = "https://api.nasa.gov/DONKI"

# Resolve paths relative to project root (solarguard-tr/)
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data" / "raw"
DATA_DIR.mkdir(parents=True, exist_ok=True)

ENDPOINTS = {
    "FLR": "FLR",   # Solar Flare
    "CME": "CME",   # Coronal Mass Ejection
    "GST": "GST",   # Geomagnetic Storm
    "SEP": "SEP",   # Solar Energetic Particle
    "HSS": "HSS",   # High Speed Stream
}

# ---------------------------------------------------------------------------
# Single-window fetcher (with recursive retry on 429)
# ---------------------------------------------------------------------------

def fetch_donki_endpoint(
    endpoint_key: str,
    start_date: str,
    end_date: str,
    api_key: str = DEMO_KEY,
    _retry: int = 0,
) -> list:
    """
    Fetch one 30-day window from a single DONKI endpoint.
    Returns a list of event dicts.  Never raises — returns [] on failure.
    """
    url = f"{BASE_URL}/{ENDPOINTS[endpoint_key]}"
    params = {
        "startDate": start_date,
        "endDate": end_date,
        "api_key": api_key,
    }
    try:
        resp = requests.get(url, params=params, timeout=30)

        if resp.status_code == 429:
            wait = 60 * (2 ** _retry)          # exponential back-off
            print(f"  ⏳ RATE_LIMIT (429) on {endpoint_key} {start_date}. "
                  f"Sleeping {wait}s (retry #{_retry + 1})…")
            time.sleep(wait)
            if _retry < 4:
                return fetch_donki_endpoint(endpoint_key, start_date, end_date,
                                            api_key, _retry + 1)
            print(f"  ❌ Max retries exceeded for {endpoint_key} {start_date}.")
            return []

        if resp.status_code != 200:
            print(f"  ❌ HTTP {resp.status_code} — {endpoint_key} {start_date}")
            return []

        data = resp.json()
        return data if isinstance(data, list) else []

    except Exception as exc:
        print(f"  ❌ EXCEPTION — {endpoint_key} {start_date}: {exc}")
        return []

# ---------------------------------------------------------------------------
# Chunked date-range fetcher with disk cache
# ---------------------------------------------------------------------------

def fetch_date_range_chunked(
    endpoint_key: str,
    global_start: str,
    global_end: str,
    api_key: str = DEMO_KEY,
) -> pd.DataFrame:
    """
    Splits [global_start, global_end] into ≤30-day windows and fetches each.
    Saves/loads each chunk as a JSON file under data/raw/ to survive crashes.
    """
    all_records: list = []
    current = datetime.strptime(global_start, "%Y-%m-%d")
    end = datetime.strptime(global_end, "%Y-%m-%d")
    request_count = 0

    while current < end:
        chunk_end = min(current + timedelta(days=29), end)
        s = current.strftime("%Y-%m-%d")
        e = chunk_end.strftime("%Y-%m-%d")

        cache_path = DATA_DIR / f"{endpoint_key}_{s}_{e}.json"

        if cache_path.exists():
            with open(cache_path, encoding="utf-8") as fh:
                records = json.load(fh)
            print(f"  📂 CACHE  {endpoint_key} {s}→{e}  ({len(records)} rec)")
        else:
            records = fetch_donki_endpoint(endpoint_key, s, e, api_key)
            with open(cache_path, "w", encoding="utf-8") as fh:
                json.dump(records, fh, ensure_ascii=False)
            print(f"  🌐 FETCH  {endpoint_key} {s}→{e}  ({len(records)} rec)")
            request_count += 1

            # Adaptive sleep to stay within DEMO_KEY 30 req/hr
            if api_key == DEMO_KEY:
                if request_count % 5 == 0:
                    print("  💤 Rate-limit guard: sleeping 15 s …")
                    time.sleep(15)
                else:
                    time.sleep(2.5)

        all_records.extend(records)
        current = chunk_end + timedelta(days=1)

    if all_records:
        return pd.DataFrame(all_records)
    return pd.DataFrame()

# ---------------------------------------------------------------------------
# Master fetch (all endpoints, full date range)
# ---------------------------------------------------------------------------

def fetch_all_endpoints(
    global_start: str = "2020-01-01",
    global_end: str = "2026-03-25",
    api_key: str = DEMO_KEY,
) -> dict[str, pd.DataFrame]:
    """
    Downloads every DONKI endpoint for the specified range.
    Returns dict  { "FLR": DataFrame, "CME": DataFrame, … }
    """
    datasets: dict[str, pd.DataFrame] = {}
    for ep in ENDPOINTS:
        print(f"\n{'='*50}")
        print(f"  🚀 ENDPOINT: {ep}")
        print(f"{'='*50}")
        df = fetch_date_range_chunked(ep, global_start, global_end, api_key)
        datasets[ep] = df
        print(f"  ✅ {ep} total records: {len(df)}")
    return datasets


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="SolarGuard-TR DONKI Fetcher")
    parser.add_argument("--start", default="2020-01-01", help="Start date YYYY-MM-DD")
    parser.add_argument("--end",   default="2026-03-25", help="End date YYYY-MM-DD")
    parser.add_argument("--key",   default=DEMO_KEY,     help="NASA API key")
    args = parser.parse_args()

    print("╔══════════════════════════════════════════════╗")
    print("║   SolarGuard-TR  —  DONKI Data Fetcher      ║")
    print("╚══════════════════════════════════════════════╝")
    print(f"  Range : {args.start} → {args.end}")
    print(f"  Key   : {'DEMO_KEY' if args.key == DEMO_KEY else '(custom)'}")
    print()

    datasets = fetch_all_endpoints(args.start, args.end, args.key)

    print("\n\n📊 SUMMARY")
    print("-" * 40)
    for name, df in datasets.items():
        print(f"  {name:4s} → {len(df):>6,} records")
    print("Done. Cached JSON files are in:", DATA_DIR)
