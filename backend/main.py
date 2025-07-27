from fastapi import FastAPI, HTTPException, Request, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Union, Optional, Dict
import logging
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache
import asyncio
import time
import os
import secrets
from datetime import datetime, timedelta

# Import authentication modules
from auth_models import UserCreate, UserLogin, UserResponse, Token
from auth_service import auth_service
from database import db_service

# Environment optimizations to reduce import warnings and improve performance
os.environ['TOKENIZERS_PARALLELISM'] = 'false'  # Avoid tokenizer warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Reduce TensorFlow logging

# Lazy loading setup - don't import heavy packages until needed
_stout_imported = False
_pubchempy_imported = False

def lazy_import_pubchempy():
    """Lazy import pubchempy (fast) to avoid startup delays"""
    global _pubchempy_imported
    if not _pubchempy_imported:
        try:
            import pubchempy
            _pubchempy_imported = True
            return pubchempy
        except ImportError as e:
            logging.error(f"Failed to import pubchempy: {e}")
            raise
    else:
        import pubchempy
        return pubchempy

def lazy_import_stout():
    """Lazy import STOUT (slowest) to avoid startup delays"""
    global _stout_imported
    if not _stout_imported:
        try:
            from STOUT import translate_forward
            _stout_imported = True
            return translate_forward
        except ImportError as e:
            logging.error(f"Failed to import STOUT: {e}")
            raise
    else:
        from STOUT import translate_forward
        return translate_forward

# Simple thread pool for async operations
executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="chemly")
_startup_time = time.time()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Chemical Naming API", version="1.0.0")

