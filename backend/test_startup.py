#!/usr/bin/env python3
"""
Test script to measure startup time improvements
"""

import time
import subprocess
import sys
import os

def test_startup_time():
    """Test the startup time of the optimized backend"""
    
    print("Testing startup time improvements...")
    print("=" * 50)
    
    # Test 1: Import time for main module
    print("Test 1: Module import time")
    start_time = time.time()
    
    try:
        import main
        import_time = time.time() - start_time
        print(f"✓ Module import completed in {import_time:.2f}s")
    except Exception as e:
        print(f"✗ Module import failed: {e}")
        return False
    
    # Test 2: Lazy import time
    print("\nTest 2: Lazy import time")
    
    # Test STOUT lazy import
    start_time = time.time()
    try:
        translate_forward = main.lazy_import_stout()
        stout_time = time.time() - start_time
        print(f"✓ STOUT lazy import completed in {stout_time:.2f}s")
    except Exception as e:
        print(f"✗ STOUT lazy import failed: {e}")
    
    # Test PyTorch lazy import
    start_time = time.time()
    try:
        torch = main.lazy_import_torch()
        torch_time = time.time() - start_time
        print(f"✓ PyTorch lazy import completed in {torch_time:.2f}s")
    except Exception as e:
        print(f"✗ PyTorch lazy import failed: {e}")
    
    # Test PubChem lazy import
    start_time = time.time()
    try:
        pubchempy = main.lazy_import_pubchempy()
        pubchem_time = time.time() - start_time
        print(f"✓ PubChem lazy import completed in {pubchem_time:.2f}s")
    except Exception as e:
        print(f"✗ PubChem lazy import failed: {e}")
    
    # Test 3: Startup optimizer
    print("\nTest 3: Startup optimizer")
    try:
        from startup_optimizer import start_optimization
        optimizer = start_optimization()
        print("✓ Startup optimizer started successfully")
        
        # Wait a bit to see if models load
        time.sleep(3)
        if optimizer.is_ready():
            print("✓ Models loaded in background")
        else:
            print("⚠ Models still loading in background")
            
    except ImportError:
        print("⚠ Startup optimizer not available")
    except Exception as e:
        print(f"✗ Startup optimizer failed: {e}")
    
    print("\n" + "=" * 50)
    print("Startup optimization test completed!")
    
    return True

if __name__ == "__main__":
    test_startup_time() 