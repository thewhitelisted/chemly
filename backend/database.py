import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timedelta
import logging
from typing import Optional, Dict, Any
import os

logger = logging.getLogger(__name__)

# Initialize Firestore
try:
    # Try to use default credentials (for Cloud Run)
    firebase_admin.initialize_app()
    logger.info("Firebase initialized with default credentials")
except ValueError:
    # If already initialized, skip
    logger.info("Firebase already initialized")

db = firestore.client()

class FirestoreService:
    def __init__(self):
        self.users_collection = db.collection('users')
        self.sessions_collection = db.collection('sessions')
        self.api_calls_collection = db.collection('api_calls')
    
    async def create_user(self, email: str, password_hash: str) -> str:
        """Create a new user in Firestore"""
        try:
            # Check if user already exists
            existing_user = self.users_collection.where('email', '==', email).limit(1).get()
            if existing_user:
                raise ValueError("User with this email already exists")
            
            # Create user document
            user_data = {
                'email': email,
                'password_hash': password_hash,
                'created_at': datetime.utcnow(),
                'subscription_plan': 'free',
                'api_calls_used': 0,
                'api_calls_limit': 100,
                'last_api_call': None
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
        """Get user by ID"""
        try:
            user_doc = self.users_collection.document(user_id).get()
            if user_doc.exists:
                user_data = user_doc.to_dict()
                user_data['id'] = user_doc.id
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
        """Clean up expired sessions"""
        try:
            expired_sessions = self.sessions_collection.where('expires_at', '<', datetime.utcnow()).get()
            count = 0
            for session in expired_sessions:
                session.reference.delete()
                count += 1
            
            if count > 0:
                logger.info(f"Cleaned up {count} expired sessions")
            return count
        except Exception as e:
            logger.error(f"Error cleaning up sessions: {e}")
            return 0
    
    async def increment_api_calls(self, user_id: str) -> bool:
        """Increment API calls for user"""
        try:
            user_ref = self.users_collection.document(user_id)
            user_ref.update({
                'api_calls_used': firestore.Increment(1),
                'last_api_call': datetime.utcnow()
            })
            return True
        except Exception as e:
            logger.error(f"Error incrementing API calls: {e}")
            return False
    
    async def log_api_call(self, user_id: str, smiles: str, result: str, response_time: float):
        """Log API call for analytics"""
        try:
            api_call_data = {
                'user_id': user_id,
                'smiles': smiles,
                'result': result,
                'response_time': response_time,
                'timestamp': datetime.utcnow()
            }
            
            self.api_calls_collection.add(api_call_data)
        except Exception as e:
            logger.error(f"Error logging API call: {e}")
    
    async def get_user_usage(self, user_id: str) -> Dict[str, Any]:
        """Get user's API usage statistics"""
        try:
            user = await self.get_user_by_id(user_id)
            if not user:
                return {}
            
            return {
                'api_calls_used': user.get('api_calls_used', 0),
                'api_calls_limit': user.get('api_calls_limit', 100),
                'subscription_plan': user.get('subscription_plan', 'free'),
                'last_api_call': user.get('last_api_call')
            }
        except Exception as e:
            logger.error(f"Error getting user usage: {e}")
            return {}

# Global database service instance
db_service = FirestoreService() 