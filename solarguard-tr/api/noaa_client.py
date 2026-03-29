"""
SolarGuard-TR NOAA Client
=========================
Client for NOAA SWPC (Space Weather Prediction Center) APIs
"""
import logging
import math
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone

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