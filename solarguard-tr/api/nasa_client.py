"""
SolarGuard-TR NASA Client
=========================
Client for NASA DONKI (Space Weather Database Of Notifications, Knowledge, Information) APIs
"""
import json
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta

from .config import config
from .http_client import http_client, HTTPClientError
from .cache_manager import cache

logger = logging.getLogger(__name__)


class NASAClient:
    """Client for NASA DONKI APIs"""
    
    def __init__(self):
        self.base_url = config.DONKI_BASE
        self.api_key = config.NASA_API_KEY
    
    def _get_cached_or_fetch(
        self,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        cache_key: Optional[str] = None
    ) -> Optional[Any]:
        """
        Get data from cache or fetch from NASA API
        
        Args:
            endpoint: API endpoint path
            params: Query parameters
            cache_key: Optional custom cache key
            
        Returns:
            JSON data or None on failure
        """
        if params is None:
            params = {}
        
        # Add API key
        params["api_key"] = self.api_key
        
        if cache_key is None:
            # Create cache key from endpoint and sorted params
            cache_key = f"nasa_{endpoint}_{json.dumps(params, sort_keys=True)}"
        
        # Try cache first
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            logger.debug(f"Using cached data for {endpoint}")
            return cached_data
        
        # Fetch from API
        url = f"{self.base_url}/{endpoint}"
        try:
            data = http_client.get(url, params=params)
            if data is not None:
                cache.set(cache_key, data, config.NASA_CACHE_TTL)
                logger.info(f"Fetched and cached {endpoint}")
            return data
        except HTTPClientError as e:
            logger.error(f"Failed to fetch {endpoint}: {e}")
            return None
    
    def get_solar_flares(
        self,
        days: int = 30
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Get solar flare data
        
        Args:
            days: Number of days to look back
            
        Returns:
            List of flare events
        """
        end = datetime.now(timezone.utc)
        start = end - timedelta(days=days)
        
        params = {
            "startDate": start.strftime('%Y-%m-%d'),
            "endDate": end.strftime('%Y-%m-%d')
        }
        
        data = self._get_cached_or_fetch("FLR", params)
        return data if isinstance(data, list) else None
    
    def get_geomagnetic_storms(
        self,
        days: int = 30
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Get geomagnetic storm data
        
        Args:
            days: Number of days to look back
            
        Returns:
            List of storm events
        """
        end = datetime.now(timezone.utc)
        start = end - timedelta(days=days)
        
        params = {
            "startDate": start.strftime('%Y-%m-%d'),
            "endDate": end.strftime('%Y-%m-%d')
        }
        
        data = self._get_cached_or_fetch("GST", params)
        return data if isinstance(data, list) else None
    
    def get_cme_events(
        self,
        days: int = 30
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Get coronal mass ejection (CME) data
        
        Args:
            days: Number of days to look back
            
        Returns:
            List of CME events
        """
        end = datetime.now(timezone.utc)
        start = end - timedelta(days=days)
        
        params = {
            "startDate": start.strftime('%Y-%m-%d'),
            "endDate": end.strftime('%Y-%m-%d')
        }
        
        data = self._get_cached_or_fetch("CME", params)
        return data if isinstance(data, list) else None
    
    def get_notifications(
        self,
        days: int = 30,
        notification_type: str = "all"
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Get DONKI notifications
        
        Args:
            days: Number of days to look back
            notification_type: Type of notification (all, FLR, CME, etc.)
            
        Returns:
            List of notifications
        """
        end = datetime.now(timezone.utc)
        start = end - timedelta(days=days)
        
        params = {
            "startDate": start.strftime('%Y-%m-%d'),
            "endDate": end.strftime('%Y-%m-%d'),
            "type": notification_type
        }
        
        data = self._get_cached_or_fetch("notifications", params)
        return data if isinstance(data, list) else None
    
    def get_interplanetary_shocks(
        self,
        days: int = 30,
        location: str = "Earth"
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Get interplanetary shock data
        
        Args:
            days: Number of days to look back
            location: Location (Earth, etc.)
            
        Returns:
            List of shock events
        """
        end = datetime.now(timezone.utc)
        start = end - timedelta(days=days)
        
        params = {
            "startDate": start.strftime('%Y-%m-%d'),
            "endDate": end.strftime('%Y-%m-%d'),
            "location": location
        }
        
        data = self._get_cached_or_fetch("IPS", params)
        return data if isinstance(data, list) else None
    
    def get_wsa_enlil_simulations(
        self,
        days: int = 15
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Get WSA-Enlil simulation data
        
        Args:
            days: Number of days to look back
            
        Returns:
            List of simulation data
        """
        end = datetime.now(timezone.utc)
        start = end - timedelta(days=days)
        
        params = {
            "startDate": start.strftime('%Y-%m-%d'),
            "endDate": end.strftime('%Y-%m-%d')
        }
        
        data = self._get_cached_or_fetch("WSAEnlilSimulations", params)
        return data if isinstance(data, list) else None
    
    def get_radiation_belt_enhancement(
        self,
        days: int = 30
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Get radiation belt enhancement data
        
        Args:
            days: Number of days to look back
            
        Returns:
            List of RBE events
        """
        end = datetime.now(timezone.utc)
        start = end - timedelta(days=days)
        
        params = {
            "startDate": start.strftime('%Y-%m-%d'),
            "endDate": end.strftime('%Y-%m-%d')
        }
        
        data = self._get_cached_or_fetch("RBE", params)
        return data if isinstance(data, list) else None


# Global NASA client instance
nasa_client = NASAClient()