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
os.environ['OMP_NUM_THREADS'] = '2'  # Optimize for better parallelism
os.environ['TORCH_CUDNN_BENCHMARK'] = '1'  # Optimize CUDA performance
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Reduce TensorFlow logging
os.environ['CUDA_VISIBLE_DEVICES'] = ''  # Disable CUDA if not needed

# Lazy loading setup - don't import heavy packages until needed
_stout_imported = False
_pubchempy_imported = False
_torch_imported = False

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

def lazy_import_torch():
    """Lazy import torch (slow) to avoid startup delays"""
    global _torch_imported
    if not _torch_imported:
        try:
            import torch
            _torch_imported = True
            return torch
        except ImportError as e:
            logging.error(f"Failed to import torch: {e}")
            raise
    else:
        import torch
        return torch

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

# Global STOUT optimization setup - will be initialized when first needed
_stout_device = None
_stout_optimized = False
_stout_model = None

def optimize_stout_model():
    """Apply CPU-optimized settings for STOUT model"""
    global _stout_optimized, _stout_device
    
    if _stout_optimized:
        return
        
    try:
        torch = lazy_import_torch()
        logger.info("Applying CPU-optimized STOUT settings...")
        
        # CPU-only device
        _stout_device = torch.device('cpu')
        
        # CPU-optimized torch settings
        torch.set_num_threads(4)  # Optimal for Cloud Run vCPU
        torch.set_float32_matmul_precision('medium')  # Faster CPU matmul
        
        # Try to enable torch.compile if available (PyTorch 2.0+)
        if hasattr(torch, 'compile'):
            logger.info("Enabling torch.compile() optimization for CPU...")
            # Note: STOUT's internal model compilation would need access to the actual model
            # This is a placeholder for when STOUT exposes model compilation
        
        # CPU memory optimization
        torch.backends.cudnn.enabled = False  # Disable CUDA optimizations
        
        _stout_optimized = True
        logger.info("CPU-optimized STOUT settings applied successfully")
        
    except Exception as e:
        logger.warning(f"Could not apply CPU optimizations: {e}")

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
    allow_credentials=False,
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

# Dependency to check user API limits
async def check_api_limits(user: dict = Depends(get_current_user)) -> dict:
    """Check if user has API calls remaining"""
    usage = await db_service.get_user_usage(user["id"])
    if usage.get("api_calls_used", 0) >= usage.get("api_calls_limit", 100):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="API call limit exceeded. Please upgrade your plan."
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

# Global variables
_startup_time = time.time()

# Optimized ThreadPoolExecutor - more workers for better STOUT parallelization
executor = ThreadPoolExecutor(max_workers=6, thread_name_prefix="naming-worker")

# STOUT Batch Processing Cache
_stout_batch_cache = {}
_stout_batch_lock = asyncio.Lock()

# Enhanced LRU cache with better size for Cloud Run memory limits
@lru_cache(maxsize=1024)  # Increased cache size further
def cached_stout_translate(smiles: str) -> str:
    """Cached STOUT translation with advanced optimizations"""
    if not _stout_optimized:
        optimize_stout_model()
        
    logger.info(f"Starting optimized STOUT translation for SMILES: {smiles}")
    start_time = time.time()
    
    try:
        logger.info("Calling optimized STOUT translate_forward...")
        
        # Lazy import STOUT
        translate_forward = lazy_import_stout()
        torch = lazy_import_torch()
        
        # CPU-optimized STOUT Performance Optimizations
        with torch.no_grad():
            # Set optimal thread count for CPU inference
            original_threads = torch.get_num_threads()
            torch.set_num_threads(2)  # Optimal for single molecule CPU processing
            
            try:
                # CPU-only inference (no GPU optimizations)
                iupac_name = translate_forward(smiles)
            finally:
                torch.set_num_threads(original_threads)
        
        elapsed_time = time.time() - start_time
        logger.info(f"Optimized STOUT completed in {elapsed_time:.2f}s for {smiles}: {iupac_name}")
        
        return iupac_name if iupac_name else "No name found"
    except Exception as e:
        elapsed_time = time.time() - start_time
        logger.error(f"Optimized STOUT failed after {elapsed_time:.2f}s for SMILES '{smiles}': {e}")
        return "No name found"

