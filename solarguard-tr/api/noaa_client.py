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
        """
        Get data from cache or fetch from NOAA API
        
        Args:
            endpoint: API endpoint path
            cache_key: Optional custom cache key
            
        Returns:
            JSON data or None on failure
        """
        if cache_key is None:
            cache_key = f"noaa_{endpoint}"
        
        # Try cache first
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            logger.debug(f"Using cached data for {endpoint}")
            return cached_data
        
        # Fetch from API
        url = f"{self.base_url}/{endpoint}"
        try:
            data = http_client.get(url)
            if data is not None:
                cache.set(cache_key, data, config.NOAA_CACHE_TTL)
                logger.info(f"Fetched and cached {endpoint}")
            return data
        except HTTPClientError as e:
            logger.error(f"Failed to fetch {endpoint}: {e}")
            return None
    
    def get_kp_index(self) -> Optional[List[List]]:
        """
        Get planetary K-index data
        
        Returns:
            List of [timestamp, kp_value] pairs
        """
        data = self._get_cached_or_fetch("products/noaa-planetary-k-index.json")
        return data if isinstance(data, list) else None
    
    def get_kp_forecast(self) -> Optional[List[List]]:
        """
        Get K-index forecast
        
        Returns:
            List of forecast data rows
        """
        data = self._get_cached_or_fetch("products/noaa-planetary-k-index-forecast.json")
        return data if isinstance(data, list) else None
    
    def get_solar_wind_plasma(self) -> Optional[List[Dict[str, Any]]]:
        """
        Get DSCOVR solar wind plasma data
        
        Returns:
            List of plasma measurements
        """
        # Try multiple possible endpoints
        endpoints = [
            "json/dscovr/dscovr_plasma_1m.json",  # 1-minute data
            "json/dscovr/dscovr_plasma_1s.json",  # 1-second data (old)
            "json/dscovr/dscovr_plasma.json"      # generic endpoint
        ]
        
        for endpoint in endpoints:
            data = self._get_cached_or_fetch(endpoint)
            if data and isinstance(data, list):
                return data
        
        logger.warning("All DSCOVR plasma endpoints failed")
        return None
    
    def get_solar_wind_magnetic(self) -> Optional[List[Dict[str, Any]]]:
        """
        Get DSCOVR solar wind magnetic field data
        
        Returns:
            List of magnetic field measurements
        """
        data = self._get_cached_or_fetch("json/dscovr/dscovr_mag_1s.json")
        return data if isinstance(data, list) else None
    
    def get_current_kp(self) -> Optional[float]:
        """
        Get current Kp index value
        
        Returns:
            Current Kp value or None
        """
        kp_data = self.get_kp_index()
        if kp_data and len(kp_data) > 1:
            try:
                return float(kp_data[-1][1])
            except (IndexError, ValueError, TypeError):
                pass
        return None
    
    def get_current_solar_wind(self) -> Optional[float]:
        """
        Get current solar wind speed
        
        Returns:
            Solar wind speed in km/s or None
        """
        plasma_data = self.get_solar_wind_plasma()
        if plasma_data:
            for measurement in reversed(plasma_data):
                if measurement.get("speed") is not None:
                    try:
                        return float(measurement["speed"])
                    except (ValueError, TypeError):
                        continue
        return None
    
    def get_current_density(self) -> Optional[float]:
        """
        Get current proton density
        
        Returns:
            Proton density in p/cm³ or None
        """
        plasma_data = self.get_solar_wind_plasma()
        if plasma_data:
            for measurement in reversed(plasma_data):
                if measurement.get("density") is not None:
                    try:
                        return float(measurement["density"])
                    except (ValueError, TypeError):
                        continue
        return None
    
    def get_current_bz(self) -> Optional[float]:
        """
        Get current Bz GSM value
        
        Returns:
            Bz GSM value in nT or None
        """
        mag_data = self.get_solar_wind_magnetic()
        if mag_data:
            for measurement in reversed(mag_data):
                if measurement.get("bz_gsm") is not None:
                    try:
                        return float(measurement["bz_gsm"])
                    except (ValueError, TypeError):
                        continue
        return None
    
    def get_realtime_telemetry(self) -> Dict[str, Optional[float]]:
        """
        Get all realtime telemetry values
        
        Returns:
            Dictionary with solar_wind_speed, proton_density, and bz_gsm
        """
        return {
            "solar_wind_speed": self.get_current_solar_wind(),
            "proton_density": self.get_current_density(),
            "bz_gsm": self.get_current_bz()
        }
    
    async def get_latest_xray_flux(self) -> Optional[Dict[str, Any]]:
        """
        Get latest NOAA GOES X-Ray Flux data and classify it
        
        Returns:
            Dictionary with time_tag, flux, flare_class, and satellite
        """
        url = "https://services.swpc.noaa.gov/json/goes/primary/xrays-1-day.json"
        try:
            data = await self.fetch_json(url)
            
            # Filter for 0.1-0.8nm band (Long channel)
            long_channel = [d for d in data if d.get('energy') == '0.1-0.8nm']
            if not long_channel:
                logger.warning("No long channel data found in X-Ray flux")
                return None
            
            # Get the latest measurement
            latest = long_channel[-1]
            flux = latest.get('flux', 0)
            
            # Convert flux value to class (X, M, C, B, A)
            if flux <= 0:
                return {"class": "N/A", "value": 0}
            
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
        """
        Get latest GOES X-Ray Flux data with 2-minute cache
        
        Returns:
            Dictionary with time_tag, flux, flare_class, and satellite
        """
        cache_key = "goes_xray_flux"
        
        # Try cache first
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            logger.debug("Using cached GOES X-Ray flux data")
            return cached_data
        
        url = "https://services.swpc.noaa.gov/json/goes/primary/xrays-1-day.json"
        try:
            data = await self.fetch_json(url)
            
            if not data or not isinstance(data, list):
                logger.warning("Invalid GOES X-Ray flux data")
                return None
            
            # Filter for 0.1-0.8nm band (Long channel)
            long_channel = [d for d in data if d.get('energy') == '0.1-0.8nm']
            if not long_channel:
                logger.warning("No long channel data found in GOES X-Ray flux")
                return None
            
            # Get the latest measurement
            latest = long_channel[-1]
            flux = latest.get('flux', 0)
            
            # Convert flux to flare class
            # >= 1e-4 → X
            # >= 1e-5 → M
            # >= 1e-6 → C
            # >= 1e-7 → B
            # < 1e-7 → A
            if flux >= 1e-4:
                class_letter = "X"
                class_value = round(flux / 1e-4, 1)
            elif flux >= 1e-5:
                class_letter = "M"
                class_value = round(flux / 1e-5, 1)
            elif flux >= 1e-6:
                class_letter = "C"
                class_value = round(flux / 1e-6, 1)
            elif flux >= 1e-7:
                class_letter = "B"
                class_value = round(flux / 1e-7, 1)
            else:
                class_letter = "A"
                class_value = round(flux / 1e-8, 1)
            
            flare_class = f"{class_letter}{class_value}"
            
            result = {
                "time_tag": latest.get('time_tag'),
                "flux": flux,
                "flare_class": flare_class,
                "satellite": latest.get('satellite')
            }
            
            # Cache with 2-minute TTL
            from datetime import timedelta
            cache.set(cache_key, result, timedelta(minutes=2))
            logger.info(f"Fetched and cached GOES X-Ray flux: {flare_class}")
            
            return result
        except Exception as e:
            logger.error(f"GOES X-Ray flux error: {e}")
            return None
    
    async def fetch_json(self, url: str) -> Optional[List[Dict[str, Any]]]:
        """
        Fetch JSON data from URL (async wrapper for http_client)
        
        Args:
            url: URL to fetch from
            
        Returns:
            JSON data or None on failure
        """
        try:
            data = http_client.get(url)
            return data if isinstance(data, list) else None
        except Exception as e:
            logger.error(f"Failed to fetch JSON from {url}: {e}")
            return None
    
    def get_solar_wind_data(self) -> Dict[str, Optional[float]]:
        """
        Get solar wind speed and density data
        
        Returns:
            Dictionary with speed and density
        """
        return {
            "speed": self.get_current_solar_wind(),
            "density": self.get_current_density()
        }
    
    def get_mag_field_data(self) -> Dict[str, Optional[float]]:
        """
        Get magnetic field data (Bz)
        
        Returns:
            Dictionary with bz value
        """
        return {
            "bz": self.get_current_bz()
        }
    
    def get_proton_flux(self) -> Dict[str, Optional[float]]:
        """
        Get proton flux data (currently returns density as proxy)
        
        Returns:
            Dictionary with flux value
        """
        return {
            "flux": self.get_current_density()
        }
    
    def get_realtime_kp(self) -> Dict[str, Optional[float]]:
        """
        Get realtime Kp index
        
        Returns:
            Dictionary with kp value
        """
        return {
            "kp": self.get_current_kp()
        }


# Global NOAA client instance
noaa_client = NOAAClient()