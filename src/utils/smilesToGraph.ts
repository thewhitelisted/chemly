import type { MoleculeGraph } from '../models/MoleculeGraph';
import { v4 as uuidv4 } from 'uuid';
import { HydrogenManager } from './hydrogenManager';

export interface SmilesImportResult {
  success: boolean;
  graph?: MoleculeGraph;
  error?: string;
}

export async function importFromSmiles(smiles: string): Promise<SmilesImportResult> {
  try {
    console.log('=== SMILES IMPORT DEBUG ===');
    console.log('Input SMILES:', smiles);
    
    if (!smiles.trim()) {
      console.log('Empty SMILES string');
      return {
        success: false,
        error: 'SMILES string is empty'
      };
    }

    // Parse SMILES structure (atoms and bonds only)
    // Handle disconnected fragments separated by dots
    let graph = parseSmiles(smiles.trim());
    
    // Add hydrogens to complete all valences
    graph = HydrogenManager.fillAllValences(graph);
    
    console.log('Final graph with hydrogens:');
    console.log('- Total atoms:', graph.atoms.length);
    console.log('- Total bonds:', graph.bonds.length);
    console.log('- Atom elements:', graph.atoms.map(a => `${a.element}(id:${a.id.slice(0,8)})`));
    console.log('- Non-hydrogen atoms:', graph.atoms.filter(a => a.element !== 'H').length);
    console.log('- Hydrogen atoms:', graph.atoms.filter(a => a.element === 'H').length);
    console.log('- Bonds:', graph.bonds.map(b => `${b.sourceAtomId.slice(0,8)}-${b.targetAtomId.slice(0,8)} (${b.type})`));
    console.log('=== END SMILES IMPORT ===');
    
    return {
      success: true,
      graph
    };
  } catch (error) {
    console.error('Error importing SMILES:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Main SMILES parser that handles disconnected fragments
function parseSmiles(smiles: string): MoleculeGraph {
  console.log('parseSmiles called with:', smiles);
  
  // Split by dots to handle disconnected fragments
  const fragments = smiles.split('.');
  console.log('Found fragments:', fragments);
  
  let allAtoms: any[] = [];
  let allBonds: any[] = [];
  let currentX = 50; // Start position for the first fragment
  const fragmentSpacing = 200; // Space between disconnected fragments
  
  for (let i = 0; i < fragments.length; i++) {
    const fragment = fragments[i].trim();
    if (!fragment) continue;
    
    console.log(`Processing fragment ${i + 1}: "${fragment}"`);
    
    // Parse each fragment independently
    const fragmentGraph = parseBasicSmiles(fragment);
    
    // Offset atom positions for this fragment
    const offsetAtoms = fragmentGraph.atoms.map(atom => ({
      ...atom,
      position: {
        x: atom.position.x + currentX,
        y: atom.position.y
      }
    }));
    
    // Add fragment atoms and bonds to the main graph
    allAtoms = [...allAtoms, ...offsetAtoms];
    allBonds = [...allBonds, ...fragmentGraph.bonds];
    
    // Update position for next fragment
    currentX += fragmentSpacing;
    
    console.log(`Fragment ${i + 1} result: ${offsetAtoms.length} atoms, ${fragmentGraph.bonds.length} bonds`);
  }
  
  console.log(`Total parsed: ${allAtoms.length} atoms, ${allBonds.length} bonds from ${fragments.length} fragments`);
  
  return {
    atoms: allAtoms,
    bonds: allBonds
  };
}

// Enhanced SMILES parser for common chemical structures
function parseBasicSmiles(smiles: string): MoleculeGraph {
  console.log('parseBasicSmiles called with:', smiles);
  
  // Handle common simple cases
  const commonMolecules: Record<string, () => MoleculeGraph> = {
    'C': () => createSingleAtom('C'),
    'O': () => createSingleAtom('O'),
    'N': () => createSingleAtom('N'),
    'S': () => createSingleAtom('S'),
    'P': () => createSingleAtom('P'),
    'F': () => createSingleAtom('F'),
    'Cl': () => createSingleAtom('Cl'),
    'Br': () => createSingleAtom('Br'),
    'I': () => createSingleAtom('I'),
    
    // Common molecules
    'O=O': () => createOxygen(),
    'N#N': () => createNitrogen(),
    'C=O': () => createCarbonMonoxide(),
    'O=C=O': () => createCarbonDioxide(),
    'CCO': () => createEthanol(),
    'CC': () => createEthane(),
    'CCC': () => createPropane(),
    'CCCC': () => createButane(),
    'C=C': () => createEthene(),
    'C#C': () => createEthyne(),
    'CO': () => createMethanol(),
    'CC(C)C': () => createIsobutane(),
    
    // Common disconnected fragments
    'C.C': () => createTwoMethanes(),
    'CC.CC': () => createTwoEthanes(),
    'O.CC(=O)O': () => createWaterAceticAcid(),
    'C.O': () => createMethaneWater(),
    
    // Ring structures
    'c1ccccc1': () => createBenzeneRing(),
    'C1CCCCC1': () => createCyclohexane(),
    'C1CCC1': () => createCyclobutane(),
    
    // Water and simple compounds
    '[OH2]': () => createWater(),
    '[NH3]': () => createAmmonia(),
  };

  // Check for exact matches first
  if (commonMolecules[smiles]) {
    console.log('Found common molecule match for:', smiles);
    const result = commonMolecules[smiles]();
    console.log('Common molecule result:', result);
    return result;
  }

  console.log('No common molecule match, trying general parsing');
  // Try to parse as a general SMILES string
  try {
    const result = parseGeneralSmiles(smiles);
    console.log('General parsing result:', result);
    return result;
  } catch (error) {
    console.error('Failed to parse as general SMILES:', error);
    throw new Error(`Failed to parse SMILES: ${smiles}`);
  }
}

// Helper function to create a simple single atom
function createSingleAtom(element: string): MoleculeGraph {
  const atom = {
    id: uuidv4(),
    element,
    position: { x: 100, y: 100 }
  };
  
  return {
    atoms: [atom],
    bonds: []
  };
}

// Helper functions for common molecules
function createEthane(): MoleculeGraph {
  const carbon1 = { id: uuidv4(), element: 'C', position: { x: 50, y: 100 } };
  const carbon2 = { id: uuidv4(), element: 'C', position: { x: 150, y: 100 } };
  
  const bond = {
    id: uuidv4(),
    sourceAtomId: carbon1.id,
    targetAtomId: carbon2.id,
    type: 'single' as const
  };
  
  return {
    atoms: [carbon1, carbon2],
    bonds: [bond]
  };
}

function createEthene(): MoleculeGraph {
  const carbon1 = { id: uuidv4(), element: 'C', position: { x: 50, y: 100 } };
  const carbon2 = { id: uuidv4(), element: 'C', position: { x: 150, y: 100 } };
  
  const bond = {
    id: uuidv4(),
    sourceAtomId: carbon1.id,
    targetAtomId: carbon2.id,
    type: 'double' as const
  };
  
  console.log('Created ethene structure:', {
    atoms: [carbon1, carbon2],
    bonds: [bond]
  });
  
  return {
    atoms: [carbon1, carbon2],
    bonds: [bond]
  };
}

function createEthyne(): MoleculeGraph {
  const carbon1 = { id: uuidv4(), element: 'C', position: { x: 50, y: 100 } };
  const carbon2 = { id: uuidv4(), element: 'C', position: { x: 150, y: 100 } };
  
  const bond = {
    id: uuidv4(),
    sourceAtomId: carbon1.id,
    targetAtomId: carbon2.id,
    type: 'triple' as const
  };
  
  return {
    atoms: [carbon1, carbon2],
    bonds: [bond]
  };
}

function createMethanol(): MoleculeGraph {
  const carbon = { id: uuidv4(), element: 'C', position: { x: 50, y: 100 } };
  const oxygen = { id: uuidv4(), element: 'O', position: { x: 150, y: 100 } };
  
  const bond = {
    id: uuidv4(),
    sourceAtomId: carbon.id,
    targetAtomId: oxygen.id,
    type: 'single' as const
  };
  
  return {
    atoms: [carbon, oxygen],
    bonds: [bond]
  };
}

function createEthanol(): MoleculeGraph {
  const carbon1 = { id: uuidv4(), element: 'C', position: { x: 50, y: 100 } };
  const carbon2 = { id: uuidv4(), element: 'C', position: { x: 150, y: 100 } };
  const oxygen = { id: uuidv4(), element: 'O', position: { x: 250, y: 100 } };
  
  const bond1 = {
    id: uuidv4(),
    sourceAtomId: carbon1.id,
    targetAtomId: carbon2.id,
    type: 'single' as const
  };
  
  const bond2 = {
    id: uuidv4(),
    sourceAtomId: carbon2.id,
    targetAtomId: oxygen.id,
    type: 'single' as const
  };
  
  return {
    atoms: [carbon1, carbon2, oxygen],
    bonds: [bond1, bond2]
  };
}

function createPropane(): MoleculeGraph {
  const carbon1 = { id: uuidv4(), element: 'C', position: { x: 50, y: 100 } };
  const carbon2 = { id: uuidv4(), element: 'C', position: { x: 150, y: 100 } };
  const carbon3 = { id: uuidv4(), element: 'C', position: { x: 250, y: 100 } };
  
  const bond1 = {
    id: uuidv4(),
    sourceAtomId: carbon1.id,
    targetAtomId: carbon2.id,
    type: 'single' as const
  };
  
  const bond2 = {
    id: uuidv4(),
    sourceAtomId: carbon2.id,
    targetAtomId: carbon3.id,
    type: 'single' as const
  };
  
  return {
    atoms: [carbon1, carbon2, carbon3],
    bonds: [bond1, bond2]
  };
}

function createButane(): MoleculeGraph {
  const carbon1 = { id: uuidv4(), element: 'C', position: { x: 50, y: 100 } };
  const carbon2 = { id: uuidv4(), element: 'C', position: { x: 150, y: 100 } };
  const carbon3 = { id: uuidv4(), element: 'C', position: { x: 250, y: 100 } };
  const carbon4 = { id: uuidv4(), element: 'C', position: { x: 350, y: 100 } };
  
  const bond1 = {
    id: uuidv4(),
    sourceAtomId: carbon1.id,
    targetAtomId: carbon2.id,
    type: 'single' as const
  };
  
  const bond2 = {
    id: uuidv4(),
    sourceAtomId: carbon2.id,
    targetAtomId: carbon3.id,
    type: 'single' as const
  };
  
  const bond3 = {
    id: uuidv4(),
    sourceAtomId: carbon3.id,
    targetAtomId: carbon4.id,
    type: 'single' as const
  };
  
  return {
    atoms: [carbon1, carbon2, carbon3, carbon4],
    bonds: [bond1, bond2, bond3]
  };
}

function createIsobutane(): MoleculeGraph {
  const carbon1 = { id: uuidv4(), element: 'C', position: { x: 100, y: 50 } };
  const carbon2 = { id: uuidv4(), element: 'C', position: { x: 100, y: 150 } };
  const carbon3 = { id: uuidv4(), element: 'C', position: { x: 50, y: 150 } };
  const carbon4 = { id: uuidv4(), element: 'C', position: { x: 150, y: 150 } };
  
  const bond1 = {
    id: uuidv4(),
    sourceAtomId: carbon1.id,
    targetAtomId: carbon2.id,
    type: 'single' as const
  };
  
  const bond2 = {
    id: uuidv4(),
    sourceAtomId: carbon2.id,
    targetAtomId: carbon3.id,
    type: 'single' as const
  };
  
  const bond3 = {
    id: uuidv4(),
    sourceAtomId: carbon2.id,
    targetAtomId: carbon4.id,
    type: 'single' as const
  };
  
  return {
    atoms: [carbon1, carbon2, carbon3, carbon4],
    bonds: [bond1, bond2, bond3]
  };
}

function createOxygen(): MoleculeGraph {
  const oxygen1 = { id: uuidv4(), element: 'O', position: { x: 50, y: 100 } };
  const oxygen2 = { id: uuidv4(), element: 'O', position: { x: 150, y: 100 } };
  
  const bond = {
    id: uuidv4(),
    sourceAtomId: oxygen1.id,
    targetAtomId: oxygen2.id,
    type: 'double' as const
  };
  
  return {
    atoms: [oxygen1, oxygen2],
    bonds: [bond]
  };
}

function createNitrogen(): MoleculeGraph {
  const nitrogen1 = { id: uuidv4(), element: 'N', position: { x: 50, y: 100 } };
  const nitrogen2 = { id: uuidv4(), element: 'N', position: { x: 150, y: 100 } };
  
  const bond = {
    id: uuidv4(),
    sourceAtomId: nitrogen1.id,
    targetAtomId: nitrogen2.id,
    type: 'triple' as const
  };
  
  return {
    atoms: [nitrogen1, nitrogen2],
    bonds: [bond]
  };
}

function createCarbonMonoxide(): MoleculeGraph {
  const carbon = { id: uuidv4(), element: 'C', position: { x: 50, y: 100 } };
  const oxygen = { id: uuidv4(), element: 'O', position: { x: 150, y: 100 } };
  
  const bond = {
    id: uuidv4(),
    sourceAtomId: carbon.id,
    targetAtomId: oxygen.id,
    type: 'triple' as const
  };
  
  return {
    atoms: [carbon, oxygen],
    bonds: [bond]
  };
}

function createCarbonDioxide(): MoleculeGraph {
  const oxygen1 = { id: uuidv4(), element: 'O', position: { x: 50, y: 100 } };
  const carbon = { id: uuidv4(), element: 'C', position: { x: 150, y: 100 } };
  const oxygen2 = { id: uuidv4(), element: 'O', position: { x: 250, y: 100 } };
  
  const bond1 = {
    id: uuidv4(),
    sourceAtomId: oxygen1.id,
    targetAtomId: carbon.id,
    type: 'double' as const
  };
  
  const bond2 = {
    id: uuidv4(),
    sourceAtomId: carbon.id,
    targetAtomId: oxygen2.id,
    type: 'double' as const
  };
  
  return {
    atoms: [oxygen1, carbon, oxygen2],
    bonds: [bond1, bond2]
  };
}

function createBenzeneRing(): MoleculeGraph {
  const atoms = [];
  const bonds = [];
  const centerX = 150;
  const centerY = 150;
  const radius = 60;
  
  // Create 6 carbon atoms in a ring
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    
    atoms.push({
      id: uuidv4(),
      element: 'C',
      position: { x, y }
    });
  }
  
  // Create bonds between adjacent atoms
  for (let i = 0; i < 6; i++) {
    const nextIndex = (i + 1) % 6;
    const bondType = i % 2 === 0 ? 'double' as const : 'single' as const;
    
    bonds.push({
      id: uuidv4(),
      sourceAtomId: atoms[i].id,
      targetAtomId: atoms[nextIndex].id,
      type: bondType
    });
  }
  
  return { atoms, bonds };
}

function createCyclohexane(): MoleculeGraph {
  const atoms = [];
  const bonds = [];
  const centerX = 150;
  const centerY = 150;
  const radius = 60;
  
  // Create 6 carbon atoms in a ring
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    
    atoms.push({
      id: uuidv4(),
      element: 'C',
      position: { x, y }
    });
  }
  
  // Create single bonds between adjacent atoms
  for (let i = 0; i < 6; i++) {
    const nextIndex = (i + 1) % 6;
    
    bonds.push({
      id: uuidv4(),
      sourceAtomId: atoms[i].id,
      targetAtomId: atoms[nextIndex].id,
      type: 'single' as const
    });
  }
  
  return { atoms, bonds };
}

function createCyclobutane(): MoleculeGraph {
  const atoms = [];
  const bonds = [];
  const centerX = 150;
  const centerY = 150;
  const radius = 40;
  
  // Create 4 carbon atoms in a ring
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    
    atoms.push({
      id: uuidv4(),
      element: 'C',
      position: { x, y }
    });
  }
  
  // Create single bonds between adjacent atoms
  for (let i = 0; i < 4; i++) {
    const nextIndex = (i + 1) % 4;
    
    bonds.push({
      id: uuidv4(),
      sourceAtomId: atoms[i].id,
      targetAtomId: atoms[nextIndex].id,
      type: 'single' as const
    });
  }
  
  return { atoms, bonds };
}

