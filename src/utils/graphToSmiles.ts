import type { MoleculeGraph, Atom, Bond } from '../models/MoleculeGraph';

export interface SmilesExportResult {
  success: boolean;
  smiles?: string;
  error?: string;
}

export async function exportToSmiles(graph: MoleculeGraph): Promise<SmilesExportResult> {
  try {
    console.log('=== SMILES EXPORT DEBUG ===');
    console.log('Input graph:', graph);
    console.log('Total atoms:', graph.atoms.length);
    console.log('Total bonds:', graph.bonds.length);
    console.log('Atom elements:', graph.atoms.map(a => `${a.element}(id:${a.id.slice(0,8)})`));
    console.log('Bonds:', graph.bonds.map(b => `${b.sourceAtomId.slice(0,8)}-${b.targetAtomId.slice(0,8)} (${b.type})`));
    
    if (graph.atoms.length === 0) {
      console.log('Empty graph, returning empty SMILES');
      return { success: true, smiles: '' };
    }

    // Generate proper SMILES using graph traversal
    const smiles = generateProperSmiles(graph);
    
    console.log('Generated SMILES:', smiles);
    console.log('=== END SMILES EXPORT ===');
    
    return {
      success: true,
      smiles
    };
  } catch (error) {
    console.error('Error exporting SMILES:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Proper SMILES generator following SMILES notation rules
function generateProperSmiles(graph: MoleculeGraph): string {
  if (graph.atoms.length === 0) return '';
  
  // Filter out explicit hydrogen atoms - they should be implicit in SMILES
  const nonHydrogenAtoms = graph.atoms.filter(atom => atom.element !== 'H');
  
  if (nonHydrogenAtoms.length === 0) {
    return '[H]'; // Only hydrogen atoms
  }
  
  // Handle single non-hydrogen atom case
  if (nonHydrogenAtoms.length === 1) {
    const atom = nonHydrogenAtoms[0];
    return formatAtomSmiles(atom, graph);
  }
  
  // Create adjacency list for non-hydrogen atoms only
  const adjacencyList = buildNonHydrogenAdjacencyList(graph);
  const visited = new Set<string>();
  const ringClosures = new Map<string, number>();
  let ringCounter = 1;
  
  // Find starting atom (prefer atoms with only one bond, then any atom)
  const startAtom = findStartingAtom(nonHydrogenAtoms, adjacencyList);
  
  // Perform depth-first traversal to generate SMILES
  const result = traverseForSmiles(
    startAtom, 
    adjacencyList, 
    visited, 
    ringClosures, 
    ringCounter, 
    graph,
    null // no parent bond
  );
  
  return result.smiles;
}

function buildNonHydrogenAdjacencyList(graph: MoleculeGraph): Map<string, Array<{atom: Atom, bond: Bond}>> {
  const adjacencyList = new Map<string, Array<{atom: Atom, bond: Bond}>>();
  
  // Initialize adjacency list for non-hydrogen atoms only
  graph.atoms.forEach(atom => {
    if (atom.element !== 'H') {
      adjacencyList.set(atom.id, []);
    }
  });
  
  // Add connections between non-hydrogen atoms only
  graph.bonds.forEach(bond => {
    const sourceAtom = graph.atoms.find(a => a.id === bond.sourceAtomId);
    const targetAtom = graph.atoms.find(a => a.id === bond.targetAtomId);
    
    if (sourceAtom && targetAtom && sourceAtom.element !== 'H' && targetAtom.element !== 'H') {
      adjacencyList.get(bond.sourceAtomId)?.push({atom: targetAtom, bond});
      adjacencyList.get(bond.targetAtomId)?.push({atom: sourceAtom, bond});
    }
  });
  
  return adjacencyList;
}

function findStartingAtom(atoms: Atom[], adjacencyList: Map<string, Array<{atom: Atom, bond: Bond}>>): Atom {
  // Prefer terminal atoms (degree 1)
  for (const atom of atoms) {
    const neighbors = adjacencyList.get(atom.id) || [];
    if (neighbors.length === 1) {
      return atom;
    }
  }
  
  // Otherwise, start with the first atom
  return atoms[0];
}

function traverseForSmiles(
  currentAtom: Atom,
  adjacencyList: Map<string, Array<{atom: Atom, bond: Bond}>>,
  visited: Set<string>,
  ringClosures: Map<string, number>,
  ringCounter: number,
  graph: MoleculeGraph,
  fromBond: Bond | null
): {smiles: string, ringCounter: number} {
  
  visited.add(currentAtom.id);
  let smiles = '';
  
  // Add current atom to SMILES
  smiles += formatAtomSmiles(currentAtom, graph);
  
  const neighbors = adjacencyList.get(currentAtom.id) || [];
  const unvisitedNeighbors: Array<{atom: Atom, bond: Bond}> = [];
  const ringNeighbors: Array<{atom: Atom, bond: Bond}> = [];
  
  // Separate unvisited neighbors from ring closures
  neighbors.forEach(neighbor => {
    if (!visited.has(neighbor.atom.id)) {
      unvisitedNeighbors.push(neighbor);
    } else if (neighbor.bond !== fromBond) {
      // This is a ring closure
      ringNeighbors.push(neighbor);
    }
  });
  
  // Handle ring closures first
  ringNeighbors.forEach(neighbor => {
    const existingRing = ringClosures.get(neighbor.bond.id);
    if (existingRing) {
      smiles += formatBondSmiles(neighbor.bond) + existingRing;
    } else {
      ringClosures.set(neighbor.bond.id, ringCounter);
      smiles += formatBondSmiles(neighbor.bond) + ringCounter;
      ringCounter++;
    }
  });
  
  // Handle branches
  if (unvisitedNeighbors.length > 1) {
    // First neighbor continues the main chain
    const mainNeighbor = unvisitedNeighbors[0];
    smiles += formatBondSmiles(mainNeighbor.bond);
    const mainResult = traverseForSmiles(
      mainNeighbor.atom, 
      adjacencyList, 
      visited, 
      ringClosures, 
      ringCounter, 
      graph, 
      mainNeighbor.bond
    );
    smiles += mainResult.smiles;
    ringCounter = mainResult.ringCounter;
    
    // Remaining neighbors become branches
    for (let i = 1; i < unvisitedNeighbors.length; i++) {
      const branchNeighbor = unvisitedNeighbors[i];
      smiles += '(' + formatBondSmiles(branchNeighbor.bond);
      const branchResult = traverseForSmiles(
        branchNeighbor.atom, 
        adjacencyList, 
        visited, 
        ringClosures, 
        ringCounter, 
        graph, 
        branchNeighbor.bond
      );
      smiles += branchResult.smiles + ')';
      ringCounter = branchResult.ringCounter;
    }
  } else if (unvisitedNeighbors.length === 1) {
    // Continue linear chain
    const neighbor = unvisitedNeighbors[0];
    smiles += formatBondSmiles(neighbor.bond);
    const result = traverseForSmiles(
      neighbor.atom, 
      adjacencyList, 
      visited, 
      ringClosures, 
      ringCounter, 
      graph, 
      neighbor.bond
    );
    smiles += result.smiles;
    ringCounter = result.ringCounter;
  }
  
  return {smiles, ringCounter};
}

function formatAtomSmiles(atom: Atom, graph: MoleculeGraph): string {
  const element = atom.element;
  const charge = atom.charge || 0;
  
  // Handle hydrogen atoms explicitly (though we usually filter them out)
  if (element === 'H') {
    return '[H]';
  }
  
  // Simple organic atoms (BCNOFPS) in standard valence states don't need brackets
  const simpleOrganicAtoms = ['B', 'C', 'N', 'O', 'F', 'P', 'S', 'Cl', 'Br', 'I'];
  
  if (simpleOrganicAtoms.includes(element) && charge === 0) {
    // Check if aromatic (simplified)
    const isAromatic = isAtomAromatic(atom, graph);
    return isAromatic ? element.toLowerCase() : element;
  }
  
  // Need brackets for charges or unusual atoms
  let atomString = element;
  
  if (charge > 0) {
    atomString += charge === 1 ? '+' : `+${charge}`;
  } else if (charge < 0) {
    atomString += charge === -1 ? '-' : `${charge}`;
  }
  
  return `[${atomString}]`;
}

function formatBondSmiles(bond: Bond): string {
  switch (bond.type) {
    case 'single': return ''; // Single bonds are implicit
    case 'double': return '=';
    case 'triple': return '#';
    case 'wedge': return ''; // Stereochemistry - simplified as single
    case 'dash': return ''; // Stereochemistry - simplified as single
    default: return '';
  }
}

function isAtomAromatic(atom: Atom, graph: MoleculeGraph): boolean {
  // Simplified aromaticity detection
  // In a real implementation, this would use proper aromaticity algorithms
  
  // Check if atom is in a 6-membered ring with alternating double bonds
  const neighbors = graph.bonds.filter(bond => 
    bond.sourceAtomId === atom.id || bond.targetAtomId === atom.id
  );
  
  // Very simplified: if carbon in a ring with some double bonds, might be aromatic
  if (atom.element === 'C' && neighbors.length >= 2) {
    const hasDoubleBond = neighbors.some(bond => bond.type === 'double');
    return hasDoubleBond;
  }
  
  return false;
}

// Placeholder for future backend integration
export async function setupSmilesBackend(): Promise<boolean> {
  return false;
}