# Add CORS middleware - restricted to orgolab.ca domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://orgolab.ca",
        "https://www.orgolab.ca", 
        "http://orgolab.ca",
        "http://www.orgolab.ca"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Dependency to get current user
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Get current authenticated user"""
    token = credentials.credentials
    user = await auth_service.validate_session(token)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

# Dependency to check user credit limits
async def check_credit_limits(user: dict = Depends(get_current_user)) -> dict:
    """Check if user has credits remaining"""
    usage = await db_service.get_user_credit_usage(user["id"])
    basic_remaining = usage.get("basic_credits_limit", 0) - usage.get("basic_credits_used", 0)
    premium_remaining = usage.get("premium_credits_limit", 0) - usage.get("premium_credits_used", 0)
    
    if basic_remaining <= 0 and premium_remaining <= 0:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="All credits exhausted. Please upgrade your plan or wait for monthly reset."
        )
    return user

class NameRequest(BaseModel):
    smiles: Union[str, List[str]]

class NameResponse(BaseModel):
    names: List[str]

class HealthResponse(BaseModel):
    status: str
    startup_time: float
    stout_loaded: bool
    version: str

class SessionResponse(BaseModel):
    token: str
    expires_at: str
    expires_in: int

# Enhanced LRU cache with better size for Cloud Run memory limits
@lru_cache(maxsize=1024)  # Increased cache size further
def cached_stout_translate(smiles: str) -> str:
    """Simple cached STOUT translation without PyTorch optimizations"""
    logger.info(f"Starting STOUT translation for SMILES: {smiles}")
    start_time = time.time()
    
    try:
        logger.info("Calling STOUT translate_forward...")
        
        # Lazy import STOUT
        translate_forward = lazy_import_stout()
        
        # Simple STOUT call without PyTorch optimizations
        iupac_name = translate_forward(smiles)
        
        elapsed_time = time.time() - start_time
        logger.info(f"STOUT completed in {elapsed_time:.2f}s for {smiles}: {iupac_name}")
        
        return iupac_name if iupac_name else "No name found"
    except Exception as e:
        elapsed_time = time.time() - start_time
        logger.error(f"STOUT failed after {elapsed_time:.2f}s for SMILES '{smiles}': {e}")
        return "No name found"

async def pubchem_name_from_smiles(smiles: str) -> Optional[str]:
    """Async wrapper for PubChem lookup with local cache fallback"""
    try:
        # First try local cache
        try:
            from pubchem_cache_service import get_pubchem_cache
            cache = get_pubchem_cache()
            cached_name = cache.lookup_iupac_name(smiles)
            if cached_name:
                logger.info(f"PubChem cache hit for {smiles}: {cached_name}")
                return cached_name
        except ImportError:
            logger.debug("PubChem cache service not available")
        except Exception as e:
            logger.debug(f"PubChem cache lookup failed: {e}")
        
        # Fallback to online PubChem API
        loop = asyncio.get_event_loop()
        compounds = await asyncio.wait_for(
            loop.run_in_executor(
                executor, 
                lambda: lazy_import_pubchempy().get_compounds(smiles, 'smiles')
            ),
            timeout=5.0  # 5 second timeout for PubChem
        )
        
        if compounds and hasattr(compounds[0], 'iupac_name') and compounds[0].iupac_name:
            logger.info(f"PubChem API IUPAC for {smiles}: {compounds[0].iupac_name}")
            return compounds[0].iupac_name
        else:
            logger.info(f"No PubChem IUPAC name found for {smiles}")
            return None
    except asyncio.TimeoutError:
        logger.warning(f"PubChem lookup timeout for {smiles}")
        return None
    except Exception as e:
        logger.error(f"PubChem lookup failed for SMILES '{smiles}': {e}")
        return None

def true_batch_stout_translate(smiles_list: List[str]) -> List[str]:
    """
    Simple batch STOUT translation with caching
    Uses cached results when available, processes new molecules sequentially
    """
    logger.info(f"Starting batch STOUT translation for {len(smiles_list)} SMILES")
    start_time = time.time()
    
    try:
        results = []
        
        # Process each SMILES with caching
        for smiles in smiles_list:
            try:
                # Use cached result if available, otherwise process
                result = cached_stout_translate(smiles)
                results.append(result if result else "No name found")
            except Exception as e:
                logger.error(f"STOUT batch failed for {smiles}: {e}")
                results.append("No name found")
        
        elapsed_time = time.time() - start_time
        avg_time = elapsed_time / len(smiles_list)
        logger.info(f"Batch STOUT completed in {elapsed_time:.2f}s for {len(smiles_list)} SMILES (avg: {avg_time:.2f}s each)")
        return results
        
    except Exception as e:
        elapsed_time = time.time() - start_time
        logger.error(f"Batch STOUT failed after {elapsed_time:.2f}s: {e}")
        return ["No name found" for _ in smiles_list]

async def get_molecule_name_async(smiles: str) -> str:
    """Async function to get molecule name with PubChem fallback and batch optimization"""
    # Try PubChem first (faster, lighter)
    pubchem_name = await pubchem_name_from_smiles(smiles)
    if pubchem_name:
        return pubchem_name
    
    # Fallback to STOUT with batching optimization
    try:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(executor, cached_stout_translate, smiles)
    except Exception as e:
        logger.error(f"All naming methods failed for {smiles}: {e}")
        return "No name found"

async def get_molecule_names_with_credits(smiles_list: List[str], user_id: str) -> tuple:
    """Process SMILES with credit consumption tracking - optimized for database efficiency
    Returns: (names, basic_credits_used, premium_credits_used, compute_time)"""
    logger.info(f"Processing batch of {len(smiles_list)} SMILES with credit tracking")
    
    # Pre-fetch user data once to avoid multiple database calls
    user = await db_service.get_user_by_id(user_id)
    if not user:
        return ["User not found"] * len(smiles_list), 0, 0, 0.0
    
    # Check PubChem for all SMILES first (uses basic credits)
    pubchem_tasks = [pubchem_name_from_smiles(smiles) for smiles in smiles_list]
    pubchem_results = await asyncio.gather(*pubchem_tasks, return_exceptions=True)
    
    # Collect SMILES that need STOUT processing
    stout_needed = []
    stout_indices = []
    final_results = [None] * len(smiles_list)
    basic_credits_used = 0
    premium_credits_used = 0
    total_compute_time = 0.0
    
    # Process PubChem results and consume basic credits
    for i, (smiles, pubchem_result) in enumerate(zip(smiles_list, pubchem_results)):
        logger.info(f"Processing SMILES {smiles}: PubChem result = {pubchem_result} (type: {type(pubchem_result)})")
        
        if isinstance(pubchem_result, str) and pubchem_result != "No name found" and pubchem_result is not None:
            # PubChem success - consume basic credit
            logger.info(f"PubChem success for {smiles}, attempting to consume basic credit")
            if await db_service.consume_basic_credits(user_id, 1):
                final_results[i] = pubchem_result
                basic_credits_used += 1
                logger.info(f"Basic credit consumed for {smiles}")
            else:
                # Fall back to STOUT if no basic credits
                logger.info(f"No basic credits available for {smiles}, falling back to STOUT")
                stout_needed.append(smiles)
                stout_indices.append(i)
        else:
            # PubChem failed - need STOUT
            logger.info(f"PubChem failed for {smiles}, using STOUT")
            stout_needed.append(smiles)
            stout_indices.append(i)
    
    # Process remaining SMILES with STOUT (uses premium credits)
    if stout_needed:
        logger.info(f"Running batch STOUT for {len(stout_needed)} remaining SMILES")
        try:
            start_compute = time.time()
            loop = asyncio.get_event_loop()
            stout_results = await loop.run_in_executor(executor, true_batch_stout_translate, stout_needed)
            compute_time = time.time() - start_compute
            total_compute_time = compute_time
            
            # Consume premium credits and fill in results
            for idx, result, smiles in zip(stout_indices, stout_results, stout_needed):
                individual_compute_time = compute_time / len(stout_needed)
                credits_for_this_molecule = individual_compute_time / 10  # 1 credit = 10 seconds
                
                if await db_service.consume_premium_credits(user_id, individual_compute_time):
                    final_results[idx] = result
                    premium_credits_used += credits_for_this_molecule
                else:
                    final_results[idx] = "Credit limit exceeded"
                    
        except Exception as e:
            logger.error(f"Batch STOUT processing failed: {e}")
            for idx in stout_indices:
                final_results[idx] = "Processing failed"
    
    # Fill any remaining None values
    for i in range(len(final_results)):
        if final_results[i] is None:
            final_results[i] = "No name found"
    
    return final_results, basic_credits_used, premium_credits_used, total_compute_time

async def get_molecule_names_batch_async(smiles_list: List[str]) -> List[str]:
    """Legacy batch processing function for backward compatibility"""
    logger.info(f"Processing batch of {len(smiles_list)} SMILES")
    
    # Check PubChem for all SMILES first
    pubchem_tasks = [pubchem_name_from_smiles(smiles) for smiles in smiles_list]
    pubchem_results = await asyncio.gather(*pubchem_tasks, return_exceptions=True)
    
    # Collect SMILES that need STOUT processing
    stout_needed = []
    stout_indices = []
    final_results = [None] * len(smiles_list)
    
    for i, (smiles, pubchem_result) in enumerate(zip(smiles_list, pubchem_results)):
        if isinstance(pubchem_result, str) and pubchem_result != "No name found":
            final_results[i] = pubchem_result
        else:
            stout_needed.append(smiles)
            stout_indices.append(i)
    
    # Process remaining SMILES with batch STOUT if any
    if stout_needed:
        logger.info(f"Running batch STOUT for {len(stout_needed)} remaining SMILES")
        try:
            loop = asyncio.get_event_loop()
            stout_results = await loop.run_in_executor(executor, true_batch_stout_translate, stout_needed)
            
            # Fill in STOUT results
            for idx, result in zip(stout_indices, stout_results):
                final_results[idx] = result
        except Exception as e:
            logger.error(f"Batch STOUT processing failed: {e}")
            for idx in stout_indices:
                final_results[idx] = "No name found"
    
    # Fill any remaining None values
    for i in range(len(final_results)):
        if final_results[i] is None:
            final_results[i] = "No name found"
    
    return final_results

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for Cloud Run readiness - optimized for cost"""
    return HealthResponse(
        status="healthy",
        startup_time=time.time() - _startup_time,
        stout_loaded=True,  # Always true since pre-cached
        version="1.0.0"
    )

