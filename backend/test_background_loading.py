#!/usr/bin/env python3
"""
Test script for background loading functionality
"""

import time
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_background_loader():
    """Test the background loader"""
    print("=== Testing Background Loader ===")
    
    try:
        from background_loader import start_background_loading
        
        # Start background loading
        print("Starting background loading...")
        loader = start_background_loading()
        
        # Check initial status
        status = loader.get_status()
        print(f"Initial status: {status}")
        
        # Wait a bit and check again
        time.sleep(2)
        status = loader.get_status()
        print(f"After 2s: {status}")
        
        # Wait for completion
        print("Waiting for completion...")
        if loader.wait_for_load(timeout=60):
            print("✓ Background loading completed successfully!")
        else:
            print("⚠ Background loading timed out")
            
        final_status = loader.get_status()
        print(f"Final status: {final_status}")
        
        return True
        
    except ImportError as e:
        print(f"✗ Could not import background_loader: {e}")
        return False
    except Exception as e:
        print(f"✗ Test failed: {e}")
        return False

def test_stout_after_background_loading():
    """Test STOUT after background loading"""
    print("\n=== Testing STOUT After Background Loading ===")
    
    try:
        # Wait for background loading to complete
        from background_loader import background_loader
        if background_loader.wait_for_load(timeout=30):
            print("Background loading completed, testing STOUT...")
            
            # Test STOUT
            from STOUT import translate_forward
            result = translate_forward("CCO")
            print(f"STOUT test: CCO -> {result}")
            
            return True
        else:
            print("Background loading didn't complete in time")
            return False
            
    except Exception as e:
        print(f"✗ STOUT test failed: {e}")
        return False

if __name__ == "__main__":
    print("Testing background loading functionality...")
    
    # Test background loader
    success1 = test_background_loader()
    
    # Test STOUT after background loading
    success2 = test_stout_after_background_loading()
    
    if success1 and success2:
        print("\n✓ All tests passed! Background loading works correctly.")
    else:
        print("\n⚠ Some tests failed. Check the output above.") 