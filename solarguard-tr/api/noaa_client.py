"""
SolarGuard-TR NOAA Client
=========================
Client for NOAA SWPC (Space Weather Prediction Center) APIs
"""
import logging
import math
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import numpy as np

from .config import config
from .http_client import http_client, HTTPClientError
from .cache_manager import cache

logger = logging.getLogger(__name__)


class NOAAClient:
    """Client for NOAA SWPC APIs"""
    
    def __init__(self):
        self.base_url = config.NOAA_BASE
    
    def _get_cached_or_fetch(
        self,
        endpoint: str,
        cache_key: Optional[str] = None
    ) -> Optional[Any]:
        """Get data from cache or fetch from NOAA API"""
        if cache_key is None:
            cache_key = f"noaa_{endpoint}"
        
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data
        
        url = f"{self.base_url}/{endpoint}"
        try:
            data = http_client.get(url)
            if data is not None:
                cache.set(cache_key, data, config.NOAA_CACHE_TTL)
            return data
        except HTTPClientError as e:
            logger.error(f"Failed to fetch {endpoint}: {e}")
            return None
    
    async def fetch_json(self, url: str) -> Optional[List[Dict[str, Any]]]:
        """Fetch JSON data from URL (async wrapper)"""
        try:
            data = http_client.get(url)
            return data if isinstance(data, list) else None
        except Exception as e:
            logger.error(f"Failed to fetch JSON from {url}: {e}")
            return None

    def get_kp_index(self) -> Optional[List[List]]:
        """Get planetary K-index data"""
        data = self._get_cached_or_fetch("products/noaa-planetary-k-index.json")
        return data if isinstance(data, list) else None
    
    def get_kp_forecast(self) -> Optional[List[List]]:
        """Get K-index forecast"""
        data = self._get_cached_or_fetch("products/noaa-planetary-k-index-forecast.json")
        return data if isinstance(data, list) else None
    
    def get_solar_wind_plasma(self) -> Optional[List[Dict[str, Any]]]:
        """DSCOVR Güneş Rüzgarı Plazma Verisi (Hız, Yoğunluk)"""
        data = self._get_cached_or_fetch("products/solar-wind/plasma-1-day.json")
        if data and isinstance(data, list) and len(data) > 1:
            headers = data[0]
            result = []
            for row in data[1:]:
                result.append(dict(zip(headers, row)))
            return result
        return None
    
    def get_solar_wind_magnetic(self) -> Optional[List[Dict[str, Any]]]:
        """DSCOVR Manyetik Alan Verisi (Bz)"""
        data = self._get_cached_or_fetch("products/solar-wind/mag-1-day.json")
        if data and isinstance(data, list) and len(data) > 1:
            headers = data[0]
            result = []
            for row in data[1:]:
                result.append(dict(zip(headers, row)))
            return result
        return None
    
    def get_current_kp(self) -> Optional[float]:
        """Get current Kp index value"""
        kp_data = self.get_kp_index()
        if kp_data and len(kp_data) > 1:
            try:
                return float(kp_data[-1][1])
            except (IndexError, ValueError, TypeError):
                pass
        return 0.0

    def get_latest_kp_observation(self) -> Dict[str, Any]:
        """
        Return latest observed Kp with observation timestamp.
        NOAA planetary K index is typically updated in 3-hour cadence.
        """
        kp_data = self.get_kp_index()
        if kp_data and isinstance(kp_data, list):
            for row in reversed(kp_data):
                if not isinstance(row, list) or len(row) < 2:
                    continue
                try:
                    kp_val = float(row[1])
                    time_tag = row[0]
                    return {
                        "kp_index": kp_val,
                        "observation_time_utc": time_tag,
                        "source": "NOAA SWPC planetary-k-index",
                        "cadence_minutes": 180,
                        "is_realtime_estimate": False,
                    }
                except (ValueError, TypeError):
                    continue

        return {
            "kp_index": 0.0,
            "observation_time_utc": None,
            "source": "NOAA SWPC planetary-k-index",
            "cadence_minutes": 180,
            "is_realtime_estimate": False,
        }

    def get_kp_nowcast_estimate(self) -> Dict[str, Any]:
        """
        Build a minute-level Kp nowcast estimate from latest solar wind telemetry.
        This is a heuristic operational estimate, not an official NOAA Kp observation.
        """
        kp_obs = self.get_latest_kp_observation()
        kp_base = float(kp_obs.get("kp_index") or 0.0)

        sw_speed = float(self.get_current_solar_wind() or 400.0)
        bz = float(self.get_current_bz() or 0.0)
        density = float(self.get_current_density() or 5.0)
        proton_flux = float(self.get_proton_flux().get("flux") or 0.0)

        # Normalize major drivers.
        speed_term = np.clip((sw_speed - 380.0) / 500.0, -0.4, 1.0) * 1.8
        bz_term = np.clip((-bz) / 20.0, -0.4, 1.0) * 2.1
        density_term = np.clip((density - 5.0) / 25.0, -0.3, 0.8) * 0.7
        proton_term = np.clip(np.log10(max(proton_flux, 1.0)) / 6.0, 0.0, 1.0) * 0.4

        kp_nowcast = kp_base + speed_term + bz_term + density_term + proton_term
        kp_nowcast = float(np.clip(kp_nowcast, 0.0, 9.0))

        confidence = float(
            np.clip(
                0.45
                + abs(np.clip((-bz) / 20.0, 0.0, 1.0)) * 0.25
                + np.clip((sw_speed - 380.0) / 700.0, 0.0, 1.0) * 0.20
                + np.clip((density - 5.0) / 35.0, 0.0, 1.0) * 0.10,
                0.35,
                0.95,
            )
        )

        return {
            "kp_nowcast": round(kp_nowcast, 2),
            "confidence": round(confidence, 2),
            "generated_at_utc": datetime.now(timezone.utc).isoformat(),
            "is_warning": bool(kp_nowcast > 5.0),
            "method": "telemetry_nowcast_v1",
        }
    
    def get_current_solar_wind(self) -> Optional[float]:
        """Get current solar wind speed in km/s"""
        plasma_data = self.get_solar_wind_plasma()
        if plasma_data:
            for measurement in reversed(plasma_data):
                val = measurement.get("wind_speed") or measurement.get("speed")
                if val is not None and val != 'null':
                    try:
                        return float(val)
                    except (ValueError, TypeError):
                        continue
        return 0.0
    
    def get_current_density(self) -> Optional[float]:
        """Get current proton density in p/cm³"""
        plasma_data = self.get_solar_wind_plasma()
        if plasma_data:
            for measurement in reversed(plasma_data):
                val = measurement.get("proton_density") or measurement.get("density")
                if val is not None and val != 'null':
                    try:
                        return float(val)
                    except (ValueError, TypeError):
                        continue
        return 0.0
    
    def get_current_bz(self) -> Optional[float]:
        """Get current Bz GSM value in nT"""
        mag_data = self.get_solar_wind_magnetic()
        if mag_data:
            for measurement in reversed(mag_data):
                val = measurement.get("bz_gsm")
                if val is not None and val != 'null':
                    try:
                        return float(val)
                    except (ValueError, TypeError):
                        continue
        return 0.0
    
    def get_proton_flux(self) -> Dict[str, Optional[float]]:
        """GERÇEK Proton Akısı (>10 MeV)"""
        data = self._get_cached_or_fetch("json/goes/primary/integral-protons-1-day.json")
        if data and isinstance(data, list):
            latest = data[-1]
            try:
                return {"flux": float(latest.get('flux', 0.0))}
            except (ValueError, TypeError):
                pass
        return {"flux": 0.0}

    def get_electron_flux(self) -> Dict[str, Optional[float]]:
        """GERÇEK Elektron Akısı (>2 MeV)"""
        data = self._get_cached_or_fetch("json/goes/primary/integral-electrons-1-day.json")
        if data and isinstance(data, list):
            latest = data[-1]
            try:
                return {"flux": float(latest.get('flux', 0.0))}
            except (ValueError, TypeError):
                pass
        return {"flux": 0.0}

    def get_realtime_telemetry(self) -> Dict[str, Any]:
        """Tüm paneli tek seferde besleyen ana fonksiyon"""
        return {
            "solar_wind_speed": self.get_current_solar_wind(),
            "proton_density": self.get_current_density(),
            "bz_gsm": self.get_current_bz(),
            "proton_flux": self.get_proton_flux().get("flux", 0.0),
            "electron_flux": self.get_electron_flux().get("flux", 0.0),
            "kp_index": self.get_current_kp(),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    async def get_latest_xray_flux(self) -> Optional[Dict[str, Any]]:
        """Get and classify latest X-Ray Flux data"""
        url = "https://services.swpc.noaa.gov/json/goes/primary/xrays-1-day.json"
        try:
            data = await self.fetch_json(url)
            if not data: return None
            long_channel = [d for d in data if d.get('energy') == '0.1-0.8nm']
            if not long_channel: return None
            
            latest = long_channel[-1]
            flux = latest.get('flux', 0)
            if flux <= 0: return {"class": "N/A", "value": 0}
            
            exponent = math.floor(math.log10(flux))
            base_value = round(flux / (10 ** exponent), 1)
            classes = {-4: "X", -5: "M", -6: "C", -7: "B", -8: "A"}
            flare_class = f"{classes.get(exponent, 'Q')}{base_value}"
            
            return {
                "time_tag": latest.get('time_tag'),
                "flux": flux,
                "flare_class": flare_class,
                "satellite": latest.get('satellite')
            }
        except Exception as e:
            logger.error(f"X-Ray Data Error: {e}")
            return None

    async def get_goes_xray_flux(self) -> Optional[Dict[str, Any]]:
        """GOES X-Ray Flux with 2-minute cache"""
        cache_key = "goes_xray_flux"
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data
        
        result = await self.get_latest_xray_flux()
        if result:
            from datetime import timedelta
            cache.set(cache_key, result, timedelta(minutes=2))
        return result

    def get_solar_wind_data(self) -> Dict[str, Optional[float]]:
        return {"speed": self.get_current_solar_wind(), "density": self.get_current_density()}

    def get_mag_field_data(self) -> Dict[str, Optional[float]]:
        return {"bz": self.get_current_bz()}

    def get_realtime_kp(self) -> Dict[str, Optional[float]]:
        return {"kp": self.get_current_kp()}


# Global NOAA client instance
noaa_client = NOAAClient()