@app.get("/ping")
async def ping():
    """Ultra-minimal health check for cost optimization - just returns 200 OK"""
    return {"status": "ok"}

@app.get("/ready")  
async def readiness_check():
    """Readiness check for Cloud Run with model loading status"""
    try:
        # Check background loading status
        try:
            from background_loader import background_loader
            loader_status = background_loader.get_status()
            models_ready = loader_status["loaded"]
        except ImportError:
            # Fallback to direct import check
            try:
                from STOUT import translate_forward
                models_ready = True
                loader_status = {"status": "loaded", "loaded": True, "loading": False}
            except ImportError:
                models_ready = False
                loader_status = {"status": "not_started", "loaded": False, "loading": False}
        
        if models_ready:
            return {
                "status": "ready", 
                "uptime": round(time.time() - _startup_time, 1),
                "optimized": False, # No optimizations applied
                "models_loaded": True,
                "background_loading": loader_status
            }
        else:
            return {
                "status": "loading", 
                "uptime": round(time.time() - _startup_time, 1),
                "optimized": False, # No optimizations applied
                "models_loaded": False,
                "background_loading": loader_status
            }
    except Exception as e:
        return {
            "status": "error", 
            "uptime": round(time.time() - _startup_time, 1),
            "optimized": False, # No optimizations applied
            "models_loaded": False,
            "error": str(e)
        }

