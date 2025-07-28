import time
import logging
from typing import Dict, Tuple, List
from collections import defaultdict
from config import security_config

logger = logging.getLogger(__name__)

class RateLimiter:
    """Simple in-memory rate limiter for API protection"""
    
    def __init__(self):
        self.requests = defaultdict(list)
        self.auth_requests = defaultdict(list)
        
    def _clean_old_requests(self, requests_list: list, window_seconds: int):
        """Remove requests older than the time window"""
        current_time = time.time()
        return [req_time for req_time in requests_list if current_time - req_time < window_seconds]
    
    def is_allowed(self, identifier: str, max_requests: int, window_seconds: int = 60) -> bool:
        """Check if request is allowed based on rate limit"""
        current_time = time.time()
        
        # Clean old requests
        self.requests[identifier] = self._clean_old_requests(self.requests[identifier], window_seconds)
        
        # Check if limit exceeded
        if len(self.requests[identifier]) >= max_requests:
            logger.warning(f"Rate limit exceeded for {identifier}")
            return False
        
        # Add current request
        self.requests[identifier].append(current_time)
        return True
    
    def is_auth_allowed(self, identifier: str) -> bool:
        """Check if authentication request is allowed (stricter limits)"""
        return self.is_allowed(
            identifier, 
            security_config.RATE_LIMIT_AUTH_REQUESTS_PER_MINUTE, 
            60
        )
    
    def is_api_allowed(self, identifier: str) -> bool:
        """Check if API request is allowed"""
        return self.is_allowed(
            identifier, 
            security_config.RATE_LIMIT_REQUESTS_PER_MINUTE, 
            60
        )

# Global rate limiter instance
rate_limiter = RateLimiter() 