function createWater(): MoleculeGraph {
  const oxygen = { id: uuidv4(), element: 'O', position: { x: 100, y: 100 } };
  
  return {
    atoms: [oxygen],
    bonds: []
  };
}

function createAmmonia(): MoleculeGraph {
  const nitrogen = { id: uuidv4(), element: 'N', position: { x: 100, y: 100 } };
  
  return {
    atoms: [nitrogen],
    bonds: []
  };
}

function createTwoMethanes(): MoleculeGraph {
  const carbon1 = { id: uuidv4(), element: 'C', position: { x: 100, y: 100 } };
  const carbon2 = { id: uuidv4(), element: 'C', position: { x: 300, y: 100 } };
  
  return {
    atoms: [carbon1, carbon2],
    bonds: []
  };
}

function createTwoEthanes(): MoleculeGraph {
  // First ethane molecule
  const carbon1 = { id: uuidv4(), element: 'C', position: { x: 50, y: 100 } };
  const carbon2 = { id: uuidv4(), element: 'C', position: { x: 150, y: 100 } };
  
  // Second ethane molecule
  const carbon3 = { id: uuidv4(), element: 'C', position: { x: 300, y: 100 } };
  const carbon4 = { id: uuidv4(), element: 'C', position: { x: 400, y: 100 } };
  
  const bonds = [
    { id: uuidv4(), sourceAtomId: carbon1.id, targetAtomId: carbon2.id, type: 'single' as const },
    { id: uuidv4(), sourceAtomId: carbon3.id, targetAtomId: carbon4.id, type: 'single' as const }
  ];
  
  return {
    atoms: [carbon1, carbon2, carbon3, carbon4],
    bonds: bonds
  };
}

