#!/usr/bin/env python3
"""
Lightweight Background Loader for STOUT
Pre-loads STOUT in background without blocking startup
"""

import asyncio
import logging
import time
import threading
from typing import Optional

logger = logging.getLogger(__name__)

class BackgroundLoader:
    """Lightweight background loader for STOUT"""
    
    def __init__(self):
        self._loading = False
        self._loaded = False
        self._load_thread: Optional[threading.Thread] = None
        self._load_start_time: Optional[float] = None
        self._load_error: Optional[str] = None
        
    def start_loading(self):
        """Start background loading of STOUT"""
        if self._loading or self._loaded:
            return
            
        logger.info("Starting background STOUT loading...")
        self._loading = True
        self._load_start_time = time.time()
        self._load_error = None
        
        # Start loading in a daemon thread (won't block shutdown)
        self._load_thread = threading.Thread(target=self._load_stout, daemon=True)
        self._load_thread.start()
        
    def _load_stout(self):
        """Load STOUT in background thread"""
        try:
            logger.info("Background: Importing STOUT...")
            from STOUT import translate_forward
            
            # Test with a simple molecule to warm up the model
            logger.info("Background: Warming up STOUT model...")
            test_result = translate_forward("CCO")
            
            load_time = time.time() - self._load_start_time
            logger.info(f"Background: STOUT loaded successfully in {load_time:.2f}s")
            logger.info(f"Background: Test result - CCO -> {test_result}")
            
            self._loaded = True
            
        except Exception as e:
            load_time = time.time() - self._load_start_time
            self._load_error = str(e)
            logger.error(f"Background: STOUT loading failed after {load_time:.2f}s: {e}")
            
        finally:
            self._loading = False
            
    def is_loaded(self) -> bool:
        """Check if STOUT is loaded"""
        return self._loaded
        
    def is_loading(self) -> bool:
        """Check if STOUT is currently loading"""
        return self._loading
        
    def get_status(self) -> dict:
        """Get loading status"""
        if self._loaded:
            return {
                "status": "loaded",
                "loaded": True,
                "loading": False,
                "error": None
            }
        elif self._loading:
            load_time = time.time() - self._load_start_time if self._load_start_time else 0
            return {
                "status": "loading",
                "loaded": False,
                "loading": True,
                "load_time": round(load_time, 2),
                "error": None
            }
        else:
            return {
                "status": "not_started",
                "loaded": False,
                "loading": False,
                "error": self._load_error
            }
            
    def wait_for_load(self, timeout: float = 30.0) -> bool:
        """Wait for loading to complete with timeout"""
        if self._loaded:
            return True
            
        if not self._loading:
            return False
            
        start_time = time.time()
        while self._loading and (time.time() - start_time) < timeout:
            time.sleep(0.1)
            
        return self._loaded

# Global background loader instance
background_loader = BackgroundLoader()

def start_background_loading():
    """Start background loading of STOUT"""
    background_loader.start_loading()
    return background_loader

if __name__ == "__main__":
    # Test the background loader
    print("Testing background loader...")
    
    loader = start_background_loading()
    print(f"Initial status: {loader.get_status()}")
    
    # Wait a bit
    time.sleep(2)
    print(f"After 2s: {loader.get_status()}")
    
    # Wait for completion
    if loader.wait_for_load(timeout=60):
        print("✓ STOUT loaded successfully!")
    else:
        print("⚠ Loading timed out or failed")
        
    print(f"Final status: {loader.get_status()}") 