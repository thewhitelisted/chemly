from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Union
from STOUT import translate_forward
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

class NameRequest(BaseModel):
    smiles: Union[str, List[str]]

class NameResponse(BaseModel):
    names: List[str]

def get_name_from_stout(smiles: str) -> str:
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
    names = [get_name_from_stout(smiles) for smiles in smiles_list]
    return {"names": names} 