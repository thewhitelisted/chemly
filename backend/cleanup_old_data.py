#!/usr/bin/env python3
"""
Database Cleanup Script for Cost Optimization
Removes old data to reduce Firestore storage costs
"""

import firebase_admin
from firebase_admin import firestore
from datetime import datetime, timedelta
import logging
import asyncio

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Firestore
try:
    firebase_admin.initialize_app()
except ValueError:
    pass

db = firestore.client()

async def cleanup_old_credit_usage():
    """Remove credit usage logs older than 30 days to reduce storage costs"""
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=30)
        logger.info(f"Cleaning up credit usage logs older than {cutoff_date}")
        
        # Get old credit usage logs
        old_logs = db.collection('credit_usage').where('timestamp', '<', cutoff_date).limit(500).get()
        
        batch = db.batch()
        count = 0
        
        for log in old_logs:
            batch.delete(log.reference)
            count += 1
            
            # Commit batch every 100 operations
            if count % 100 == 0:
                batch.commit()
                batch = db.batch()
                logger.info(f"Deleted {count} old credit usage logs")
        
        # Commit remaining operations
        if count % 100 != 0:
            batch.commit()
        
        logger.info(f"Total deleted: {count} old credit usage logs")
        return count
        
    except Exception as e:
        logger.error(f"Error cleaning up old credit usage: {e}")
        return 0

async def cleanup_old_sessions():
    """Remove expired sessions older than 1 day"""
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=1)
        logger.info(f"Cleaning up sessions older than {cutoff_date}")
        
        # Get old sessions
        old_sessions = db.collection('sessions').where('expires_at', '<', cutoff_date).limit(500).get()
        
        batch = db.batch()
        count = 0
        
        for session in old_sessions:
            batch.delete(session.reference)
            count += 1
            
            # Commit batch every 100 operations
            if count % 100 == 0:
                batch.commit()
                batch = db.batch()
                logger.info(f"Deleted {count} old sessions")
        
        # Commit remaining operations
        if count % 100 != 0:
            batch.commit()
        
        logger.info(f"Total deleted: {count} old sessions")
        return count
        
    except Exception as e:
        logger.error(f"Error cleaning up old sessions: {e}")
        return 0

async def get_storage_stats():
    """Get current storage statistics"""
    try:
        # Count documents in each collection
        users_count = len(list(db.collection('users').limit(1000).get()))
        sessions_count = len(list(db.collection('sessions').limit(1000).get()))
        credit_usage_count = len(list(db.collection('credit_usage').limit(1000).get()))
        
        logger.info(f"Storage stats - Users: {users_count}, Sessions: {sessions_count}, Credit Usage: {credit_usage_count}")
        
        return {
            'users': users_count,
            'sessions': sessions_count,
            'credit_usage': credit_usage_count
        }
        
    except Exception as e:
        logger.error(f"Error getting storage stats: {e}")
        return {}

async def main():
    """Main cleanup function"""
    logger.info("Starting database cleanup for cost optimization...")
    
    # Get stats before cleanup
    stats_before = await get_storage_stats()
    
    # Run cleanup operations
    credit_usage_deleted = await cleanup_old_credit_usage()
    sessions_deleted = await cleanup_old_sessions()
    
    # Get stats after cleanup
    stats_after = await get_storage_stats()
    
    logger.info(f"Cleanup completed:")
    logger.info(f"  - Credit usage logs deleted: {credit_usage_deleted}")
    logger.info(f"  - Sessions deleted: {sessions_deleted}")
    logger.info(f"  - Total operations: {credit_usage_deleted + sessions_deleted}")

if __name__ == "__main__":
    asyncio.run(main()) 