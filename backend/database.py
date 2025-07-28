import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timedelta
import logging
from typing import Optional, Dict, Any
import os
from auth_models import SUBSCRIPTION_PLANS

logger = logging.getLogger(__name__)

# Initialize Firestore
try:
    # Try to use default credentials (for Cloud Run)
    firebase_admin.initialize_app()
    logger.info("Firebase initialized with default credentials")
except ValueError:
    # If already initialized, skip
    logger.info("Firebase already initialized")

# Connect to Firestore
db = firestore.client()

class FirestoreService:
    def __init__(self):
        # Use the default database collections
        self.users_collection = db.collection('users')
        self.sessions_collection = db.collection('sessions')
        self.credit_usage_collection = db.collection('credit_usage')
        
        # In-memory cache for frequently accessed user data (reduces Firestore reads)
        self._user_cache = {}
        self._cache_ttl = 300  # 5 minutes cache TTL
        
    def _get_cache_key(self, user_id: str) -> str:
        """Generate cache key for user data"""
        return f"user_{user_id}"
        
    def _is_cache_valid(self, cache_entry: Dict) -> bool:
        """Check if cache entry is still valid"""
        if not cache_entry:
            return False
        return (datetime.utcnow() - cache_entry['timestamp']).total_seconds() < self._cache_ttl
        
    def _cache_user(self, user_id: str, user_data: Dict):
        """Cache user data to reduce Firestore reads"""
        self._user_cache[self._get_cache_key(user_id)] = {
            'data': user_data,
            'timestamp': datetime.utcnow()
        }
        
    def _get_cached_user(self, user_id: str) -> Optional[Dict]:
        """Get user data from cache if valid"""
        cache_key = self._get_cache_key(user_id)
        cache_entry = self._user_cache.get(cache_key)
        
        if self._is_cache_valid(cache_entry):
            return cache_entry['data']
        elif cache_entry:
            # Remove expired cache entry
            del self._user_cache[cache_key]
        return None
        
    def _invalidate_user_cache(self, user_id: str):
        """Invalidate user cache when data changes"""
        cache_key = self._get_cache_key(user_id)
        if cache_key in self._user_cache:
            del self._user_cache[cache_key]
    
    async def create_user(self, email: str, password_hash: str) -> str:
        """Create a new user in Firestore"""
        try:
            # Check if user already exists
            existing_user = self.users_collection.where('email', '==', email).limit(1).get()
            if existing_user:
                raise ValueError("User with this email already exists")
            
            # Get free plan limits
            free_plan = SUBSCRIPTION_PLANS["free"]
            
            # Create user document
            user_data = {
                'email': email,
                'password_hash': password_hash,
                'created_at': datetime.utcnow(),
                'subscription_plan': 'free',
                'basic_credits_used': 0,
                'basic_credits_limit': free_plan['basic_credits_limit'],
                'premium_credits_used': 0.0,
                'premium_credits_limit': float(free_plan['premium_credits_limit']),
                'last_credit_usage': None,
                'monthly_reset_date': datetime.utcnow().replace(day=1)  # Reset on 1st of each month
            }
            
            doc_ref = self.users_collection.add(user_data)
            logger.info(f"User created: {email}")
            return doc_ref[1].id
            
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            raise
    
    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        try:
            users = self.users_collection.where('email', '==', email).limit(1).get()
            for user in users:
                user_data = user.to_dict()
                user_data['id'] = user.id
                return user_data
            return None
        except Exception as e:
            logger.error(f"Error getting user by email: {e}")
            return None
    
    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID with caching to reduce Firestore reads"""
        try:
            # Check cache first
            cached_user = self._get_cached_user(user_id)
            if cached_user:
                logger.debug(f"User {user_id} retrieved from cache")
                return cached_user
            
            # Fetch from Firestore if not in cache
            user_doc = self.users_collection.document(user_id).get()
            if user_doc.exists:
                user_data = user_doc.to_dict()
                user_data['id'] = user_doc.id
                
                # Cache the user data
                self._cache_user(user_id, user_data)
                logger.debug(f"User {user_id} fetched from Firestore and cached")
                return user_data
            return None
        except Exception as e:
            logger.error(f"Error getting user by ID: {e}")
            return None
    
    async def create_session(self, user_id: str, token_hash: str, expires_at: datetime) -> str:
        """Create a new session"""
        try:
            session_data = {
                'user_id': user_id,
                'token_hash': token_hash,
                'expires_at': expires_at,
                'created_at': datetime.utcnow()
            }
            
            doc_ref = self.sessions_collection.add(session_data)
            logger.info(f"Session created for user: {user_id}")
            return doc_ref[1].id
            
        except Exception as e:
            logger.error(f"Error creating session: {e}")
            raise
    
    async def get_session(self, token_hash: str) -> Optional[Dict[str, Any]]:
        """Get session by token hash"""
        try:
            sessions = self.sessions_collection.where('token_hash', '==', token_hash).limit(1).get()
            for session in sessions:
                session_data = session.to_dict()
                session_data['id'] = session.id
                return session_data
            return None
        except Exception as e:
            logger.error(f"Error getting session: {e}")
            return None
    
    async def delete_session(self, token_hash: str) -> bool:
        """Delete session by token hash"""
        try:
            sessions = self.sessions_collection.where('token_hash', '==', token_hash).limit(1).get()
            for session in sessions:
                session.reference.delete()
                logger.info(f"Session deleted: {token_hash[:8]}...")
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting session: {e}")
            return False
    
    async def cleanup_expired_sessions(self) -> int:
        """Clean up expired sessions with batch operations for efficiency"""
        try:
            # Use batch operations to reduce Firestore costs
            batch = db.batch()
            count = 0
            
            # Get expired sessions with limit to avoid memory issues
            expired_sessions = self.sessions_collection.where('expires_at', '<', datetime.utcnow()).limit(100).get()
            
            for session in expired_sessions:
                batch.delete(session.reference)
                count += 1
                
                # Commit batch every 50 operations to avoid hitting limits
                if count % 50 == 0:
                    batch.commit()
                    batch = db.batch()
            
            # Commit remaining operations
            if count % 50 != 0:
                batch.commit()
            
            if count > 0:
                logger.info(f"Cleaned up {count} expired sessions using batch operations")
            return count
        except Exception as e:
            logger.error(f"Error cleaning up sessions: {e}")
            return 0
    
    async def check_and_reset_monthly_credits(self, user_id: str) -> bool:
        """Check if monthly credits need to be reset and reset them if needed"""
        try:
            user = await self.get_user_by_id(user_id)
            if not user:
                return False
            
            current_date = datetime.utcnow()
            last_reset = user.get('monthly_reset_date', current_date)
            
            # If it's a new month, reset credits
            if current_date.month != last_reset.month or current_date.year != last_reset.year:
                user_ref = self.users_collection.document(user_id)
                user_ref.update({
                    'basic_credits_used': 0,
                    'premium_credits_used': 0,
                    'monthly_reset_date': current_date.replace(day=1)
                })
                logger.info(f"Monthly credits reset for user: {user_id}")
                return True
            
            return False
        except Exception as e:
            logger.error(f"Error checking/resetting monthly credits: {e}")
            return False
    
    async def consume_basic_credits(self, user_id: str, credits_to_use: int = 1) -> bool:
        """Consume basic naming credits (uses pubchem library) with optimized updates"""
        try:
            # Check and reset monthly credits if needed
            await self.check_and_reset_monthly_credits(user_id)
            
            user = await self.get_user_by_id(user_id)
            if not user:
                return False
            
            current_used = user.get('basic_credits_used', 0)
            credit_limit = user.get('basic_credits_limit', 0)
            
            if current_used + credits_to_use > credit_limit:
                logger.warning(f"User {user_id} exceeded basic credit limit")
                return False
            
            # Update user's basic credits with atomic increment (reduces read-before-write)
            user_ref = self.users_collection.document(user_id)
            user_ref.update({
                'basic_credits_used': firestore.Increment(credits_to_use),
                'last_credit_usage': datetime.utcnow()
            })
            
            # Invalidate cache since user data changed
            self._invalidate_user_cache(user_id)
            
            return True
        except Exception as e:
            logger.error(f"Error consuming basic credits: {e}")
            return False
    
    async def consume_premium_credits(self, user_id: str, compute_seconds: float) -> bool:
        """Consume premium naming credits (uses STOUT V2 model)
        Each premium credit = 10 seconds of compute time with optimized updates"""
        try:
            # Check and reset monthly credits if needed
            await self.check_and_reset_monthly_credits(user_id)
            
            user = await self.get_user_by_id(user_id)
            if not user:
                return False
            
            # Calculate credits needed (each credit = 10 seconds, decimal values allowed)
            credits_needed = compute_seconds / 10
            
            current_used = user.get('premium_credits_used', 0)
            credit_limit = user.get('premium_credits_limit', 0)
            
            if current_used + credits_needed > credit_limit:
                logger.warning(f"User {user_id} exceeded premium credit limit")
                return False
            
            # Update user's premium credits with atomic increment (reduces read-before-write)
            user_ref = self.users_collection.document(user_id)
            user_ref.update({
                'premium_credits_used': firestore.Increment(credits_needed),
                'last_credit_usage': datetime.utcnow()
            })
            
            # Invalidate cache since user data changed
            self._invalidate_user_cache(user_id)
            
            return True
        except Exception as e:
            logger.error(f"Error consuming premium credits: {e}")
            return False
    
    async def log_credit_usage(self, user_id: str, credit_type: str, credits_used: float, 
                              smiles: str, result: str, compute_time: Optional[float] = None):
        """Log credit usage for analytics with sampling to reduce storage costs"""
        try:
            # Only log 10% of usage for cost optimization (still provides good analytics)
            import random
            if random.random() > 0.1:  # 90% of requests skip logging
                return
                
            # Truncate long SMILES and results to reduce storage
            truncated_smiles = smiles[:100] if len(smiles) > 100 else smiles
            truncated_result = result[:200] if len(result) > 200 else result
            
            credit_usage_data = {
                'user_id': user_id,
                'credit_type': credit_type,
                'credits_used': credits_used,
                'smiles': truncated_smiles,
                'result': truncated_result,
                'compute_time': compute_time,
                'timestamp': datetime.utcnow()
            }
            
            self.credit_usage_collection.add(credit_usage_data)
        except Exception as e:
            logger.error(f"Error logging credit usage: {e}")
    
    async def get_user_credit_usage(self, user_id: str) -> Dict[str, Any]:
        """Get user's credit usage statistics"""
        try:
            # Check and reset monthly credits if needed
            await self.check_and_reset_monthly_credits(user_id)
            
            user = await self.get_user_by_id(user_id)
            if not user:
                return {}
            
            return {
                'basic_credits_used': user.get('basic_credits_used', 0),
                'basic_credits_limit': user.get('basic_credits_limit', 0),
                'premium_credits_used': user.get('premium_credits_used', 0),
                'premium_credits_limit': user.get('premium_credits_limit', 0),
                'subscription_plan': user.get('subscription_plan', 'free'),
                'last_credit_usage': user.get('last_credit_usage'),
                'monthly_reset_date': user.get('monthly_reset_date')
            }
        except Exception as e:
            logger.error(f"Error getting user credit usage: {e}")
            return {}
    
    async def update_user_subscription(self, user_id: str, new_plan: str) -> bool:
        """Update user's subscription plan and credit limits"""
        try:
            if new_plan not in SUBSCRIPTION_PLANS:
                raise ValueError(f"Invalid subscription plan: {new_plan}")
            
            plan_config = SUBSCRIPTION_PLANS[new_plan]
            
            user_ref = self.users_collection.document(user_id)
            user_ref.update({
                'subscription_plan': new_plan,
                'basic_credits_limit': plan_config['basic_credits_limit'],
                'premium_credits_limit': plan_config['premium_credits_limit']
            })
            
            logger.info(f"User {user_id} subscription updated to {new_plan}")
            return True
        except Exception as e:
            logger.error(f"Error updating user subscription: {e}")
            return False

    async def reset_user_credits(self, user_id: str) -> bool:
        """Reset user's credit usage to 0"""
        try:
            user_ref = self.users_collection.document(user_id)
            user_ref.update({
                'basic_credits_used': 0,
                'premium_credits_used': 0.0,
                'last_credit_usage': datetime.utcnow()
            })
            
            # Invalidate cache since user data changed
            self._invalidate_user_cache(user_id)
            
            logger.info(f"User {user_id} credits reset to 0")
            return True
        except Exception as e:
            logger.error(f"Error resetting user credits: {e}")
            return False

# Global database service instance
db_service = FirestoreService() 