@app.get("/test-stout")
async def test_stout():
    """Test endpoint to verify STOUT is working and measure performance"""
    logger.info("Testing STOUT with simple molecule...")
    start_time = time.time()
    
    try:
        # Test with a simple molecule (methanol)
        result = await asyncio.get_event_loop().run_in_executor(
            executor, 
            cached_stout_translate, 
            'CCO'
        )
        
        elapsed_time = time.time() - start_time
        logger.info(f"STOUT test completed in {elapsed_time:.2f}s")
        
        return {
            "status": "success",
            "smiles": "CCO",
            "result": result,
            "time_seconds": elapsed_time,
            "optimizations_applied": False, # No optimizations applied
            "device": "N/A",
            "cuda_available": False,
            "message": f"STOUT working, took {elapsed_time:.2f}s"
        }
    except Exception as e:
        elapsed_time = time.time() - start_time
        logger.error(f"STOUT test failed after {elapsed_time:.2f}s: {e}")
        
        return {
            "status": "error", 
            "error": str(e),
            "time_seconds": elapsed_time,
            "optimizations_applied": False, # No optimizations applied
            "device": "N/A",
            "message": f"STOUT failed after {elapsed_time:.2f}s"
        }

@app.get("/test-batch")
async def test_batch():
    """Test batch STOUT processing performance"""
    logger.info("Testing batch STOUT processing...")
    
    test_smiles = ['CCO', 'C', 'CC', 'CCC', 'CCCC']  # Simple test molecules
    start_time = time.time()
    
    try:
        # Test batch processing
        results = await asyncio.get_event_loop().run_in_executor(
            executor, 
            true_batch_stout_translate, 
            test_smiles
        )
        
        elapsed_time = time.time() - start_time
        avg_time = elapsed_time / len(test_smiles)
        
        logger.info(f"Batch test completed in {elapsed_time:.2f}s")
        
        return {
            "status": "success",
            "test_smiles": test_smiles,
            "results": results,
            "total_time_seconds": elapsed_time,
            "average_time_seconds": avg_time,
            "molecules_processed": len(test_smiles),
            "optimizations_applied": False, # No optimizations applied
            "device": "N/A",
            "message": f"Batch processed {len(test_smiles)} molecules in {elapsed_time:.2f}s (avg: {avg_time:.2f}s each)"
        }
    except Exception as e:
        elapsed_time = time.time() - start_time
        logger.error(f"Batch test failed after {elapsed_time:.2f}s: {e}")
        
        return {
            "status": "error", 
            "error": str(e),
            "total_time_seconds": elapsed_time,
            "test_smiles": test_smiles,
            "optimizations_applied": False, # No optimizations applied
            "message": f"Batch test failed after {elapsed_time:.2f}s"
        }

