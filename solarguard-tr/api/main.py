"""
SolarGuard-TR â€” FastAPI Backend (Clean Modular Architecture)
============================================================
Serves endpoints consumed by the Stitch Dashboard.
NO MOCK DATA. Uses Real NOAA SWPC and NASA DONKI APIs.

Version: 4.0.0 (Complete Rewrite)
"""
import sys
import requests
import re
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI, Query, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging

# Import modular components
from .config import config
from .cache_manager import cache
from .noaa_client import noaa_client
from .nasa_client import nasa_client
from .data_processor import data_processor
from models.turkish_asset_risk import generate_turkish_risk_report

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="SolarGuard-TR API",
    description="GÃ¼neÅŸ FÄ±rtÄ±nasÄ± Erken UyarÄ± Sistemi â€” Backend (Real Data NO-MOCK)",
    version="4.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory cache for GOES X-Ray
_cache = {}


# ============================================================================
# Health & Cache Endpoints
# ============================================================================

@app.get("/api/health")
def health():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "SolarGuard-TR API",
        "version": "4.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.post("/api/clear-cache")
def clear_cache():
    """Clear all cached data to force fresh API fetches"""
    cache.clear()
    logger.info("Cache cleared by user request")
    return {"status": "success", "message": "Cache cleared successfully"}


@app.get("/api/cache-stats")
def get_cache_stats():
    """Get cache statistics"""
    return cache.get_stats()


# ============================================================================
# NOAA Data Endpoints
# ============================================================================

@app.get("/api/space-weather-history")
def get_space_weather_history():
    """
    Get space weather history with Kp events and realtime telemetry
    
    Returns:
        Dictionary with highlight_events and realtime_telemetry
    """
    try:
        return data_processor.process_kp_history()
    except Exception as e:
        logger.error(f"Error processing space weather history: {e}")
        return {
            "highlight_events": [],
            "period": "Error fetching data",
            "realtime_telemetry": {
                "solar_wind_speed": None,
                "proton_density": None,
                "bz_gsm": None
            }
        }


@app.get("/api/forecast-series")
async def get_forecast_series():
    """
    Get Kp forecast series with ML-style predictions
    
    Returns:
        List of forecast data points with kp_lstm, kp_xgb, confidence intervals
    """
    try:
        return data_processor.process_forecast_series()
    except Exception as e:
        logger.error(f"Error processing forecast series: {e}")
        return []

@app.get("/api/aurora-activity")
def get_aurora_activity():
    """
    Get aurora visibility and intensity inferred from realtime Kp.
    """
    try:
        return data_processor.get_aurora_activity()
    except Exception as e:
        logger.error(f"Error processing aurora activity: {e}")
        return {
            "north_visible": False,
            "south_visible": False,
            "intensity": 0.0,
            "kp": 0.0,
        }


@app.get("/api/model-metrics")
def get_model_metrics():
    """
    Get model performance metrics
    
    Returns:
        Dictionary with LSTM, XGBoost, and baseline metrics
    """
    try:
        return data_processor.process_model_metrics()
    except Exception as e:
        logger.error(f"Error processing model metrics: {e}")
        return {
            "lstm": {"auc_roc": 0.0, "precision_24h": 0.0},
            "xgboost": {"auc_roc": 0.0},
            "baselines": {"persistence_auc": 0.0}
        }


# ============================================================================
# NOAA X-Ray Flux Endpoints
# ============================================================================

@app.get("/api/latest-flare")
async def read_latest_flare():
    """
    Get latest solar flare status from NOAA GOES X-Ray Flux
    
    Returns:
        Dictionary with time_tag, flux, flare_class, and satellite
    """
    data = await noaa_client.get_latest_xray_flux()
    if not data:
        raise HTTPException(status_code=503, detail="Veri kaynaÄŸÄ±na ulaÅŸÄ±lamÄ±yor")
    return data


@app.get("/api/goes-xray")
async def read_goes_xray_flux():
    """
    Get latest GOES X-Ray Flux data with 2-minute cache
    
    Returns:
        Dictionary with time_tag, flux, flare_class, and satellite
    """
    data = await noaa_client.get_goes_xray_flux()
    if not data:
        raise HTTPException(status_code=503, detail="GOES X-Ray verisine ulaÅŸÄ±lamÄ±yor")
    return data


