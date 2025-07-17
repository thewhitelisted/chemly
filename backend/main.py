from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Union
from STOUT import translate_forward
import logging
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

class NameRequest(BaseModel):
    smiles: Union[str, List[str]]

class NameResponse(BaseModel):
    names: List[str]

# In-memory LRU cache for translation results (up to 512 unique SMILES)
@lru_cache(maxsize=512)
def cached_translate_forward(smiles: str) -> str:
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