@app.get("/warmup")
async def warmup():
    """Warmup endpoint - models are already loaded"""
    return {
        "status": "ready",
        "message": "All models pre-loaded and ready",
        "startup_time": time.time() - _startup_time
    }

@app.get("/cache-stats")
async def cache_stats():
    """Get cache statistics for monitoring"""
    cache_info = cached_stout_translate.cache_info()
    return {
        "cache_hits": cache_info.hits,
        "cache_misses": cache_info.misses,
        "cache_size": cache_info.currsize,
        "max_cache_size": cache_info.maxsize,
        "hit_rate": cache_info.hits / (cache_info.hits + cache_info.misses) if (cache_info.hits + cache_info.misses) > 0 else 0
    }

@app.get("/background-status")
async def background_status():
    """Get background loading status"""
    try:
        from background_loader import background_loader
        status = background_loader.get_status()
        return {
            "background_loading": status,
            "uptime": round(time.time() - _startup_time, 1)
        }
    except ImportError:
        return {
            "background_loading": {"status": "not_available", "loaded": False, "loading": False},
            "uptime": round(time.time() - _startup_time, 1),
            "message": "Background loader not available"
        }

@app.get("/pubchem-cache-status")
async def pubchem_cache_status():
    """Get PubChem cache status"""
    try:
        from pubchem_cache_service import get_pubchem_cache
        cache = get_pubchem_cache()
        stats = cache.get_cache_stats()
        return {
            "pubchem_cache": stats,
            "uptime": round(time.time() - _startup_time, 1)
        }
    except ImportError:
        return {
            "pubchem_cache": {"available": False, "error": "Cache service not available"},
            "uptime": round(time.time() - _startup_time, 1)
        }

@app.post("/auth/register", response_model=Token)
async def register_user(user: UserCreate):
    """Register a new user"""
    try:
        # Hash the password
        hashed_password = auth_service.get_password_hash(user.password)
        
        # Create user in database
        user_id = await db_service.create_user(user.email, hashed_password)
        
        # Create session token
        access_token = await auth_service.create_user_session(user_id)
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=1800  # 30 minutes
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")

@app.post("/auth/login", response_model=Token)
async def login_user(user: UserLogin):
    """Login user and return access token"""
    try:
        # Authenticate user
        authenticated_user = await auth_service.authenticate_user(user.email, user.password)
        if not authenticated_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create session token
        access_token = await auth_service.create_user_session(authenticated_user["id"])
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=1800  # 30 minutes
        )
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        subscription_plan=current_user.get("subscription_plan", "free"),
        basic_credits_used=int(current_user.get("basic_credits_used", 0)),
        basic_credits_limit=int(current_user.get("basic_credits_limit", 200)),
        premium_credits_used=float(current_user.get("premium_credits_used", 0.0)),
        premium_credits_limit=float(current_user.get("premium_credits_limit", 35.0)),
        created_at=current_user["created_at"]
    )

@app.get("/auth/usage")
async def get_user_usage(current_user: dict = Depends(get_current_user)):
    """Get user's credit usage statistics"""
    usage = await db_service.get_user_credit_usage(current_user["id"])
    return usage

@app.get("/auth/credits")
async def check_credit_availability(current_user: dict = Depends(get_current_user)):
    """Check credit availability for both basic and premium"""
    usage = await db_service.get_user_credit_usage(current_user["id"])
    
    basic_remaining = usage.get("basic_credits_limit", 0) - usage.get("basic_credits_used", 0)
    premium_remaining = usage.get("premium_credits_limit", 0) - usage.get("premium_credits_used", 0)
    
    return {
        "basic_credits_remaining": max(0, basic_remaining),
        "premium_credits_remaining": max(0, premium_remaining),
        "can_use_basic": basic_remaining > 0,
        "can_use_premium": premium_remaining > 0,
        "subscription_plan": usage.get("subscription_plan", "free"),
        "monthly_reset_date": usage.get("monthly_reset_date")
    }

