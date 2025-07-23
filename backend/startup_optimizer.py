#!/usr/bin/env python3
"""
Startup Optimizer for Chemical Naming API
Pre-loads heavy libraries and warms up models in background to reduce perceived startup time
"""

import asyncio
import logging
import time
import os
from concurrent.futures import ThreadPoolExecutor
import threading

# Set environment variables to reduce import warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # Suppress TensorFlow warnings
os.environ['CUDA_VISIBLE_DEVICES'] = ''  # Disable CUDA if not needed
os.environ['TOKENIZERS_PARALLELISM'] = 'false'

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class StartupOptimizer:
    """Background library pre-loader and model warmer to reduce startup time"""
    
    def __init__(self):
        self.libraries_loaded = False
        self.models_warmed = False
        self.loading_thread = None
        self.executor = ThreadPoolExecutor(max_workers=3, thread_name_prefix="preloader")
        
    def start_background_loading(self):
        """Start background library loading and model warming"""
        if self.loading_thread and self.loading_thread.is_alive():
            return
            
        logger.info("Starting background library pre-loading and model warming...")
        self.loading_thread = threading.Thread(target=self._load_and_warm_background, daemon=True)
        self.loading_thread.start()
        
    def _import_pubchempy(self):
        """Import PubChem in separate thread"""
        try:
            logger.info("Pre-importing PubChem (fast)...")
            import pubchempy
            logger.info("PubChem imported successfully")
            return True
        except Exception as e:
            logger.error(f"PubChem import failed: {e}")
            return False
            
    def _import_torch(self):
        """Import PyTorch in separate thread"""
        try:
            logger.info("Pre-importing PyTorch (slow)...")
            import torch
            logger.info(f"PyTorch {torch.__version__} imported successfully")
            return torch
        except Exception as e:
            logger.error(f"PyTorch import failed: {e}")
            return None
            
    def _import_stout(self):
        """Import STOUT in separate thread"""
        try:
            logger.info("Pre-importing STOUT (slowest)...")
            from STOUT import translate_forward
            logger.info("STOUT imported successfully")
            return translate_forward
        except Exception as e:
            logger.error(f"STOUT import failed: {e}")
            return None
        
    def _load_and_warm_background(self):
        """Load libraries and warm models in background thread"""
        try:
            start_time = time.time()
            
            # Step 1: Import libraries in parallel (this is the main optimization)
            logger.info("Pre-importing libraries in parallel...")
            
            # Start all imports in parallel
            pubchem_future = self.executor.submit(self._import_pubchempy)
            torch_future = self.executor.submit(self._import_torch)
            stout_future = self.executor.submit(self._import_stout)
            
            # Wait for all imports to complete with aggressive timeouts for pay-per-request
            pubchem_success = pubchem_future.result(timeout=5)   # PubChem should be very fast
            torch = torch_future.result(timeout=8)   # PyTorch timeout reduced
            translate_forward = stout_future.result(timeout=12)  # STOUT timeout reduced
            
            # Mark as ready even if some imports fail (they'll be imported on-demand)
            self.libraries_loaded = True
            library_time = time.time() - start_time
            logger.info(f"Library pre-loading completed in {library_time:.2f}s")
            
            # Only proceed with warmup if we have all the heavy libraries
            if torch and translate_forward:
                
                # Step 2: Warm up STOUT model (this is fast once libraries are loaded)
                logger.info("Warming up STOUT model...")
                warmup_start = time.time()
                test_smiles = "CCO"  # Simple ethanol molecule
                
                try:
                    # CPU-optimized model warmup
                    with torch.no_grad():
                        torch.set_num_threads(4)  # Optimal for Cloud Run vCPU
                        result = translate_forward(test_smiles)
                    logger.info(f"STOUT CPU warmup successful: {test_smiles} -> {result}")
                    self.models_warmed = True
                    
                    warmup_time = time.time() - warmup_start
                    logger.info(f"CPU model warming completed in {warmup_time:.2f}s")
                    
                except Exception as e:
                    logger.warning(f"STOUT CPU warmup failed: {e}")
                
                # Step 3: Test PubChem connection (fast, can run in parallel with warmup)
                logger.info("Testing PubChem connection...")
                try:
                    import pubchempy
                    compounds = pubchempy.get_compounds("CCO", "smiles")
                    if compounds:
                        logger.info(f"PubChem test successful: {compounds[0].iupac_name}")
                except Exception as e:
                    logger.warning(f"PubChem test failed: {e}")
                
                total_time = time.time() - start_time
                logger.info(f"Background optimization completed in {total_time:.2f}s")
            else:
                logger.warning("Heavy libraries not pre-loaded, will be imported on-demand")
                total_time = time.time() - start_time
                logger.info(f"Background optimization completed in {total_time:.2f}s (partial)")
                
        except Exception as e:
            logger.error(f"Background optimization failed: {e}")
            
    def is_ready(self) -> bool:
        """Check if libraries and models are ready"""
        return self.libraries_loaded and self.models_warmed
        
    def is_libraries_ready(self) -> bool:
        """Check if just libraries are loaded"""
        return self.libraries_loaded
        
    def wait_for_ready(self, timeout: float = 30.0) -> bool:
        """Wait for everything to be ready with timeout"""
        if self.is_ready():
            return True
            
        start_time = time.time()
        while not self.is_ready() and (time.time() - start_time) < timeout:
            time.sleep(0.1)
            
        return self.is_ready()

# Global optimizer instance
optimizer = StartupOptimizer()

def start_optimization():
    """Start the startup optimization process"""
    optimizer.start_background_loading()
    return optimizer

if __name__ == "__main__":
    # Test the optimizer
    print("Starting background optimization...")
    opt = start_optimization()
    
    # Wait a bit and check status
    time.sleep(3)
    print(f"Libraries loaded: {opt.is_libraries_ready()}")
    print(f"Models warmed: {opt.models_warmed}")
    print(f"Fully ready: {opt.is_ready()}")
    
    # Wait for completion
    if opt.wait_for_ready(timeout=60):
        print("✓ All optimizations completed successfully!")
    else:
        print("⚠ Optimization timed out") 