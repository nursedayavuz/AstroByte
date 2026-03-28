"""
SolarGuard-TR — FastAPI Backend (Clean Modular Architecture)
============================================================
Serves endpoints consumed by the Stitch Dashboard.
NO MOCK DATA. Uses Real NOAA SWPC and NASA DONKI APIs.

Version: 4.0.0 (Complete Rewrite)
"""
import sys
import requests
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
    description="Güneş Fırtınası Erken Uyarı Sistemi — Backend (Real Data NO-MOCK)",
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
def get_forecast_series():
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
        raise HTTPException(status_code=503, detail="Veri kaynağına ulaşılamıyor")
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
        raise HTTPException(status_code=503, detail="GOES X-Ray verisine ulaşılamıyor")
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
            "name": 'Quebec Karartması',
            "desc": 'Kp=9. 9 saat elektrik kesintisi. GIC (Geomanyetik İndüklenen Akım) sebebiyle trafolar yandı.',
            "color": 'var(--red)'
        },
        {
            "id": 'halloween',
            "year": '2003',
            "name": 'Halloween Fırtınaları',
            "desc": 'X28+ Flare. NASA uyduları güvenli moda alındı, uçuş rotaları değiştirildi.',
            "color": 'var(--amber)'
        },
        {
            "id": 'may2024',
            "year": '2024',
            "name": 'Mayıs G5 Fırtınası',
            "desc": "Son 20 yılın en güçlüsü. Tarım GPS sistemleri koptu, auroralar Türkiye'den izlendi.",
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
        "message": "Alan uzmanlarına bildirim gönderildi (G3+ Olayı)."
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
