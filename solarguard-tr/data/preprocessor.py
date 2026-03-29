"""
SolarGuard-TR — Data Preprocessor (Zero-Leakage Pipeline)
==========================================================
Normalises raw DONKI JSON → hourly feature matrix
Builds lag / rolling / temporal / target features
Performs STRICT temporal train/test split (cutoff: 2025-01-01)
Fits StandardScaler on TRAIN only

CRITICAL: No shuffling. No random splits. No future information leaks.
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
import pickle
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parent.parent
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR = PROJECT_ROOT / "models"
MODELS_DIR.mkdir(exist_ok=True)
SCALER_PATH = MODELS_DIR / "scaler.pkl"

# Temporal cutoff — NEVER CHANGE to random split
TRAIN_CUTOFF = "2025-01-01"

# ---------------------------------------------------------------------------
# Flare class → numeric mapping
# ---------------------------------------------------------------------------
_CLASS_BASE = {"A": 0.0, "B": 1.0, "C": 2.0, "M": 3.0, "X": 4.0}


def parse_class_type(class_str) -> float:
    """Convert classType string (e.g. 'X8.1') to continuous numeric severity."""
    if pd.isna(class_str) or class_str is None:
        return 0.0
    s = str(class_str).strip().upper()
    if not s:
        return 0.0
    letter = s[0]
    base = _CLASS_BASE.get(letter, 0.0)
    try:
        return base + float(s[1:]) / 10.0
    except (ValueError, IndexError):
        return base


# ---------------------------------------------------------------------------
# Per-endpoint normalisers
# ---------------------------------------------------------------------------

def _safe_linked(events, keyword: str) -> float:
    if isinstance(events, list):
        return 1.0 if any(keyword in str(e) for e in events) else 0.0
    return 0.0


def normalize_flr(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return pd.DataFrame()
    out = pd.DataFrame()
    out["timestamp"] = pd.to_datetime(
        df["peakTime"].fillna(df.get("beginTime", pd.NaT)),
        utc=True, errors="coerce",
    )
    out["flr_class_numeric"] = df["classType"].apply(parse_class_type)

    begin = pd.to_datetime(df.get("beginTime"), utc=True, errors="coerce")
    end = pd.to_datetime(df.get("endTime"), utc=True, errors="coerce")
    out["flr_duration_min"] = (end - begin).dt.total_seconds() / 60.0

    linked = df.get("linkedEvents", pd.Series(dtype=object))
    out["flr_has_cme"] = linked.apply(lambda x: _safe_linked(x, "CME"))
    out["flr_has_sep"] = linked.apply(lambda x: _safe_linked(x, "SEP"))

    notif = df.get("submissionTime", pd.Series(dtype=object))
    out["flr_alerted"] = notif.apply(lambda x: 0.0 if pd.isna(x) else 1.0)

    out = out.dropna(subset=["timestamp"]).set_index("timestamp").sort_index()
    return out


def normalize_gst(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return pd.DataFrame()
    out = pd.DataFrame()
    out["timestamp"] = pd.to_datetime(df["startTime"], utc=True, errors="coerce")

    def _max_kp(kp_list):
        if not isinstance(kp_list, list):
            return 0.0
        vals = []
        for entry in kp_list:
            if isinstance(entry, dict) and "kpIndex" in entry:
                try:
                    vals.append(float(entry["kpIndex"]))
                except (ValueError, TypeError):
                    pass
        return max(vals) if vals else 0.0

    out["gst_max_kp"] = df["allKpIndex"].apply(_max_kp)
    out["gst_severity"] = out["gst_max_kp"].apply(
        lambda kp: 0 if kp < 4 else (1 if kp < 6 else (2 if kp < 7 else (3 if kp < 8 else 4)))
    )
    out = out.dropna(subset=["timestamp"]).set_index("timestamp").sort_index()
    return out


def normalize_cme(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return pd.DataFrame()
    out = pd.DataFrame()
    out["timestamp"] = pd.to_datetime(df.get("startTime", df.get("activityID")),
                                       utc=True, errors="coerce")
    # Speed — take from cmeAnalyses if available
    def _extract_speed(analyses):
        if not isinstance(analyses, list):
            return np.nan
        for a in analyses:
            if isinstance(a, dict) and "speed" in a:
                try:
                    return float(a["speed"])
                except (ValueError, TypeError):
                    pass
        return np.nan

    out["cme_speed"] = df.get("cmeAnalyses", pd.Series(dtype=object)).apply(_extract_speed)
    out["cme_occurred"] = 1.0
    out = out.dropna(subset=["timestamp"]).set_index("timestamp").sort_index()
    return out


def normalize_sep(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return pd.DataFrame()
    out = pd.DataFrame()
    out["timestamp"] = pd.to_datetime(df.get("eventTime", df.get("beginTime")),
                                       utc=True, errors="coerce")
    out["sep_occurred"] = 1.0
    out = out.dropna(subset=["timestamp"]).set_index("timestamp").sort_index()
    return out


def normalize_hss(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return pd.DataFrame()
    out = pd.DataFrame()
    out["timestamp"] = pd.to_datetime(df.get("eventTime", df.get("beginTime")),
                                       utc=True, errors="coerce")
    out["hss_occurred"] = 1.0
    out = out.dropna(subset=["timestamp"]).set_index("timestamp").sort_index()
    return out


# ---------------------------------------------------------------------------
# Hourly feature matrix (event-based → regular grid)
# ---------------------------------------------------------------------------

def create_hourly_feature_matrix(
    flr_df: pd.DataFrame,
    gst_df: pd.DataFrame,
    cme_df: pd.DataFrame,
    sep_df: pd.DataFrame,
    hss_df: pd.DataFrame,
    start: str = "2020-01-01",
    end: str = "2026-03-25",
) -> pd.DataFrame:
    """Resample all event dataframes to a 1-hour UTC grid."""
    idx = pd.date_range(start=start, end=end, freq="1h", tz="UTC")
    hourly = pd.DataFrame(index=idx)

    # — FLR —
    if not flr_df.empty:
        h = flr_df.resample("1h").agg({
            "flr_class_numeric": ["max", "count", "sum"],
            "flr_duration_min": "max",
            "flr_has_cme": "max",
            "flr_has_sep": "max",
            "flr_alerted": "max",
        })
        h.columns = [
            "flr_max_class", "flr_count", "flr_total_intensity",
            "flr_max_duration", "flr_linked_cme", "flr_linked_sep", "flr_alerted",
        ]
        hourly = hourly.join(h, how="left")

    # — GST —
    if not gst_df.empty:
        h = gst_df.resample("1h").agg({"gst_max_kp": "max", "gst_severity": "max"})
        hourly = hourly.join(h, how="left")

    # — CME —
    if not cme_df.empty:
        h = cme_df.resample("1h").agg({"cme_speed": "max", "cme_occurred": "max"})
        hourly = hourly.join(h, how="left")

    # — SEP —
    if not sep_df.empty:
        h = sep_df.resample("1h").agg({"sep_occurred": "max"})
        hourly = hourly.join(h, how="left")

    # — HSS —
    if not hss_df.empty:
        h = hss_df.resample("1h").agg({"hss_occurred": "max"})
        hourly = hourly.join(h, how="left")

    hourly = hourly.fillna(0.0)
    return hourly


# ---------------------------------------------------------------------------
# Feature engineering
# ---------------------------------------------------------------------------

def build_lag_features(
    df: pd.DataFrame,
    lag_hours: list[int] | None = None,
) -> pd.DataFrame:
    """Backward-looking lag features. No leakage — shift(n) with n > 0."""
    if lag_hours is None:
        lag_hours = [1, 3, 6, 12, 24, 48, 72]
    base_cols = [c for c in df.columns if not c.startswith(("lag_", "roll_", "target_", "tc_"))]
    for col in base_cols:
        for lag in lag_hours:
            df[f"lag_{lag}h_{col}"] = df[col].shift(lag)
    return df.dropna()


def build_rolling_features(
    df: pd.DataFrame,
    windows: list[int] | None = None,
) -> pd.DataFrame:
    """Rolling mean/max/std shifted by 1 to avoid same-hour leakage."""
    if windows is None:
        windows = [6, 12, 24, 48, 72]
    key_cols = [c for c in ["flr_max_class", "flr_count", "gst_max_kp"] if c in df.columns]
    for col in key_cols:
        shifted = df[col].shift(1)
        for w in windows:
            df[f"roll_{w}h_mean_{col}"] = shifted.rolling(window=w, min_periods=1).mean()
            df[f"roll_{w}h_max_{col}"]  = shifted.rolling(window=w, min_periods=1).max()
            df[f"roll_{w}h_std_{col}"]  = shifted.rolling(window=w, min_periods=1).std().fillna(0)
    return df


def build_temporal_features(df: pd.DataFrame) -> pd.DataFrame:
    """Cyclical time encoding + solar cycle phase."""
    ts = df.index
    hour = ts.hour
    doy  = ts.dayofyear

    df["tc_hour_sin"] = np.sin(2 * np.pi * hour / 24.0)
    df["tc_hour_cos"] = np.cos(2 * np.pi * hour / 24.0)
    df["tc_doy_sin"]  = np.sin(2 * np.pi * doy / 365.25)
    df["tc_doy_cos"]  = np.cos(2 * np.pi * doy / 365.25)

    # Solar Cycle 25 started ≈ Dec 2019
    fractional_year = ts.year + ts.dayofyear / 365.25
    df["tc_solar_cycle_phase"] = (fractional_year - 2019.75) / 11.0

    return df


def build_target_variables(
    df: pd.DataFrame,
    horizons: list[int] | None = None,
) -> pd.DataFrame:
    """
    Forward-looking targets (shift negative → only used as labels, never as input).
    Binary: any M+ / X class flare in next h hours
    Regression: max Kp in next h hours
    """
    if horizons is None:
        horizons = [24, 48, 72]

    if "flr_max_class" in df.columns:
        for h in horizons:
            future = df["flr_max_class"].shift(-1).rolling(window=h, min_periods=1).max()
            df[f"target_mx_event_{h}h"] = (future >= 3.0).astype(float)
            df[f"target_max_class_{h}h"] = future

    if "gst_max_kp" in df.columns:
        for h in horizons:
            df[f"target_max_kp_{h}h"] = (
                df["gst_max_kp"].shift(-1).rolling(window=h, min_periods=1).max()
            )

    return df.dropna()


# ---------------------------------------------------------------------------
# Temporal split + scaler
# ---------------------------------------------------------------------------

def temporal_train_test_split(
    df: pd.DataFrame,
    cutoff: str = TRAIN_CUTOFF,
):
    """Strictly temporal split. NO shuffling. NO randomness."""
    cutoff_ts = pd.Timestamp(cutoff, tz="UTC")
    train = df[df.index < cutoff_ts].copy()
    test  = df[df.index >= cutoff_ts].copy()
    print(f"  SPLIT  train={len(train):>7,}  ({train.index[0]} → {train.index[-1]})")
    print(f"         test ={len(test):>7,}  ({test.index[0]} → {test.index[-1]})")
    assert len(train) > 0 and len(test) > 0, "Empty train or test set!"
    return train, test


def fit_scaler_on_train_only(
    train_df: pd.DataFrame,
    feature_cols: list[str],
) -> StandardScaler:
    """Fit StandardScaler on TRAIN data only → save to disk."""
    scaler = StandardScaler()
    scaler.fit(train_df[feature_cols])
    with open(SCALER_PATH, "wb") as fh:
        pickle.dump(scaler, fh)
    print(f"  SCALER fitted on {len(train_df)} rows. Saved → {SCALER_PATH}")
    return scaler


# ---------------------------------------------------------------------------
# Convenience: list feature / target columns
# ---------------------------------------------------------------------------

def get_feature_and_target_cols(df: pd.DataFrame):
    """Return (feature_cols, target_cols) from the processed DataFrame."""
    target_cols  = [c for c in df.columns if c.startswith("target_")]
    feature_cols = [c for c in df.columns if c not in target_cols]
    return feature_cols, target_cols


# ---------------------------------------------------------------------------
# Full pipeline
# ---------------------------------------------------------------------------

def run_preprocessing_pipeline(datasets: dict[str, pd.DataFrame]) -> tuple:
    """
    End-to-end preprocessing:
      raw DataFrames → normalise → hourly grid → features → split → scale
    Returns (train_df, test_df, scaler, feature_cols, target_cols)
    """
    print("\n🔧 NORMALISING raw events …")
    flr = normalize_flr(datasets.get("FLR", pd.DataFrame()))
    gst = normalize_gst(datasets.get("GST", pd.DataFrame()))
    cme = normalize_cme(datasets.get("CME", pd.DataFrame()))
    sep = normalize_sep(datasets.get("SEP", pd.DataFrame()))
    hss = normalize_hss(datasets.get("HSS", pd.DataFrame()))

    print("📐 Building hourly feature matrix …")
    hourly = create_hourly_feature_matrix(flr, gst, cme, sep, hss)
    print(f"   → {len(hourly)} rows, {hourly.shape[1]} base features")

    print("🕰️  Temporal features …")
    hourly = build_temporal_features(hourly)

    print("⏪ Lag features …")
    hourly = build_lag_features(hourly)

    print("📈 Rolling features …")
    hourly = build_rolling_features(hourly)

    print("🎯 Target variables …")
    hourly = build_target_variables(hourly)

    feature_cols, target_cols = get_feature_and_target_cols(hourly)
    print(f"   → {len(feature_cols)} features, {len(target_cols)} targets, {len(hourly)} rows")

    print("✂️  Temporal train/test split …")
    train, test = temporal_train_test_split(hourly)

    print("📏 Fitting scaler (train only) …")
    scaler = fit_scaler_on_train_only(train, feature_cols)
    train[feature_cols] = scaler.transform(train[feature_cols])
    test[feature_cols]  = scaler.transform(test[feature_cols])

    # Persist processed data
    train.to_parquet(PROCESSED_DIR / "train.parquet")
    test.to_parquet(PROCESSED_DIR / "test.parquet")
    print(f"  💾 Saved → {PROCESSED_DIR}")

    return train, test, scaler, feature_cols, target_cols


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    from data.donki_fetcher import fetch_all_endpoints

    datasets = fetch_all_endpoints()
    run_preprocessing_pipeline(datasets)