@app.get("/api/telemetry-summary")
async def get_telemetry_summary():
    """
    Get complete telemetry summary with all space weather parameters
    
    Returns:
        Dictionary with wind_speed, density, imf_bz, proton_flux, kp_index, and status
    """
    try:
        # Get all telemetry data from NOAA client
        wind_data = noaa_client.get_solar_wind_data()  # Speed and Density
        mag_data = noaa_client.get_mag_field_data()    # Bz
        proton_data = noaa_client.get_proton_flux()    # Proton
        kp_data = noaa_client.get_realtime_kp()        # Kp
        
        return {
            "wind_speed": wind_data.get("speed"),
            "density": wind_data.get("density"),
            "imf_bz": mag_data.get("bz"),
            "proton_flux": proton_data.get("flux"),
            "kp_index": kp_data.get("kp"),
            "status": "active"
        }
    except Exception as e:
        logger.error(f"Error fetching telemetry summary: {e}")
        return {"status": "error", "message": str(e)}


@app.get("/api/realtime-kp")
def get_realtime_kp():
    """
    Real-time sync endpoint for UI clocks + latest observed Kp.
    Note: NOAA planetary Kp is typically refreshed in 3-hour cadence.
    """
    try:
        kp_obs = noaa_client.get_latest_kp_observation()
        kp_nowcast = noaa_client.get_kp_nowcast_estimate()
        return {
            "server_time_utc": datetime.now(timezone.utc).isoformat(),
            "kp_index": kp_obs.get("kp_index"),
            "observation_time_utc": kp_obs.get("observation_time_utc"),
            "source": kp_obs.get("source"),
            "cadence_minutes": kp_obs.get("cadence_minutes"),
            "is_realtime_estimate": kp_obs.get("is_realtime_estimate"),
            "kp_nowcast": kp_nowcast.get("kp_nowcast"),
            "nowcast_generated_at_utc": kp_nowcast.get("generated_at_utc"),
            "nowcast_confidence": kp_nowcast.get("confidence"),
            "nowcast_is_warning": kp_nowcast.get("is_warning"),
            "nowcast_method": kp_nowcast.get("method"),
        }
    except Exception as e:
        logger.error(f"Error fetching realtime Kp: {e}")
        return {
            "server_time_utc": datetime.now(timezone.utc).isoformat(),
            "kp_index": None,
            "observation_time_utc": None,
            "source": "NOAA SWPC planetary-k-index",
            "cadence_minutes": 180,
            "is_realtime_estimate": False,
            "kp_nowcast": None,
            "nowcast_generated_at_utc": None,
            "nowcast_confidence": None,
            "nowcast_is_warning": False,
            "nowcast_method": "telemetry_nowcast_v1",
        }


# ============================================================================
# NASA DONKI Data Endpoints
# ============================================================================

@app.get("/api/recent-flares")
def get_recent_flares(days: int = Query(default=30, ge=1, le=365)):
    """
    Get recent solar flare data
    
    Args:
        days: Number of days to look back (1-365)
    
    Returns:
        List of flare events
    """
    try:
        flares = nasa_client.get_solar_flares(days=days)
        return flares if flares else []
    except Exception as e:
        logger.error(f"Error fetching recent flares: {e}")
        return []


@app.get("/api/geomagnetic-storms")
def get_geomagnetic_storms(days: int = Query(default=30, ge=1, le=365)):
    """
    Get geomagnetic storm data
    
    Args:
        days: Number of days to look back (1-365)
    
    Returns:
        List of storm events
    """
    try:
        storms = nasa_client.get_geomagnetic_storms(days=days)
        return storms if storms else []
    except Exception as e:
        logger.error(f"Error fetching geomagnetic storms: {e}")
        return []


@app.get("/api/cme-events")
def get_cme_events(days: int = Query(default=30, ge=1, le=365)):
    """
    Get coronal mass ejection (CME) data
    
    Args:
        days: Number of days to look back (1-365)
    
    Returns:
        List of CME events
    """
    try:
        cme = nasa_client.get_cme_events(days=days)
        return cme if cme else []
    except Exception as e:
        logger.error(f"Error fetching CME events: {e}")
        return []