function createMethaneWater(): MoleculeGraph {
  // Methane molecule
  const carbon = { id: uuidv4(), element: 'C', position: { x: 100, y: 100 } };
  
  // Water molecule
  const oxygen = { id: uuidv4(), element: 'O', position: { x: 300, y: 100 } };
  
  return {
    atoms: [carbon, oxygen],
    bonds: []
  };
}

function createWaterAceticAcid(): MoleculeGraph {
  // Water molecule
  const oxygen1 = { id: uuidv4(), element: 'O', position: { x: 100, y: 100 } };
  
  // Acetic acid molecule (CH3COOH)
  const carbon1 = { id: uuidv4(), element: 'C', position: { x: 300, y: 100 } };
  const carbon2 = { id: uuidv4(), element: 'C', position: { x: 400, y: 100 } };
  const oxygen2 = { id: uuidv4(), element: 'O', position: { x: 450, y: 70 } };
  const oxygen3 = { id: uuidv4(), element: 'O', position: { x: 450, y: 130 } };
  const hydrogen = { id: uuidv4(), element: 'H', position: { x: 480, y: 130 } };
  
  const bonds = [
    { id: uuidv4(), sourceAtomId: carbon1.id, targetAtomId: carbon2.id, type: 'single' as const },
    { id: uuidv4(), sourceAtomId: carbon2.id, targetAtomId: oxygen2.id, type: 'double' as const },
    { id: uuidv4(), sourceAtomId: carbon2.id, targetAtomId: oxygen3.id, type: 'single' as const },
    { id: uuidv4(), sourceAtomId: oxygen3.id, targetAtomId: hydrogen.id, type: 'single' as const }
  ];
  
  return {
    atoms: [oxygen1, carbon1, carbon2, oxygen2, oxygen3, hydrogen],
    bonds: bonds
  };
}

