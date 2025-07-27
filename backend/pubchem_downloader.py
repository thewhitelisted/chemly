#!/usr/bin/env python3
"""
PubChem IUPAC Name Downloader
Downloads PubChem records with IUPAC names for local caching
"""

import asyncio
import logging
import time
import sqlite3
import os
from typing import List, Dict, Optional, Tuple
import json
from datetime import datetime
import aiohttp
import aiofiles

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PubChemDownloader:
    """Downloads and caches PubChem IUPAC names"""
    
    def __init__(self, db_path: str = "pubchem_cache.db"):
        self.db_path = db_path
        self.session: Optional[aiohttp.ClientSession] = None
        self.batch_size = 100  # PubChem API batch size
        self.delay_between_batches = 0.1  # Rate limiting
        
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={'User-Agent': 'Chemly/1.0 (https://orgolab.ca)'}
        )
        await self.init_database()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
            
    async def init_database(self):
        """Initialize SQLite database for PubChem cache"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create table for PubChem records
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS pubchem_records (
                cid INTEGER PRIMARY KEY,
                smiles TEXT NOT NULL,
                iupac_name TEXT,
                molecular_formula TEXT,
                molecular_weight REAL,
                canonical_smiles TEXT,
                isomeric_smiles TEXT,
                inchi TEXT,
                inchikey TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create indexes for fast lookups
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_smiles ON pubchem_records(smiles)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_canonical_smiles ON pubchem_records(canonical_smiles)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_inchikey ON pubchem_records(inchikey)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_iupac_name ON pubchem_records(iupac_name)')
        
        conn.commit()
        conn.close()
        logger.info(f"Database initialized: {self.db_path}")
        
    async def get_pubchem_record(self, cid: int) -> Optional[Dict]:
        """Get a single PubChem record by CID"""
        if not self.session:
            raise RuntimeError("Session not initialized")
            
        url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/{cid}/property/IsomericSMILES,CanonicalSMILES,IUPACName,MolecularFormula,MolecularWeight,InChI,InChIKey/JSON"
        
        try:
            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    if 'PC_Compounds' in data:
                        props = data['PC_Compounds'][0].get('props', [])
                        record = {'cid': cid}
                        
                        for prop in props:
                            label = prop.get('urn', {}).get('label', '')
                            value = prop.get('value', {}).get('sval', '')
                            
                            if label == 'IsomericSMILES':
                                record['isomeric_smiles'] = value
                            elif label == 'CanonicalSMILES':
                                record['canonical_smiles'] = value
                            elif label == 'IUPACName':
                                record['iupac_name'] = value
                            elif label == 'MolecularFormula':
                                record['molecular_formula'] = value
                            elif label == 'MolecularWeight':
                                record['molecular_weight'] = float(value) if value else None
                            elif label == 'InChI':
                                record['inchi'] = value
                            elif label == 'InChIKey':
                                record['inchikey'] = value
                        
                        # Use isomeric SMILES as primary SMILES if available
                        record['smiles'] = record.get('isomeric_smiles') or record.get('canonical_smiles', '')
                        
                        return record
                        
        except Exception as e:
            logger.error(f"Error fetching CID {cid}: {e}")
            
        return None
        
    async def get_pubchem_records_batch(self, cids: List[int]) -> List[Dict]:
        """Get multiple PubChem records in a batch"""
        if not self.session:
            raise RuntimeError("Session not initialized")
            
        if not cids:
            return []
            
        # PubChem batch API
        cid_list = ','.join(map(str, cids))
        url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/{cid_list}/property/IsomericSMILES,CanonicalSMILES,IUPACName,MolecularFormula,MolecularWeight,InChI,InChIKey/JSON"
        
        try:
            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    records = []
                    
                    if 'PC_Compounds' in data:
                        for compound in data['PC_Compounds']:
                            cid = compound.get('id', {}).get('id', {}).get('cid', 0)
                            props = compound.get('props', [])
                            record = {'cid': cid}
                            
                            for prop in props:
                                label = prop.get('urn', {}).get('label', '')
                                value = prop.get('value', {}).get('sval', '')
                                
                                if label == 'IsomericSMILES':
                                    record['isomeric_smiles'] = value
                                elif label == 'CanonicalSMILES':
                                    record['canonical_smiles'] = value
                                elif label == 'IUPACName':
                                    record['iupac_name'] = value
                                elif label == 'MolecularFormula':
                                    record['molecular_formula'] = value
                                elif label == 'MolecularWeight':
                                    record['molecular_weight'] = float(value) if value else None
                                elif label == 'InChI':
                                    record['inchi'] = value
                                elif label == 'InChIKey':
                                    record['inchikey'] = value
                            
                            # Use isomeric SMILES as primary SMILES if available
                            record['smiles'] = record.get('isomeric_smiles') or record.get('canonical_smiles', '')
                            
                            records.append(record)
                    
                    return records
                    
        except Exception as e:
            logger.error(f"Error fetching batch {cids}: {e}")
            
        return []
        
    async def save_records(self, records: List[Dict]):
        """Save records to SQLite database"""
        if not records:
            return
            
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            for record in records:
                cursor.execute('''
                    INSERT OR REPLACE INTO pubchem_records 
                    (cid, smiles, iupac_name, molecular_formula, molecular_weight, 
                     canonical_smiles, isomeric_smiles, inchi, inchikey, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    record.get('cid'),
                    record.get('smiles'),
                    record.get('iupac_name'),
                    record.get('molecular_formula'),
                    record.get('molecular_weight'),
                    record.get('canonical_smiles'),
                    record.get('isomeric_smiles'),
                    record.get('inchi'),
                    record.get('inchikey'),
                    datetime.now().isoformat()
                ))
                
            conn.commit()
            logger.info(f"Saved {len(records)} records to database")
            
        except Exception as e:
            logger.error(f"Error saving records: {e}")
            conn.rollback()
        finally:
            conn.close()
            
    async def download_range(self, start_cid: int, end_cid: int, max_records: Optional[int] = None):
        """Download PubChem records in a CID range"""
        logger.info(f"Starting download from CID {start_cid} to {end_cid}")
        
        total_downloaded = 0
        total_with_iupac = 0
        
        for batch_start in range(start_cid, end_cid + 1, self.batch_size):
            if max_records and total_downloaded >= max_records:
                break
                
            batch_end = min(batch_start + self.batch_size - 1, end_cid)
            cids = list(range(batch_start, batch_end + 1))
            
            logger.info(f"Downloading batch: CIDs {batch_start}-{batch_end}")
            
            records = await self.get_pubchem_records_batch(cids)
            
            if records:
                # Filter records with IUPAC names
                records_with_iupac = [r for r in records if r.get('iupac_name')]
                
                if records_with_iupac:
                    await self.save_records(records_with_iupac)
                    total_with_iupac += len(records_with_iupac)
                    
                total_downloaded += len(records)
                
                logger.info(f"Batch complete: {len(records)} total, {len(records_with_iupac)} with IUPAC names")
                
            # Rate limiting
            await asyncio.sleep(self.delay_between_batches)
            
        logger.info(f"Download complete: {total_downloaded} total records, {total_with_iupac} with IUPAC names")
        return total_downloaded, total_with_iupac
        
    async def get_database_stats(self) -> Dict:
        """Get database statistics"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Total records
            cursor.execute('SELECT COUNT(*) FROM pubchem_records')
            total_records = cursor.fetchone()[0]
            
            # Records with IUPAC names
            cursor.execute('SELECT COUNT(*) FROM pubchem_records WHERE iupac_name IS NOT NULL')
            records_with_iupac = cursor.fetchone()[0]
            
            # CID range
            cursor.execute('SELECT MIN(cid), MAX(cid) FROM pubchem_records')
            min_cid, max_cid = cursor.fetchone()
            
            # Database size
            db_size = os.path.getsize(self.db_path) if os.path.exists(self.db_path) else 0
            
            return {
                'total_records': total_records,
                'records_with_iupac': records_with_iupac,
                'min_cid': min_cid,
                'max_cid': max_cid,
                'database_size_mb': round(db_size / (1024 * 1024), 2),
                'coverage_percentage': round((records_with_iupac / total_records * 100) if total_records > 0 else 0, 2)
            }
            
        finally:
            conn.close()
            
    def lookup_by_smiles(self, smiles: str) -> Optional[Dict]:
        """Look up a record by SMILES string"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                SELECT cid, smiles, iupac_name, molecular_formula, molecular_weight,
                       canonical_smiles, isomeric_smiles, inchi, inchikey
                FROM pubchem_records 
                WHERE smiles = ? OR canonical_smiles = ? OR isomeric_smiles = ?
                LIMIT 1
            ''', (smiles, smiles, smiles))
            
            row = cursor.fetchone()
            if row:
                return {
                    'cid': row[0],
                    'smiles': row[1],
                    'iupac_name': row[2],
                    'molecular_formula': row[3],
                    'molecular_weight': row[4],
                    'canonical_smiles': row[5],
                    'isomeric_smiles': row[6],
                    'inchi': row[7],
                    'inchikey': row[8]
                }
                
        finally:
            conn.close()
            
        return None

async def main():
    """Main function for testing"""
    async with PubChemDownloader() as downloader:
        # Test with a small range
        print("Testing PubChem downloader...")
        
        # Download a small range for testing
        total, with_iupac = await downloader.download_range(1, 1000, max_records=100)
        print(f"Downloaded {total} records, {with_iupac} with IUPAC names")
        
        # Get database stats
        stats = await downloader.get_database_stats()
        print(f"Database stats: {stats}")
        
        # Test lookup
        test_smiles = "CCO"  # Ethanol
        result = downloader.lookup_by_smiles(test_smiles)
        if result:
            print(f"Found {test_smiles}: {result['iupac_name']}")
        else:
            print(f"Not found: {test_smiles}")

if __name__ == "__main__":
    asyncio.run(main()) 