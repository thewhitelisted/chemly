from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    subscription_plan: str
    api_calls_used: int
    api_calls_limit: int
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int

class TokenData(BaseModel):
    user_id: Optional[str] = None

class SubscriptionPlan(BaseModel):
    plan: str
    api_calls_limit: int
    price_per_month: float

class ApiUsage(BaseModel):
    user_id: str
    smiles: str
    result: str
    response_time: float
    timestamp: datetime 