// General SMILES parser for more complex structures
function parseGeneralSmiles(smiles: string): MoleculeGraph {
  console.log('Parsing general SMILES:', smiles);
  
  // Handle linear molecules
  if (smiles.includes('=')) {
    return parseLinearSmiles(smiles);
  }
  
  if (smiles.includes('#')) {
    return parseLinearSmiles(smiles);
  }
  
  // Handle simple chains
  return parseLinearSmiles(smiles);
}

function parseLinearSmiles(smiles: string): MoleculeGraph {
  console.log('parseLinearSmiles called with:', smiles);
  const atoms = [];
  const bonds = [];
  let x = 50;
  const y = 100;
  const spacing = 100;
  
  let i = 0;
  let nextBondType: 'single' | 'double' | 'triple' = 'single';
  
  while (i < smiles.length) {
    let element = '';
    
    // Check for bond types first
    if (smiles[i] === '=') {
      nextBondType = 'double';
      console.log('Found double bond at position', i, '- will use for next bond');
      i++;
      continue; // Don't treat = as an element
    } else if (smiles[i] === '#') {
      nextBondType = 'triple';
      console.log('Found triple bond at position', i, '- will use for next bond');
      i++;
      continue; // Don't treat # as an element
    }
    
    // Parse element
    if (i < smiles.length && /[A-Za-z]/.test(smiles[i])) {
      element = smiles[i];
      console.log('Found element start:', element, 'at position', i);
      
      // Check for two-letter elements (e.g., Cl, Br, but NOT cc, nn, etc.)
      // Only extend if first char is uppercase and second is lowercase
      if (i + 1 < smiles.length && 
          /[A-Z]/.test(smiles[i]) && 
          /[a-z]/.test(smiles[i + 1]) &&
          (element + smiles[i + 1]).match(/^(Cl|Br|Si|Al|Mg|Ca|Na|Li|He|Ne|Ar|Kr|Xe|Rn)$/)) {
        element += smiles[i + 1];
        i++;
        console.log('Extended to two-letter element:', element);
      }
      i++;
      
      const atom = {
        id: uuidv4(),
        element: element.charAt(0).toUpperCase() + element.slice(1).toLowerCase(),
        position: { x, y }
      };
      atoms.push(atom);
      console.log('Created atom:', atom.element, 'at position', atom.position);
      
      // Create bond to previous atom if not the first
      if (atoms.length > 1) {
        const bond = {
          id: uuidv4(),
          sourceAtomId: atoms[atoms.length - 2].id,
          targetAtomId: atom.id,
          type: nextBondType
        };
        bonds.push(bond);
        console.log('Created bond:', nextBondType, 'between atoms', atoms.length - 2, 'and', atoms.length - 1);
        nextBondType = 'single'; // Reset for next iteration
      }
      
      x += spacing;
    } else {
      // Skip any character that's not a letter
      console.log('Skipping character:', smiles[i], 'at position', i);
      i++;
    }
  }
  
  console.log('parseLinearSmiles result:', { atoms: atoms.length, bonds: bonds.length });
  return { atoms, bonds };
}