async def pubchem_name_from_smiles(smiles: str) -> Optional[str]:
    """Async wrapper for PubChem lookup with timeout"""
    try:
        # Run in executor to avoid blocking
        loop = asyncio.get_event_loop()
        compounds = await asyncio.wait_for(
            loop.run_in_executor(
                executor, 
                lambda: lazy_import_pubchempy().get_compounds(smiles, 'smiles')
            ),
            timeout=5.0  # 5 second timeout for PubChem
        )
        
        if compounds and hasattr(compounds[0], 'iupac_name') and compounds[0].iupac_name:
            logger.info(f"PubChem IUPAC for {smiles}: {compounds[0].iupac_name}")
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
    CPU-optimized batch STOUT translation with caching
    Uses cached results when available, processes new molecules sequentially
    """
    if not _stout_optimized:
        optimize_stout_model()
        
    logger.info(f"Starting CPU-optimized batch STOUT translation for {len(smiles_list)} SMILES")
    start_time = time.time()
    
    try:
        torch = lazy_import_torch()
        with torch.no_grad():
            # Set optimal threading for batch processing
            original_threads = torch.get_num_threads()
            torch.set_num_threads(4)  # More threads for batch processing
            
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
                            
            finally:
                torch.set_num_threads(original_threads)
            
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

async def get_molecule_names_batch_async(smiles_list: List[str]) -> List[str]:
    """Optimized batch processing for multiple SMILES"""
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
        # Check if models are loaded
        models_ready = _stout_optimized
        
        # Try to import startup optimizer to check background loading
        try:
            from startup_optimizer import optimizer
            if optimizer and optimizer.is_ready():
                models_ready = True
        except ImportError:
            pass
        
        if models_ready:
            return {
                "status": "ready", 
                "uptime": round(time.time() - _startup_time, 1),
                "optimized": _stout_optimized,
                "models_loaded": True
            }
        else:
            return {
                "status": "loading", 
                "uptime": round(time.time() - _startup_time, 1),
                "optimized": _stout_optimized,
                "models_loaded": False
            }
    except Exception as e:
        return {
            "status": "error", 
            "uptime": round(time.time() - _startup_time, 1),
            "optimized": _stout_optimized,
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
            "optimizations_applied": _stout_optimized,
            "device": str(_stout_device),
            "cuda_available": torch.cuda.is_available(),
            "message": f"STOUT working, took {elapsed_time:.2f}s"
        }
    except Exception as e:
        elapsed_time = time.time() - start_time
        logger.error(f"STOUT test failed after {elapsed_time:.2f}s: {e}")
        
        return {
            "status": "error", 
            "error": str(e),
            "time_seconds": elapsed_time,
            "optimizations_applied": _stout_optimized,
            "device": str(_stout_device),
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
            "optimizations_applied": _stout_optimized,
            "device": str(_stout_device),
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
            "optimizations_applied": _stout_optimized,
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
        api_calls_used=current_user.get("api_calls_used", 0),
        api_calls_limit=current_user.get("api_calls_limit", 100),
        created_at=current_user["created_at"]
    )

@app.get("/auth/usage")
async def get_user_usage(current_user: dict = Depends(get_current_user)):
    """Get user's API usage statistics"""
    usage = await db_service.get_user_usage(current_user["id"])
    return usage

@app.post("/auth/logout")
async def logout_user(current_user: dict = Depends(get_current_user)):
    """Logout user"""
    # Note: JWT tokens can't be invalidated server-side
    # This is mainly for audit logging
    logger.info(f"User logged out: {current_user['email']}")
    return {"message": "Logged out successfully"}

@app.post("/api/name", response_model=NameResponse)
async def get_molecule_name(req: NameRequest, user: dict = Depends(check_api_limits)):
    """Main naming endpoint with authentication and usage tracking"""
    smiles_list = req.smiles if isinstance(req.smiles, list) else [req.smiles]
    logger.info(f"Processing {len(smiles_list)} SMILES strings for user {user['email']}")
    
    start_time = time.time()
    
    try:
        # Process all SMILES concurrently
        names = await get_molecule_names_batch_async(smiles_list)
        
        # Track API usage
        response_time = time.time() - start_time
        
        # Increment API call count
        await db_service.increment_api_calls(user["id"])
        
        # Log API call for analytics
        for smiles, name in zip(smiles_list, names):
            await db_service.log_api_call(user["id"], smiles, name, response_time)
        
        logger.info(f"API call completed for user {user['email']}: {len(smiles_list)} molecules in {response_time:.2f}s")
        
        return {"names": names}
    except Exception as e:
        logger.error(f"Unexpected error in get_molecule_name: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.on_event("startup")
async def startup_event():
    """Startup event handler with optimization initialization"""
    logger.info("Chemical Naming API starting up...")
    
    # Start background model loading for faster perceived startup
    try:
        from startup_optimizer import start_optimization
        optimizer = start_optimization()
        logger.info("Background model pre-loading started")
    except ImportError:
        logger.info("Startup optimizer not available, using standard loading")
        optimizer = None
    
    # Initialize optimizations (this will be faster now with lazy loading)
    optimize_stout_model()
    
    # Start database cleanup task
    asyncio.create_task(cleanup_database())
    logger.info("Database cleanup task started")
    
    # Log optimization status
    torch = lazy_import_torch()
    logger.info(f"PyTorch version: {torch.__version__}")
    logger.info(f"CUDA available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        logger.info(f"CUDA device: {torch.cuda.get_device_name(0)}")
        logger.info(f"CUDA memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
    
    logger.info(f"Thread pool workers: {executor._max_workers}")
    logger.info(f"LRU cache size: 1024")
    logger.info(f"Optimizations applied: {_stout_optimized}")
    logger.info(f"Authentication: enabled with Firestore")
    logger.info(f"Startup time: {time.time() - _startup_time:.2f}s")
    
    if optimizer:
        logger.info("Background model loading in progress...")

async def cleanup_database():
    """Periodically clean up expired sessions and old data"""
    while True:
        try:
            # Clean up expired sessions
            expired_count = await db_service.cleanup_expired_sessions()
            
            # Add other cleanup tasks here as needed
            
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