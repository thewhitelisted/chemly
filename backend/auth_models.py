from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"
    MODERATOR = "moderator"

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    role: UserRole
    subscription_plan: str
    basic_credits_used: int
    basic_credits_limit: int
    premium_credits_used: float  # Decimal values for premium credits
    premium_credits_limit: float  # Decimal values for premium credits
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int

class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[UserRole] = None

class SubscriptionPlan(BaseModel):
    plan: str
    basic_credits_limit: int
    premium_credits_limit: int
    price_per_month: float

class CreditUsage(BaseModel):
    user_id: str
    credit_type: str  # "basic" or "premium"
    credits_used: float
    smiles: str
    result: str
    compute_time: Optional[float] = None  # For premium credits
    timestamp: datetime

# Pricing tier definitions matching Pricing.tsx
SUBSCRIPTION_PLANS = {
    "free": {
        "basic_credits_limit": 200,
        "premium_credits_limit": 35,
        "price_per_month": 0.0
    },
    "pro": {
        "basic_credits_limit": 1000,
        "premium_credits_limit": 750,
        "price_per_month": 5.50
    },
    "premium": {
        "basic_credits_limit": 2000,
        "premium_credits_limit": 1500,
        "price_per_month": 8.50
    }
} 