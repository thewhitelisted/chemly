from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Union
from STOUT import translate_forward
import logging
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache
from pubchempy import get_compounds

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

class NameRequest(BaseModel):
    smiles: Union[str, List[str]]

class NameResponse(BaseModel):
    names: List[str]

# Helper to get IUPAC name from PubChem

def pubchem_name_from_smiles(smiles: str) -> str:
    try:
        compounds = get_compounds(smiles, 'smiles')
        if compounds and hasattr(compounds[0], 'iupac_name') and compounds[0].iupac_name:
            logger.info(f"PubChem IUPAC for {smiles}: {compounds[0].iupac_name}")
            return compounds[0].iupac_name
        else:
            logger.info(f"No PubChem IUPAC name found for {smiles}")
            return None
    except Exception as e:
        logger.error(f"PubChem lookup failed for SMILES '{smiles}': {e}")
        return None

# In-memory LRU cache for translation results (up to 512 unique SMILES)
@lru_cache(maxsize=512)
def cached_translate_forward(smiles: str) -> str:
    # Try PubChem first
    pubchem_name = pubchem_name_from_smiles(smiles)
    if pubchem_name:
        return pubchem_name
    # Fallback to STOUT
    try:
        iupac_name = translate_forward(smiles)
        logger.info(f"STOUT response for {smiles}: {iupac_name}")
        return iupac_name if iupac_name else "No name found"
    except Exception as e:
        logger.error(f"STOUT failed for SMILES '{smiles}': {e}")
        return "No name found"

@app.post("/api/name", response_model=NameResponse)
def get_molecule_name(req: NameRequest):
    smiles_list = req.smiles if isinstance(req.smiles, list) else [req.smiles]
    logger.info(f"Processing {smiles_list} SMILES strings")
    # Use ThreadPoolExecutor to parallelize up to 2 tasks (matching CPU count)
    with ThreadPoolExecutor(max_workers=2) as executor:
        names = list(executor.map(cached_translate_forward, smiles_list))
    return {"names": names}