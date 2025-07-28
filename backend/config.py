import os
from typing import List
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class SecurityConfig:
    """Security configuration management"""
    
    # JWT Configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-change-this-in-production')
    JWT_ALGORITHM = os.getenv('JWT_ALGORITHM', 'HS256')
    JWT_EXPIRE_MINUTES = int(os.getenv('JWT_EXPIRE_MINUTES', '30'))
    
    # CORS Configuration
    CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', 'https://orgolab.ca,https://www.orgolab.ca').split(',')
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS_PER_MINUTE = int(os.getenv('RATE_LIMIT_REQUESTS_PER_MINUTE', '60'))
    RATE_LIMIT_AUTH_REQUESTS_PER_MINUTE = int(os.getenv('RATE_LIMIT_AUTH_REQUESTS_PER_MINUTE', '5'))
    
    # Admin Configuration
    ADMIN_EMAILS = os.getenv('ADMIN_EMAILS', 'jleechris06@gmail.com').split(',')
    
    # Environment
    ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')
    
    @classmethod
    def is_production(cls) -> bool:
        return cls.ENVIRONMENT == 'production'
    
    @classmethod
    def is_admin_email(cls, email: str) -> bool:
        return email in cls.ADMIN_EMAILS

# Global config instance
security_config = SecurityConfig() 