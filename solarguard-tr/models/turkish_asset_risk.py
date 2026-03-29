"""
SolarGuard-TR — Turkish Asset Risk Scoring Engine
==================================================
The UNIQUE differentiator: maps model output → per-asset risk for
Türksat-5A/5B, GÖKTÜRK-1/2, BİLSAT-1, TEDAŞ grid hubs, and TÜBİTAK station.

Risk models:
  LEO → atmospheric drag increase during geomagnetic storms
  GEO → surface charging from high-energy electrons (SEP / X-class flares)
  Grid → geomagnetically induced currents (GIC) at Turkey's latitude (~37-42°N)
"""

import numpy as np
from datetime import datetime, timezone
from typing import Dict, Any

# ──────────────────────────────────────────────────────────────────────────────
# Turkish satellite constellation (public orbital parameters)
# ──────────────────────────────────────────────────────────────────────────────
TURKISH_SATELLITES = {
    "Türksat-5A": {
        "orbit_type": "GEO",
        "altitude_km": 35_786,
        "longitude_deg": 31.0,
        "operator": "Türksat AŞ",
        "services": ["DTH", "broadband", "government_comms"],
        "criticality": 0.95,
    },
    "Türksat-5B": {
        "orbit_type": "GEO",
        "altitude_km": 35_786,
        "longitude_deg": 42.0,
        "operator": "Türksat AŞ",
        "services": ["DTH", "broadband", "military"],
        "criticality": 0.98,
    },
    "GÖKTÜRK-1": {
        "orbit_type": "LEO",
        "altitude_km": 685,
        "inclination_deg": 98.1,
        "operator": "Havelsan / MSB",
        "services": ["EO_military_reconnaissance"],
        "criticality": 0.92,
    },
    "GÖKTÜRK-2": {
        "orbit_type": "LEO",
        "altitude_km": 529,
        "inclination_deg": 97.6,
        "operator": "TÜBİTAK UZAY",
        "services": ["EO_civilian"],
        "criticality": 0.75,
    },
    "BİLSAT-1": {
        "orbit_type": "LEO",
        "altitude_km": 686,
        "inclination_deg": 98.1,
        "operator": "TÜBİTAK UZAY",
        "services": ["EO_multispectral"],
        "criticality": 0.55,
    },
}

# ──────────────────────────────────────────────────────────────────────────────
# Turkish ground infrastructure
# ──────────────────────────────────────────────────────────────────────────────
TURKISH_GROUND_ASSETS = {
    "TEDAŞ İstanbul Hub": {
        "lat": 41.3000, "lon": 28.6000,
        "criticality": 0.99, "type": "power_grid",
    },
    "TEDAŞ Ankara Hub": {
        "lat": 39.9208, "lon": 32.8541,
        "criticality": 0.97, "type": "power_grid",
    },
    "TEDAŞ İzmir Hub": {
        "lat": 38.4192, "lon": 27.1287,
        "criticality": 0.90, "type": "power_grid",
    },
    "Türksat Gölbaşı TT&C": {
        "lat": 39.5000, "lon": 32.8028,
        "criticality": 1.0, "type": "satellite_control",
    },
    "TÜBİTAK Ankara İstasyonu": {
        "lat": 40.1000, "lon": 32.6000,
        "criticality": 0.85, "type": "research_station",
    },
}


# ──────────────────────────────────────────────────────────────────────────────
# Risk calculators
# ──────────────────────────────────────────────────────────────────────────────

def calculate_leo_drag_risk(altitude_km: float, kp_forecast: float) -> float:
    """
    During strong storms the thermosphere heats & expands → more drag on LEO sats.
    Lower orbits suffer exponentially more.
    """
    if kp_forecast <= 3:
        drag_mult = 1.0
    elif kp_forecast <= 5:
        drag_mult = 1.0 + (kp_forecast - 3) * 0.15
    elif kp_forecast <= 7:
        drag_mult = 1.3 + (kp_forecast - 5) * 0.30
    else:
        drag_mult = 1.9 + (kp_forecast - 7) * 0.50

    alt_factor = np.exp(-(altitude_km - 400) / 200)
    return float(min(1.0, drag_mult * alt_factor * 0.3))