@app.get("/api/donki-notifications")
def get_donki_notifications(
    days: int = Query(default=30, ge=1, le=365),
    notification_type: str = Query(default="all")
):
    """
    Get DONKI notifications
    
    Args:
        days: Number of days to look back (1-365)
        notification_type: Type of notification (all, FLR, CME, etc.)
    
    Returns:
        List of notifications
    """
    try:
        notifications = nasa_client.get_notifications(days=days, notification_type=notification_type)
        return notifications if notifications else []
    except Exception as e:
        logger.error(f"Error fetching DONKI notifications: {e}")
        return []


@app.get("/api/interplanetary-shocks")
def get_interplanetary_shocks(
    days: int = Query(default=30, ge=1, le=365),
    location: str = Query(default="Earth")
):
    """
    Get interplanetary shock data
    
    Args:
        days: Number of days to look back (1-365)
        location: Location (Earth, etc.)
    
    Returns:
        List of shock events
    """
    try:
        shocks = nasa_client.get_interplanetary_shocks(days=days, location=location)
        return shocks if shocks else []
    except Exception as e:
        logger.error(f"Error fetching interplanetary shocks: {e}")
        return []


@app.get("/api/wsa-enlil")
def get_wsa_enlil(days: int = Query(default=15, ge=1, le=365)):
    """
    Get WSA-Enlil simulation data
    
    Args:
        days: Number of days to look back (1-365)
    
    Returns:
        List of simulation data
    """
    try:
        wsa_enlil = nasa_client.get_wsa_enlil_simulations(days=days)
        return wsa_enlil if wsa_enlil else []
    except Exception as e:
        logger.error(f"Error fetching WSA-Enlil simulations: {e}")
        return []


@app.get("/api/radiation-belt-enhancement")
def get_radiation_belt_enhancement(days: int = Query(default=30, ge=1, le=365)):
    """
    Get radiation belt enhancement data
    
    Args:
        days: Number of days to look back (1-365)
    
    Returns:
        List of RBE events
    """
    try:
        rbe = nasa_client.get_radiation_belt_enhancement(days=days)
        return rbe if rbe else []
    except Exception as e:
        logger.error(f"Error fetching radiation belt enhancement: {e}")
        return []


# ============================================================================
# Turkish Asset Risk Endpoints
# ============================================================================

@app.get("/api/turkish-asset-risk")
def get_turkish_asset_risk(
    kp: Optional[float] = Query(default=None),
    flare_class: Optional[float] = Query(default=None)
):
    """
    Get Turkish asset risk assessment
    
    Args:
        kp: Current Kp index (optional, will fetch if not provided)
        flare_class: Flare class (optional, will estimate if not provided)
    
    Returns:
        Dictionary with satellite_risks and ground_risks
    """
    try:
        # Get current Kp if not provided
        if kp is None:
            kp = noaa_client.get_current_kp()
            if kp is None:
                kp = 3.0  # Default value
        
        # Estimate flare class if not provided
        if flare_class is None:
            flare_class = min(max((kp - 2.0) * 1.5, 1.0), 9.0)
        
        # Calculate M+ event probability
        prob_mx = min(kp / 10.0, 0.99)
        
        # Generate risk report
        return generate_turkish_risk_report(
            kp_forecast_24h=kp,
            flr_class_forecast=flare_class,
            prob_mx_event=prob_mx
        )
    except Exception as e:
        logger.error(f"Error generating Turkish asset risk: {e}")
        return {
            "satellite_risks": {},
            "ground_risks": {},
            "prob_mx_event": 0.0
        }


def _flare_class_to_numeric(flare_class: Optional[str]) -> float:
    """
    Convert flare class strings like X1.2 / M5.6 into a numeric scale.
    A=1, B=2, C=3, M=4, X=5 (+ magnitude contribution).
    """
    if not flare_class:
        return 1.0

    m = re.match(r"^\s*([ABCMX])\s*([0-9]*\.?[0-9]+)?\s*$", str(flare_class).upper())
    if not m:
        return 1.0

    letter = m.group(1)
    magnitude = float(m.group(2) or 1.0)
    base = {"A": 1.0, "B": 2.0, "C": 3.0, "M": 4.0, "X": 5.0}.get(letter, 1.0)
    return min(9.0, base + (magnitude / 10.0))


