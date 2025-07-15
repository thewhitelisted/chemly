import * as OCL from 'openchemlib';
import type { MoleculeGraph } from '../models/MoleculeGraph';
import { oclMoleculeToGraph } from './oclGraphAdapter';

export interface SmilesImportResult {
  success: boolean;
  graph?: MoleculeGraph;
  error?: string;
}

export async function importFromSmiles(smiles: string): Promise<SmilesImportResult> {
  try {
    if (!smiles.trim()) return { success: false, error: 'SMILES string is empty' };
    const molecule = OCL.Molecule.fromSmiles(smiles.trim());
    const graph = oclMoleculeToGraph(molecule);
    return { success: true, graph };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
