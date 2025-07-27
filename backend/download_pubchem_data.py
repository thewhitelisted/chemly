#!/usr/bin/env python3
"""
Download PubChem Data Script
Downloads a large portion of PubChem records with IUPAC names
"""

import asyncio
import logging
import argparse
import time
from pubchem_downloader import PubChemDownloader

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('pubchem_download.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

async def download_pubchem_data(start_cid: int, end_cid: int, max_records: int = None, db_path: str = "pubchem_cache.db"):
    """Download PubChem data in chunks"""
    
    logger.info(f"Starting PubChem download: CID {start_cid} to {end_cid}")
    logger.info(f"Max records: {max_records or 'unlimited'}")
    logger.info(f"Database: {db_path}")
    
    start_time = time.time()
    
    async with PubChemDownloader(db_path) as downloader:
        # Get initial stats
        initial_stats = await downloader.get_database_stats()
        logger.info(f"Initial database stats: {initial_stats}")
        
        # Download the data
        total_downloaded, total_with_iupac = await downloader.download_range(
            start_cid, end_cid, max_records
        )
        
        # Get final stats
        final_stats = await downloader.get_database_stats()
        
        elapsed_time = time.time() - start_time
        
        logger.info("=" * 50)
        logger.info("DOWNLOAD COMPLETE")
        logger.info("=" * 50)
        logger.info(f"Total time: {elapsed_time:.2f} seconds")
        logger.info(f"Records downloaded: {total_downloaded}")
        logger.info(f"Records with IUPAC names: {total_with_iupac}")
        logger.info(f"Database size: {final_stats['database_size_mb']} MB")
        logger.info(f"Total records in database: {final_stats['total_records']}")
        logger.info(f"Records with IUPAC in database: {final_stats['records_with_iupac']}")
        logger.info(f"Coverage: {final_stats['coverage_percentage']}%")
        
        return final_stats

async def download_common_compounds():
    """Download common compounds (CIDs 1-100,000)"""
    logger.info("Downloading common compounds (CIDs 1-100,000)...")
    return await download_pubchem_data(1, 100000, max_records=50000)

async def download_medium_range():
    """Download medium range (CIDs 1-1,000,000)"""
    logger.info("Downloading medium range (CIDs 1-1,000,000)...")
    return await download_pubchem_data(1, 1000000, max_records=200000)

async def download_large_range():
    """Download large range (CIDs 1-10,000,000)"""
    logger.info("Downloading large range (CIDs 1-10,000,000)...")
    return await download_pubchem_data(1, 10000000, max_records=500000)

async def download_custom_range(start_cid: int, end_cid: int, max_records: int = None):
    """Download custom CID range"""
    logger.info(f"Downloading custom range: CIDs {start_cid}-{end_cid}")
    return await download_pubchem_data(start_cid, end_cid, max_records)

def main():
    parser = argparse.ArgumentParser(description='Download PubChem data with IUPAC names')
    parser.add_argument('--mode', choices=['common', 'medium', 'large', 'custom'], 
                       default='common', help='Download mode')
    parser.add_argument('--start-cid', type=int, help='Starting CID (for custom mode)')
    parser.add_argument('--end-cid', type=int, help='Ending CID (for custom mode)')
    parser.add_argument('--max-records', type=int, help='Maximum records to download')
    parser.add_argument('--db-path', default='pubchem_cache.db', help='Database path')
    
    args = parser.parse_args()
    
    if args.mode == 'custom':
        if not args.start_cid or not args.end_cid:
            logger.error("Custom mode requires --start-cid and --end-cid")
            return
        asyncio.run(download_custom_range(args.start_cid, args.end_cid, args.max_records))
    elif args.mode == 'common':
        asyncio.run(download_common_compounds())
    elif args.mode == 'medium':
        asyncio.run(download_medium_range())
    elif args.mode == 'large':
        asyncio.run(download_large_range())

if __name__ == "__main__":
    main() 