def _severity_from_priority(priority: int) -> str:
    if priority >= 80:
        return "CRITICAL"
    if priority >= 60:
        return "HIGH"
    if priority >= 40:
        return "MEDIUM"
    return "LOW"


def _window_from_priority(priority: int) -> str:
    if priority >= 80:
        return "T-1h"
    if priority >= 60:
        return "T-6h"
    return "T-12h"


def _build_asset_action(asset_name: str, info: dict, domain: str) -> tuple[str, str]:
    risk_type = str(info.get("risk_type", "")).lower()
    asset_type = str(info.get("type", "")).lower()

    if domain == "satellite" and risk_type == "surface_charging":
        return (
            "Safe mode hazirliklari yap, yuksek guc tuketimli yukleri gecici kisitla ve telemetri sikligini artir.",
            "Surface charging nedeniyle gecici subsystem resetleri ve baglanti kesintisi gorulebilir.",
        )
    if domain == "satellite" and risk_type == "atmospheric_drag":
        return (
            "Yorunge/drag butcesini guncelle, maneuver penceresini acik tut ve gorev planini sadeleştir.",
            "LEO drag artisi konum hatasi ve gorev zamanlama sapmasi yaratabilir.",
        )
    if asset_type == "power_grid":
        return (
            "Yuk dengeleme planini aktif et, kritik trafolari yakin izle ve reaktif guc rezervini artir.",
            "GIC etkisiyle trafo zorlanmasi ve bolgesel kesinti riski artar.",
        )
    if asset_type == "satellite_control":
        return (
            "Yedek uplink/downlink hattini hazir tut, komut pencerelerini kisalt ve operatorde 7/24 nobet uygula.",
            "TT&C kesintisi komut gecikmesine ve operasyonel kontrol kaybina yol acabilir.",
        )
    return (
        "Operasyon izleme frekansini artir, alarm esiklerini gecici olarak sikilastir ve yedek proseduru hazir tut.",
        "Erken onlem alinmazsa servis kalitesinde dalgalanma ve gecikme artisi beklenir.",
    )


@app.get("/api/action-recommendations")
async def get_action_recommendations():
    """
    Decision support endpoint:
    Converts current space weather + per-asset risk into ranked operational actions.
    """
    try:
        kp = noaa_client.get_current_kp()
        kp = float(kp) if kp is not None else 3.0

        goes = await noaa_client.get_goes_xray_flux()
        flare_class = (goes or {}).get("flare_class", "A1.0")
        flare_numeric = _flare_class_to_numeric(flare_class)

        prob_mx = min(max(kp / 10.0, 0.0), 0.99)
        report = generate_turkish_risk_report(
            kp_forecast_24h=kp,
            flr_class_forecast=flare_numeric,
            prob_mx_event=prob_mx,
        )

        kp_factor = min(max(kp / 9.0, 0.0), 1.0)
        risk_items = []

        for asset_name, info in report.get("satellite_risks", {}).items():
            risk_items.append(("satellite", asset_name, info))
        for asset_name, info in report.get("ground_risks", {}).items():
            risk_items.append(("ground", asset_name, info))

        actions = []
        for domain, asset_name, info in risk_items:
            risk_score = float(info.get("risk_score", 0.0))
            base_priority = ((risk_score * 0.65) + (kp_factor * 0.20) + (prob_mx * 0.15)) * 100.0
            if str(flare_class).upper().startswith("X"):
                base_priority += 10.0
            elif str(flare_class).upper().startswith("M"):
                base_priority += 5.0

            priority = int(max(1, min(100, round(base_priority))))
            action_text, impact_text = _build_asset_action(asset_name, info, domain)

            actions.append({
                "asset": asset_name,
                "domain": domain,
                "risk_score": round(risk_score, 3),
                "priority_score": priority,
                "severity": _severity_from_priority(priority),
                "window": _window_from_priority(priority),
                "action": action_text,
                "if_not_done": impact_text,
            })

        actions = sorted(actions, key=lambda x: x["priority_score"], reverse=True)
        top_actions = actions[:5]

        return {
            "generated_at_utc": datetime.now(timezone.utc).isoformat(),
            "situation": {
                "kp_index": round(kp, 2),
                "flare_class": flare_class,
                "prob_mx_event_24h": round(prob_mx, 3),
                "composite_alert_level": report.get("composite_alert_level", "GREEN"),
            },
            "operational_window": top_actions[0]["window"] if top_actions else "T-12h",
            "top_actions": top_actions,
            "summary": {
                "critical_count": len([a for a in top_actions if a["severity"] == "CRITICAL"]),
                "high_count": len([a for a in top_actions if a["severity"] == "HIGH"]),
            },
        }
    except Exception as e:
        logger.error(f"Error generating action recommendations: {e}")
        return {
            "generated_at_utc": datetime.now(timezone.utc).isoformat(),
            "situation": {
                "kp_index": None,
                "flare_class": None,
                "prob_mx_event_24h": None,
                "composite_alert_level": "GREEN",
            },
            "operational_window": "T-12h",
            "top_actions": [],
            "summary": {"critical_count": 0, "high_count": 0},
        }


