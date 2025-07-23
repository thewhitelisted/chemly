
import type { MoleculeGraph } from '../models/MoleculeGraph';
import { graphToOclMolecule } from './oclGraphAdapter';

export interface SmilesExportResult {
  success: boolean;
  smiles?: string;
  error?: string;
}

export async function exportToSmiles(graph: MoleculeGraph): Promise<SmilesExportResult> {
  try {
    const molecule = graphToOclMolecule(graph);
    const smiles = molecule.toSmiles();
    return { success: true, smiles };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