@app.post("/auth/logout")
async def logout_user(current_user: dict = Depends(get_current_user)):
    """Logout user"""
    # Note: JWT tokens can't be invalidated server-side
    # This is mainly for audit logging
    logger.info(f"User logged out: {current_user['email']}")
    return {"message": "Logged out successfully"}

class SubscriptionUpdate(BaseModel):
    plan: str

@app.post("/auth/subscription")
async def update_subscription(
    subscription: SubscriptionUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update user's subscription plan"""
    try:
        success = await db_service.update_user_subscription(current_user["id"], subscription.plan)
        if success:
            return {"message": f"Subscription updated to {subscription.plan}", "plan": subscription.plan}
        else:
            raise HTTPException(status_code=400, detail="Failed to update subscription")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Subscription update error: {e}")
        raise HTTPException(status_code=500, detail="Subscription update failed")

@app.post("/api/name", response_model=NameResponse)
async def get_molecule_name(req: NameRequest, user: dict = Depends(check_credit_limits)):
    """Main naming endpoint with authentication and credit tracking"""
    smiles_list = req.smiles if isinstance(req.smiles, list) else [req.smiles]
    logger.info(f"Processing {len(smiles_list)} SMILES strings for user {user['email']}")
    
    start_time = time.time()
    
    try:
        # Process all SMILES with credit tracking
        names, basic_used, premium_used, compute_time = await get_molecule_names_with_credits(smiles_list, user["id"])
        
        response_time = time.time() - start_time
        
        # Log credit usage for analytics
        if basic_used > 0:
            await db_service.log_credit_usage(user["id"], "basic", float(basic_used), 
                                            ",".join(smiles_list), ",".join(names))
        if premium_used > 0:
            await db_service.log_credit_usage(user["id"], "premium", premium_used, 
                                            ",".join(smiles_list), ",".join(names), compute_time)
        
        logger.info(f"Naming completed for user {user['email']}: {len(smiles_list)} molecules, "
                   f"{basic_used} basic credits, {premium_used} premium credits in {response_time:.2f}s")
        
        return {"names": names}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_molecule_name: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.on_event("startup")
async def startup_event():
    """Startup event handler - fast startup with background model loading"""
    logger.info("Chemical Naming API starting up...")
    
    # Start background STOUT loading (non-blocking)
    try:
        from background_loader import start_background_loading
        background_loader = start_background_loading()
        logger.info("Background STOUT loading started")
    except ImportError:
        logger.info("Background loader not available, using on-demand loading")
        background_loader = None
    
    # Start database cleanup task
    asyncio.create_task(cleanup_database())
    logger.info("Database cleanup task started")
    
    # Log startup status
    logger.info(f"Thread pool workers: {executor._max_workers}")
    logger.info(f"LRU cache size: 1024")
    logger.info(f"Authentication: enabled with Firestore")
    logger.info(f"Startup time: {time.time() - _startup_time:.2f}s")
    logger.info("Ready to serve requests - STOUT loading in background")

async def cleanup_database():
    """Periodically clean up expired sessions and old data for cost optimization"""
    while True:
        try:
            # Clean up expired sessions
            expired_count = await db_service.cleanup_expired_sessions()
            
            # Clean up old credit usage logs (run less frequently to save costs)
            import random
            if random.random() < 0.2:  # 20% chance each cycle (roughly once per hour)
                try:
                    from cleanup_old_data import cleanup_old_credit_usage
                    old_logs_count = await cleanup_old_credit_usage()
                    if old_logs_count > 0:
                        logger.info(f"Database cleanup: removed {old_logs_count} old credit usage logs")
                except ImportError:
                    logger.warning("Cleanup script not available")
            
            if expired_count > 0:
                logger.info(f"Database cleanup: removed {expired_count} expired sessions")
                
        except Exception as e:
            logger.error(f"Database cleanup error: {e}")
        
        await asyncio.sleep(300)  # Run every 5 minutes

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down Chemical Naming API...")
    executor.shutdown(wait=True)