# ============================================================================
# TLE Data Endpoints
# ============================================================================

@app.get("/api/global-tles")
def get_global_tles():
    """
    Fetch real active TLEs from CelesTrak
    
    Returns:
        List of satellite TLE data
    """
    cache_key = "celestrak_active_tles"
    
    # Try cache first
    cached_data = cache.get(cache_key)
    if cached_data is not None:
        return cached_data
    
    try:
        from .http_client import http_client
        
        urls = [
            f"{config.CELESTRAK_BASE}/stations.txt",
            f"{config.CELESTRAK_BASE}/starlink.txt",
            f"{config.CELESTRAK_BASE}/geo.txt",
            f"{config.CELESTRAK_BASE}/gnss.txt",
            f"{config.CELESTRAK_BASE}/resource.txt"
        ]
        
        lines = []
        for url in urls:
            try:
                text = http_client.get_text(url)
                if text:
                    lines.extend(text.splitlines())
            except Exception as e:
                logger.warning(f"Failed to fetch TLE from {url}: {e}")
        
        if not lines:
            return []
        
        # Parse TLE data
        sats = []
        for i in range(0, len(lines), 3):
            if i + 2 >= len(lines):
                break
            
            name = lines[i].strip()
            tle1 = lines[i+1].strip()
            tle2 = lines[i+2].strip()
            
            # Categorize satellite
            category = 'OTHER'
            if 'STARLINK' in name:
                category = 'STARLINK'
            elif any(x in name for x in ['NAVSTAR', 'GPS', 'GLONASS', 'GALILEO']):
                category = 'GPS'
            elif any(x in name for x in ['TURKSAT', 'GOKTURK', 'BILSAT', 'IMECE', 'RASAT']):
                category = 'TURKEY'
            
            sats.append({
                "name": name,
                "tle1": tle1,
                "tle2": tle2,
                "category": category
            })
        
        # Limit counts by category
        final_sats = []
        starlink_count = 0
        other_count = 0
        
        for sat in sats:
            if sat["category"] in ['TURKEY', 'GPS']:
                final_sats.append(sat)
            elif sat["category"] == 'STARLINK' and starlink_count < 500:
                final_sats.append(sat)
                starlink_count += 1
            elif other_count < 300:
                final_sats.append(sat)
                other_count += 1
        
        # Cache the result
        cache.set(cache_key, final_sats, config.TLE_CACHE_TTL)
        logger.info(f"Fetched {len(final_sats)} TLEs from CelesTrak")
        
        return final_sats
        
    except Exception as e:
        logger.error(f"Error fetching global TLEs: {e}")
        return []


# ============================================================================
# Historical Scenarios Endpoint
# ============================================================================

