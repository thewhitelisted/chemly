#!/usr/bin/env python3
"""
PubChem Cache Service
Integrates local PubChem cache with the main application
"""

import sqlite3
import logging
from typing import Optional, Dict
import os

logger = logging.getLogger(__name__)

class PubChemCacheService:
    """Service for accessing cached PubChem data"""
    
    def __init__(self, db_path: str = "pubchem_cache.db"):
        self.db_path = db_path
        self._check_database()
        
    def _check_database(self):
        """Check if database exists and has data"""
        if not os.path.exists(self.db_path):
            logger.warning(f"PubChem cache database not found: {self.db_path}")
            return False
            
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute('SELECT COUNT(*) FROM pubchem_records WHERE iupac_name IS NOT NULL')
            count = cursor.fetchone()[0]
            conn.close()
            
            if count > 0:
                logger.info(f"PubChem cache available with {count} IUPAC names")
                return True
            else:
                logger.warning("PubChem cache database exists but has no IUPAC names")
                return False
                
        except Exception as e:
            logger.error(f"Error checking PubChem cache: {e}")
            return False
            
    def lookup_iupac_name(self, smiles: str) -> Optional[str]:
        """Look up IUPAC name by SMILES string"""
        if not os.path.exists(self.db_path):
            return None
            
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Try exact match first
            cursor.execute('''
                SELECT iupac_name FROM pubchem_records 
                WHERE smiles = ? OR canonical_smiles = ? OR isomeric_smiles = ?
                AND iupac_name IS NOT NULL
                LIMIT 1
            ''', (smiles, smiles, smiles))
            
            result = cursor.fetchone()
            if result:
                conn.close()
                return result[0]
                
            # Try InChI match if available
            cursor.execute('''
                SELECT iupac_name FROM pubchem_records 
                WHERE inchi = ? AND iupac_name IS NOT NULL
                LIMIT 1
            ''', (smiles,))
            
            result = cursor.fetchone()
            if result:
                conn.close()
                return result[0]
                
            conn.close()
            return None
            
        except Exception as e:
            logger.error(f"Error looking up SMILES {smiles}: {e}")
            return None
            
    def get_cache_stats(self) -> Dict:
        """Get cache statistics"""
        if not os.path.exists(self.db_path):
            return {
                'available': False,
                'total_records': 0,
                'records_with_iupac': 0,
                'database_size_mb': 0,
                'coverage_percentage': 0
            }
            
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Total records
            cursor.execute('SELECT COUNT(*) FROM pubchem_records')
            total_records = cursor.fetchone()[0]
            
            # Records with IUPAC names
            cursor.execute('SELECT COUNT(*) FROM pubchem_records WHERE iupac_name IS NOT NULL')
            records_with_iupac = cursor.fetchone()[0]
            
            # Database size
            db_size = os.path.getsize(self.db_path)
            
            conn.close()
            
            return {
                'available': True,
                'total_records': total_records,
                'records_with_iupac': records_with_iupac,
                'database_size_mb': round(db_size / (1024 * 1024), 2),
                'coverage_percentage': round((records_with_iupac / total_records * 100) if total_records > 0 else 0, 2)
            }
            
        except Exception as e:
            logger.error(f"Error getting cache stats: {e}")
            return {
                'available': False,
                'error': str(e)
            }
            
    def search_compounds(self, query: str, limit: int = 10) -> list:
        """Search compounds by IUPAC name or molecular formula"""
        if not os.path.exists(self.db_path):
            return []
            
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Search by IUPAC name or molecular formula
            cursor.execute('''
                SELECT cid, smiles, iupac_name, molecular_formula, molecular_weight
                FROM pubchem_records 
                WHERE iupac_name LIKE ? OR molecular_formula LIKE ?
                AND iupac_name IS NOT NULL
                ORDER BY molecular_weight ASC
                LIMIT ?
            ''', (f'%{query}%', f'%{query}%', limit))
            
            results = []
            for row in cursor.fetchall():
                results.append({
                    'cid': row[0],
                    'smiles': row[1],
                    'iupac_name': row[2],
                    'molecular_formula': row[3],
                    'molecular_weight': row[4]
                })
                
            conn.close()
            return results
            
        except Exception as e:
            logger.error(f"Error searching compounds: {e}")
            return []

# Global cache service instance
pubchem_cache = PubChemCacheService()

def get_pubchem_cache() -> PubChemCacheService:
    """Get the global PubChem cache service"""
    return pubchem_cache 