def calculate_geo_surface_charging_risk(
    flr_class_numeric: float,
    kp_forecast: float,
) -> float:
    """
    GEO satellites face surface charging from energetic electrons.
    Risk peaks during X-class flares with associated SEP events.
    """
    if flr_class_numeric >= 4.0:
        xray = 0.8 + (flr_class_numeric - 4.0) * 0.1
    elif flr_class_numeric >= 3.0:
        xray = 0.4 + (flr_class_numeric - 3.0) * 0.4
    else:
        xray = flr_class_numeric / 10.0

    kp_risk = min(1.0, kp_forecast / 9.0)
    return float(min(1.0, 0.6 * xray + 0.4 * kp_risk))


def calculate_grid_risk(kp_forecast: float) -> float:
    """
    GIC risk for Turkish power grid (mid-latitude ~37-42°N).
    Simplified: dangerous above Kp ≈ 6.
    """
    if kp_forecast < 5:
        return 0.05
    elif kp_forecast < 6:
        return 0.20
    elif kp_forecast < 7:
        return 0.45
    elif kp_forecast < 8:
        return 0.70
    return 0.90


def _alert_level(score: float) -> str:
    if score > 0.7:
        return "RED"
    if score > 0.4:
        return "ORANGE"
    if score > 0.2:
        return "YELLOW"
    return "GREEN"


# ──────────────────────────────────────────────────────────────────────────────
# Master risk report generator — returns JSON-serialisable dict
# ──────────────────────────────────────────────────────────────────────────────

def generate_turkish_risk_report(
    kp_forecast_24h: float,
    flr_class_forecast: float,
    prob_mx_event: float,
) -> dict:
    """
    Call with model output → get full risk report for frontend.
    """
    report: Dict[str, Any] = {
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "input_forecasts": {
            "kp_24h": round(float(kp_forecast_24h), 2),
            "max_flare_class_numeric": round(float(flr_class_forecast), 2),
            "prob_mx_event": round(float(prob_mx_event), 3),
        },
        "satellite_risks": {},
        "ground_risks": {},
        "composite_alert_level": None,
        "recommended_actions": [],
    }

    # ── Satellites ──
    for name, info in TURKISH_SATELLITES.items():
        if str(info["orbit_type"]) == "LEO":
            risk = calculate_leo_drag_risk(float(str(info["altitude_km"])), kp_forecast_24h)
            risk_type = "atmospheric_drag"
        else:
            risk = calculate_geo_surface_charging_risk(flr_class_forecast, kp_forecast_24h)
            risk_type = "surface_charging"

        weighted = risk * float(str(info["criticality"]))
        report["satellite_risks"][name] = {
            "risk_score": round(weighted, 3),
            "risk_type": risk_type,
            "orbit_type": str(info["orbit_type"]),
            "altitude_km": float(str(info["altitude_km"])),
            "services_affected": info["services"],
            "alert_level": _alert_level(weighted),
        }

    # ── Ground assets ──
    for name, info in TURKISH_GROUND_ASSETS.items():
        grid = calculate_grid_risk(kp_forecast_24h)
        weighted = grid * float(str(info["criticality"]))
        report["ground_risks"][name] = {
            "risk_score": round(weighted, 3),
            "lat": float(str(info["lat"])),
            "lon": float(str(info["lon"])),
            "type": str(info["type"]),
            "alert_level": _alert_level(weighted),
        }

    # ── Composite ──
    all_scores = [v["risk_score"] for v in report["satellite_risks"].values()]
    all_scores += [v["risk_score"] for v in report["ground_risks"].values()]
    mx = max(all_scores) if all_scores else 0.0

    if mx > 0.7:
        report["composite_alert_level"] = "RED"
        report["recommended_actions"] = [
            "GEO uyduları için güvenli mod aktivasyonu",
            "TEDAŞ ile yük dengeleme hazırlığı başlatılsın",
            "Türksat operasyon merkezi bilgilendirilsin",
            "Havacılık GPS doğruluk uyarısı yayınlansın",
        ]
    elif mx > 0.4:
        report["composite_alert_level"] = "ORANGE"
        report["recommended_actions"] = [
            "Uydu güvenli mod prosedürleri hazırlansın",
            "TEDAŞ trafo okumalarını izleyin",
            "Uydu telemetri yoklama aralığını artırın",
        ]
    elif mx > 0.2:
        report["composite_alert_level"] = "YELLOW"
        report["recommended_actions"] = [
            "Uzay havası sürekli izlensin",
            "Uydu manevra takvimlerini gözden geçirin",
        ]
    else:
        report["composite_alert_level"] = "GREEN"
        report["recommended_actions"] = ["Normal operasyon"]

    return report
