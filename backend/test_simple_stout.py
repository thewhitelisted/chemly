#!/usr/bin/env python3
"""
Simple test script to verify STOUT works without PyTorch optimizations
"""

import time
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_simple_stout():
    """Test STOUT without any PyTorch optimizations"""
    logger.info("Testing simple STOUT approach...")
    
    start_time = time.time()
    
    try:
        # Import STOUT directly
        from STOUT import translate_forward
        import_time = time.time() - start_time
        logger.info(f"STOUT import took: {import_time:.2f}s")
        
        # Test with a simple molecule
        test_smiles = "CCO"  # Ethanol
        inference_start = time.time()
        
        result = translate_forward(test_smiles)
        
        inference_time = time.time() - inference_start
        total_time = time.time() - start_time
        
        logger.info(f"STOUT result: {test_smiles} -> {result}")
        logger.info(f"Inference time: {inference_time:.2f}s")
        logger.info(f"Total time: {total_time:.2f}s")
        
        return True, result, total_time
        
    except Exception as e:
        total_time = time.time() - start_time
        logger.error(f"STOUT test failed after {total_time:.2f}s: {e}")
        return False, str(e), total_time

def test_batch_simple():
    """Test batch processing without optimizations"""
    logger.info("Testing batch STOUT processing...")
    
    test_smiles = ['CCO', 'C', 'CC', 'CCC', 'CCCC']
    start_time = time.time()
    
    try:
        from STOUT import translate_forward
        
        results = []
        for smiles in test_smiles:
            try:
                result = translate_forward(smiles)
                results.append(result)
                logger.info(f"{smiles} -> {result}")
            except Exception as e:
                logger.error(f"Failed for {smiles}: {e}")
                results.append("Error")
        
        total_time = time.time() - start_time
        avg_time = total_time / len(test_smiles)
        
        logger.info(f"Batch completed in {total_time:.2f}s (avg: {avg_time:.2f}s each)")
        return True, results, total_time
        
    except Exception as e:
        total_time = time.time() - start_time
        logger.error(f"Batch test failed after {total_time:.2f}s: {e}")
        return False, str(e), total_time

if __name__ == "__main__":
    print("=== Simple STOUT Test ===")
    
    # Test single molecule
    success, result, time_taken = test_simple_stout()
    print(f"Single test: {'✓' if success else '✗'} - {time_taken:.2f}s")
    
    print("\n=== Batch STOUT Test ===")
    success, results, time_taken = test_batch_simple()
    print(f"Batch test: {'✓' if success else '✗'} - {time_taken:.2f}s")
    
    if success:
        print("All tests passed! STOUT works without PyTorch optimizations.")
    else:
        print("Some tests failed. Check the logs above.") 