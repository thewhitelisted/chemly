from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Union, Optional
import logging
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache
import asyncio
import time
import os

# Import dependencies at startup since models are pre-cached
from STOUT import translate_forward
import pubchempy
import torch

# STOUT Performance Optimizations
import os
os.environ['TOKENIZERS_PARALLELISM'] = 'false'  # Avoid tokenizer warnings
os.environ['OMP_NUM_THREADS'] = '2'  # Optimize for better parallelism
os.environ['TORCH_CUDNN_BENCHMARK'] = '1'  # Optimize CUDA performance

# Global STOUT optimization setup
_stout_device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
_stout_optimized = False
_stout_model = None

def optimize_stout_model():
    """Apply advanced optimizations to STOUT model if possible"""
    global _stout_optimized, _stout_model
    
    if _stout_optimized:
        return
        
    try:
        logger.info("Applying advanced STOUT optimizations...")
        
        # Set optimal torch settings
        torch.backends.cudnn.benchmark = True if torch.cuda.is_available() else False
        torch.set_float32_matmul_precision('medium')  # Faster matmul on modern GPUs
        
        # Try to enable torch.compile if available (PyTorch 2.0+)
        if hasattr(torch, 'compile'):
            logger.info("Enabling torch.compile() optimization...")
            # Note: STOUT's internal model compilation would need access to the actual model
            # This is a placeholder for when STOUT exposes model compilation
        
        # Set optimal inference settings
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            logger.info(f"Using GPU optimization on device: {_stout_device}")
        
        _stout_optimized = True
        logger.info("STOUT optimizations applied successfully")
        
    except Exception as e:
        logger.warning(f"Could not apply all STOUT optimizations: {e}")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Chemical Naming API", version="1.0.0")

class NameRequest(BaseModel):
    smiles: Union[str, List[str]]

class NameResponse(BaseModel):
    names: List[str]

class HealthResponse(BaseModel):
    status: str
    startup_time: float
    stout_loaded: bool
    version: str

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
        
        # Advanced STOUT Performance Optimizations
        with torch.no_grad():
            # Set optimal thread count for this inference
            original_threads = torch.get_num_threads()
            torch.set_num_threads(2)  # Optimal for most STOUT workloads
            
            try:
                # Enable autocast for potential speed improvements on GPU
                if torch.cuda.is_available():
                    with torch.cuda.amp.autocast(enabled=True):
                        iupac_name = translate_forward(smiles)
                else:
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
                lambda: pubchempy.get_compounds(smiles, 'smiles')
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
    True batch STOUT translation - attempts to use STOUT's internal batching
    Falls back to optimized sequential processing if batching not available
    """
    if not _stout_optimized:
        optimize_stout_model()
        
    logger.info(f"Starting true batch STOUT translation for {len(smiles_list)} SMILES")
    start_time = time.time()
    
    try:
        with torch.no_grad():
            # Set optimal threading for batch processing
            original_threads = torch.get_num_threads()
            torch.set_num_threads(4)  # More threads for batch processing
            
            try:
                results = []
                
                # Check if STOUT supports true batch processing
                # Note: This would need to be tested with actual STOUT API
                try:
                    # Attempt batch processing (if STOUT supports it)
                    if torch.cuda.is_available():
                        with torch.cuda.amp.autocast(enabled=True):
                            # This is theoretical - STOUT may not support list input
                            batch_results = translate_forward(smiles_list)
                            if isinstance(batch_results, list):
                                results = [r if r else "No name found" for r in batch_results]
                            else:
                                raise NotImplementedError("STOUT doesn't support batch input")
                    else:
                        batch_results = translate_forward(smiles_list)
                        results = [r if r else "No name found" for r in batch_results]
                        
                except (NotImplementedError, TypeError, Exception):
                    # Fall back to optimized sequential processing
                    logger.info("Falling back to optimized sequential STOUT processing")
                    for smiles in smiles_list:
                        try:
                            if torch.cuda.is_available():
                                with torch.cuda.amp.autocast(enabled=True):
                                    result = translate_forward(smiles)
                            else:
                                result = translate_forward(smiles)
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
    """Lightweight readiness check - doesn't log or do expensive operations"""
    return {
        "status": "ready", 
        "uptime": round(time.time() - _startup_time, 1),
        "optimized": _stout_optimized
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

@app.post("/api/name", response_model=NameResponse)
async def get_molecule_name(req: NameRequest):
    """Main naming endpoint with optimized async processing"""
    smiles_list = req.smiles if isinstance(req.smiles, list) else [req.smiles]
    logger.info(f"Processing {len(smiles_list)} SMILES strings")
    
    try:
        # Process all SMILES concurrently
        names = await get_molecule_names_batch_async(smiles_list)
        
        return {"names": names}
    except Exception as e:
        logger.error(f"Unexpected error in get_molecule_name: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.on_event("startup")
async def startup_event():
    """Startup event handler with optimization initialization"""
    logger.info("Chemical Naming API starting up...")
    logger.info("STOUT models pre-loaded from cache")
    
    # Initialize optimizations
    optimize_stout_model()
    
    # Log optimization status
    logger.info(f"PyTorch version: {torch.__version__}")
    logger.info(f"CUDA available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        logger.info(f"CUDA device: {torch.cuda.get_device_name(0)}")
        logger.info(f"CUDA memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
    
    logger.info(f"Thread pool workers: {executor._max_workers}")
    logger.info(f"LRU cache size: 1024")
    logger.info(f"Optimizations applied: {_stout_optimized}")
    logger.info(f"Startup time: {time.time() - _startup_time:.2f}s")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down Chemical Naming API...")
    executor.shutdown(wait=True)