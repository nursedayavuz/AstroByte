"""
SolarGuard-TR HTTP Client
=========================
Robust HTTP client with retry logic and error handling
"""
import requests
import time
import logging
from typing import Optional, Dict, Any

from .config import config

logger = logging.getLogger(__name__)


class HTTPClientError(Exception):
    """Custom HTTP client error"""
    pass


class HTTPClient:
    """Robust HTTP client with retry logic"""
    
    def __init__(self):
        self.session = requests.Session()
        # Configure session with reasonable defaults
        self.session.headers.update({
            'User-Agent': 'SolarGuard-TR/3.0 (Space Weather Monitoring System)'
        })
    
    def get(
        self,
        url: str,
        params: Optional[Dict[str, Any]] = None,
        timeout: Optional[float] = None,
        max_retries: Optional[int] = None
    ) -> Optional[Any]:
        """
        Perform GET request with retry logic
        
        Args:
            url: Target URL
            params: Query parameters
            timeout: Request timeout in seconds
            max_retries: Maximum number of retry attempts
            
        Returns:
            JSON response data or None on failure
        """
        if timeout is None:
            timeout = config.REQUEST_TIMEOUT
        if max_retries is None:
            max_retries = config.MAX_RETRIES
        
        last_error = None
        
        for attempt in range(max_retries):
            try:
                response = self.session.get(
                    url,
                    params=params,
                    timeout=timeout
                )
                
                if response.status_code == 200:
                    try:
                        return response.json()
                    except ValueError as e:
                        logger.error(f"Failed to parse JSON from {url}: {e}")
                        return None
                else:
                    logger.warning(
                        f"HTTP {response.status_code} from {url} "
                        f"(attempt {attempt + 1}/{max_retries})"
                    )
                    
            except requests.exceptions.Timeout as e:
                last_error = e
                logger.warning(
                    f"Timeout fetching {url} (attempt {attempt + 1}/{max_retries}): {e}"
                )
            except requests.exceptions.ConnectionError as e:
                last_error = e
                logger.warning(
                    f"Connection error fetching {url} (attempt {attempt + 1}/{max_retries}): {e}"
                )
            except requests.exceptions.RequestException as e:
                last_error = e
                logger.error(
                    f"Request error fetching {url} (attempt {attempt + 1}/{max_retries}): {e}"
                )
            except Exception as e:
                last_error = e
                logger.error(
                    f"Unexpected error fetching {url} (attempt {attempt + 1}/{max_retries}): {e}"
                )
            
            # Wait before retry (exponential backoff)
            if attempt < max_retries - 1:
                wait_time = config.RETRY_DELAY * (2 ** attempt)
                logger.debug(f"Waiting {wait_time}s before retry...")
                time.sleep(wait_time)
        
        logger.error(f"Failed to fetch {url} after {max_retries} attempts")
        if last_error:
            raise HTTPClientError(f"Failed to fetch {url}: {last_error}")
        return None
    
    def get_text(
        self,
        url: str,
        params: Optional[Dict[str, Any]] = None,
        timeout: Optional[float] = None,
        max_retries: Optional[int] = None
    ) -> Optional[str]:
        """
        Perform GET request and return text response
        
        Args:
            url: Target URL
            params: Query parameters
            timeout: Request timeout in seconds
            max_retries: Maximum number of retry attempts
            
        Returns:
            Text response or None on failure
        """
        if timeout is None:
            timeout = config.REQUEST_TIMEOUT
        if max_retries is None:
            max_retries = config.MAX_RETRIES
        
        last_error = None
        
        for attempt in range(max_retries):
            try:
                response = self.session.get(
                    url,
                    params=params,
                    timeout=timeout
                )
                
                if response.status_code == 200:
                    return response.text
                else:
                    logger.warning(
                        f"HTTP {response.status_code} from {url} "
                        f"(attempt {attempt + 1}/{max_retries})"
                    )
                    
            except requests.exceptions.Timeout as e:
                last_error = e
                logger.warning(
                    f"Timeout fetching {url} (attempt {attempt + 1}/{max_retries}): {e}"
                )
            except requests.exceptions.ConnectionError as e:
                last_error = e
                logger.warning(
                    f"Connection error fetching {url} (attempt {attempt + 1}/{max_retries}): {e}"
                )
            except requests.exceptions.RequestException as e:
                last_error = e
                logger.error(
                    f"Request error fetching {url} (attempt {attempt + 1}/{max_retries}): {e}"
                )
            except Exception as e:
                last_error = e
                logger.error(
                    f"Unexpected error fetching {url} (attempt {attempt + 1}/{max_retries}): {e}"
                )
            
            # Wait before retry
            if attempt < max_retries - 1:
                wait_time = config.RETRY_DELAY * (2 ** attempt)
                logger.debug(f"Waiting {wait_time}s before retry...")
                time.sleep(wait_time)
        
        logger.error(f"Failed to fetch {url} after {max_retries} attempts")
        if last_error:
            raise HTTPClientError(f"Failed to fetch {url}: {last_error}")
        return None
    
    def close(self):
        """Close the session"""
        self.session.close()


# Global HTTP client instance
http_client = HTTPClient()