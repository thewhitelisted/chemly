from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import StreamingResponse
import logging

logger = logging.getLogger(__name__)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses"""
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # Content Security Policy
        csp_policy = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self'; "
            "connect-src 'self' https://api.orgolab.ca; "
            "frame-ancestors 'none';"
        )
        response.headers["Content-Security-Policy"] = csp_policy
        
        # HSTS (HTTP Strict Transport Security) - only in production
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        return response

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log security-relevant request information"""
    
    async def dispatch(self, request: Request, call_next):
        # Log suspicious requests
        client_ip = request.client.host
        user_agent = request.headers.get("user-agent", "")
        
        # Log potential security issues
        if "sqlmap" in user_agent.lower() or "nmap" in user_agent.lower():
            logger.warning(f"Potential security scan detected from {client_ip}: {user_agent}")
        
        # Log authentication attempts
        if request.url.path in ["/auth/login", "/auth/register"]:
            logger.info(f"Authentication attempt from {client_ip}")
        
        response = await call_next(request)
        
        # Log failed authentication attempts
        if request.url.path in ["/auth/login", "/auth/register"] and response.status_code in [401, 429]:
            logger.warning(f"Failed authentication attempt from {client_ip}")
        
        return response 