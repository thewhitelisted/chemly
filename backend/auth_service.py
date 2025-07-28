from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
import secrets
import logging
from database import db_service
from auth_models import TokenData, UserRole
from config import security_config

logger = logging.getLogger(__name__)

# Security settings - now from environment variables
SECRET_KEY = security_config.SECRET_KEY
ALGORITHM = security_config.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = security_config.JWT_EXPIRE_MINUTES

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    def __init__(self):
        self.secret_key = SECRET_KEY
        self.algorithm = ALGORITHM
        self.access_token_expire_minutes = ACCESS_TOKEN_EXPIRE_MINUTES
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    def get_password_hash(self, password: str) -> str:
        """Hash a password"""
        return pwd_context.hash(password)
    
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create a JWT access token with role information"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def verify_token(self, token: str) -> Optional[TokenData]:
        """Verify and decode a JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            user_id: str = payload.get("sub")
            role: str = payload.get("role", "user")
            if user_id is None:
                return None
            return TokenData(user_id=user_id, role=UserRole(role))
        except JWTError:
            return None
    
    async def authenticate_user(self, email: str, password: str) -> Optional[dict]:
        """Authenticate a user with email and password"""
        try:
            user = await db_service.get_user_by_email(email)
            if not user:
                return None
            
            if not self.verify_password(password, user["password_hash"]):
                return None
            
            return user
        except Exception as e:
            logger.error(f"Error authenticating user: {e}")
            return None
    
    async def create_user_session(self, user_id: str, role: str = "user") -> str:
        """Create a new session for a user with role information"""
        try:
            # Generate a unique session token
            session_token = secrets.token_urlsafe(32)
            
            # Create JWT token with role
            access_token_expires = timedelta(minutes=self.access_token_expire_minutes)
            access_token = self.create_access_token(
                data={"sub": user_id, "role": role}, expires_delta=access_token_expires
            )
            
            # Store session in database
            expires_at = datetime.utcnow() + access_token_expires
            await db_service.create_session(user_id, session_token, expires_at)
            
            return access_token
        except Exception as e:
            logger.error(f"Error creating user session: {e}")
            raise
    
    async def validate_session(self, token: str) -> Optional[dict]:
        """Validate a session token and return user data"""
        try:
            # Verify JWT token
            token_data = self.verify_token(token)
            if not token_data or not token_data.user_id:
                return None
            
            # Get user data
            user = await db_service.get_user_by_id(token_data.user_id)
            if not user:
                return None
            
            return user
        except Exception as e:
            logger.error(f"Error validating session: {e}")
            return None
    
    async def logout_user(self, token: str) -> bool:
        """Logout a user by invalidating their session"""
        try:
            # For JWT tokens, we can't actually invalidate them server-side
            # But we can log the logout for audit purposes
            token_data = self.verify_token(token)
            if token_data and token_data.user_id:
                logger.info(f"User logged out: {token_data.user_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error logging out user: {e}")
            return False

# Global auth service instance
auth_service = AuthService() 