@app.get("/api/historical-scenarios")
def get_historical_scenarios():
    """
    Get historical space weather scenarios
    
    Returns:
        List of historical scenarios
    """
    return [
        {
            "id": 'quebec',
            "year": '1989',
            "name": 'Quebec KarartmasÄ±',
            "desc": 'Kp=9. 9 saat elektrik kesintisi. GIC (Geomanyetik Ä°ndÃ¼klenen AkÄ±m) sebebiyle trafolar yandÄ±.',
            "color": 'var(--red)'
        },
        {
            "id": 'halloween',
            "year": '2003',
            "name": 'Halloween FÄ±rtÄ±nalarÄ±',
            "desc": 'X28+ Flare. NASA uydularÄ± gÃ¼venli moda alÄ±ndÄ±, uÃ§uÅŸ rotalarÄ± deÄŸiÅŸtirildi.',
            "color": 'var(--amber)'
        },
        {
            "id": 'may2024',
            "year": '2024',
            "name": 'MayÄ±s G5 FÄ±rtÄ±nasÄ±',
            "desc": "Son 20 yÄ±lÄ±n en gÃ¼Ã§lÃ¼sÃ¼. TarÄ±m GPS sistemleri koptu, auroralar TÃ¼rkiye'den izlendi.",
            "color": 'var(--cyan)'
        }
    ]


# ============================================================================
# Webhook Endpoint
# ============================================================================

@app.post("/api/webhook")
async def trigger_webhook(request: Request):
    """
    Simulates an alert dispatch endpoint (Webhook/Telegram)
    
    Returns:
        Success response
    """
    try:
        data = await request.json()
    except Exception:
        data = {}

    logger.info(f"Webhook triggered with payload: {data}")
    return {
        "status": "success",
        "dispatched": True,
        "payload": data,
        "message": "Alan uzmanlarÄ±na bildirim gÃ¶nderildi (G3+ OlayÄ±)."
    }

# ============================================================================
# Application Startup
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Log application startup"""
    logger.info("=" * 60)
    logger.info("SolarGuard-TR API v4.0.0 Starting...")
    logger.info("=" * 60)
    logger.info(f"NOAA Base URL: {config.NOAA_BASE}")
    logger.info(f"NASA Base URL: {config.DONKI_BASE}")
    logger.info(f"NOAA Cache TTL: {config.NOAA_CACHE_TTL}")
    logger.info(f"NASA Cache TTL: {config.NASA_CACHE_TTL}")
    logger.info("=" * 60)


@app.on_event("shutdown")
async def shutdown_event():
    """Log application shutdown"""
    logger.info("SolarGuard-TR API Shutting down...")
    from .http_client import http_client
    http_client.close()


# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )


# ============================================================================
# GOES X-Ray Endpoint (Direct Implementation)
# ============================================================================

@app.get("/api/goes-xray")
def get_goes_xray():
    """
    Get latest GOES X-Ray Flux data with 2-minute cache
    
    Returns:
        Dictionary with time_tag, flux, flare_class, and satellite
    """
    cache_key = "goes_xray"
    now = datetime.now(timezone.utc)
    if cache_key in _cache:
        cached_time, cached_data = _cache[cache_key]
        if (now - cached_time).total_seconds() < 120:
            return cached_data
    try:
        r = requests.get(
            "https://services.swpc.noaa.gov/json/goes/primary/xrays-1-day.json",
            timeout=10
        )
        if r.status_code == 200:
            data = r.json()
            long_band = [d for d in data if d.get("energy") == "0.1-0.8nm" or d.get("band") == "0.1-0.8nm"]
            if not long_band:
                long_band = data
            latest = long_band[-1]
            flux = latest.get("flux", 0) or 0
            if flux >= 1e-4: cls = f"X{flux/1e-4:.1f}"
            elif flux >= 1e-5: cls = f"M{flux/1e-5:.1f}"
            elif flux >= 1e-6: cls = f"C{flux/1e-6:.1f}"
            elif flux >= 1e-7: cls = f"B{flux/1e-7:.1f}"
            else: cls = f"A{flux/1e-8:.1f}"
            result = {"time_tag": latest.get("time_tag"), "flux": flux, "flare_class": cls, "satellite": latest.get("satellite")}
            _cache[cache_key] = (now, result)
            return result
    except Exception as e:
        print(f"GOES X-Ray Error: {e}")
    return {"time_tag": None, "flux": None, "flare_class": "Bilinmiyor", "satellite": None}
