"""
SolarGuard-TR Cache Manager
============================
Thread-safe cache management with TTL support
"""
from datetime import datetime, timezone, timedelta
from typing import Any, Optional, Tuple
import threading
import logging

logger = logging.getLogger(__name__)


class CacheManager:
    """Thread-safe cache manager with TTL support"""
    
    def __init__(self):
        self._cache: dict = {}
        self._lock = threading.RLock()
    
    def get(self, key: str) -> Optional[Any]:
        """Get cached value if not expired"""
        with self._lock:
            if key not in self._cache:
                return None
            
            timestamp, value, ttl = self._cache[key]
            now = datetime.now(timezone.utc)
            
            if (now - timestamp) > ttl:
                # Expired, remove and return None
                del self._cache[key]
                logger.debug(f"Cache expired for key: {key}")
                return None
            
            logger.debug(f"Cache hit for key: {key}")
            return value
    
    def set(self, key: str, value: Any, ttl: timedelta) -> None:
        """Set cached value with TTL"""
        with self._lock:
            self._cache[key] = (datetime.now(timezone.utc), value, ttl)
            logger.debug(f"Cache set for key: {key} (TTL: {ttl})")
    
    def clear(self) -> None:
        """Clear all cached values"""
        with self._lock:
            count = len(self._cache)
            self._cache.clear()
            logger.info(f"Cleared {count} cache entries")
    
    def clear_pattern(self, pattern: str) -> int:
        """Clear cache entries matching pattern"""
        with self._lock:
            keys_to_remove = [k for k in self._cache.keys() if pattern in k]
            for key in keys_to_remove:
                del self._cache[key]
            logger.info(f"Cleared {len(keys_to_remove)} cache entries matching '{pattern}'")
            return len(keys_to_remove)
    
    def get_stats(self) -> dict:
        """Get cache statistics"""
        with self._lock:
            now = datetime.now(timezone.utc)
            valid_count = 0
            expired_count = 0
            
            for key, (timestamp, value, ttl) in self._cache.items():
                if (now - timestamp) > ttl:
                    expired_count += 1
                else:
                    valid_count += 1
            
            return {
                "total_entries": len(self._cache),
                "valid_entries": valid_count,
                "expired_entries": expired_count
            }


# Global cache instance
cache = CacheManager()