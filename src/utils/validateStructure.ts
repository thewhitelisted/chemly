import type { MoleculeGraph, Atom, ValidationWarning, MoleculeValidation } from '../models/MoleculeGraph';
import { MoleculeGraphUtils } from '../models/MoleculeGraph';

// Standard valences for common elements
const ELEMENT_VALENCES: Record<string, number[]> = {
  'H': [1],
  'C': [4],
  'N': [3, 5],
  'O': [2],
  'P': [3, 5],
  'S': [2, 4, 6],
  'F': [1],
  'Cl': [1, 3, 5, 7],
  'Br': [1, 3, 5, 7],
  'I': [1, 3, 5, 7]
};

function getBondOrder(bondType: string): number {
  switch (bondType) {
    case 'single':
    case 'wedge':
      return 1;
    case 'double':
      return 2;
    case 'triple':
      return 3;
    default:
      return 1;
  }
}

function calculateAtomValence(graph: MoleculeGraph, atom: Atom): number {
  const bonds = MoleculeGraphUtils.getBondsForAtom(graph, atom.id);
  return bonds.reduce((total, bond) => total + getBondOrder(bond.type), 0);
}

function validateAtomValence(graph: MoleculeGraph, atom: Atom): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  const expectedValences = ELEMENT_VALENCES[atom.element];
  
  if (!expectedValences) {
    // Unknown element
    warnings.push({
      id: `unknown-element-${atom.id}`,
      type: 'valence',
      message: `Unknown element: ${atom.element}`,
      atomIds: [atom.id],
      severity: 'warning'
    });
    return warnings;
  }

  const actualValence = calculateAtomValence(graph, atom);
  const implicitH = atom.implicitHydrogens || 0;
  const totalValence = actualValence + implicitH;

  if (!expectedValences.includes(totalValence)) {
    const expectedStr = expectedValences.length === 1 
      ? expectedValences[0].toString()
      : expectedValences.join(' or ');
    
    warnings.push({
      id: `valence-${atom.id}`,
      type: 'valence',
      message: `${atom.element} has valence ${totalValence}, expected ${expectedStr}`,
      atomIds: [atom.id],
      severity: 'error'
    });
  }

  return warnings;
}

function validateConnectivity(graph: MoleculeGraph): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  
  // Find isolated atoms (no bonds)
  const isolatedAtoms = graph.atoms.filter(atom => {
    const bonds = MoleculeGraphUtils.getBondsForAtom(graph, atom.id);
    return bonds.length === 0;
  });

  if (isolatedAtoms.length > 0) {
    isolatedAtoms.forEach(atom => {
      warnings.push({
        id: `isolated-${atom.id}`,
        type: 'connectivity',
        message: `Isolated atom: ${atom.element}`,
        atomIds: [atom.id],
        severity: 'info'
      });
    });
  }

  return warnings;
}

function validateCharges(graph: MoleculeGraph): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  
  graph.atoms.forEach(atom => {
    if (atom.charge && Math.abs(atom.charge) > 3) {
      warnings.push({
        id: `high-charge-${atom.id}`,
        type: 'charge',
        message: `Unusual charge: ${atom.element}${atom.charge > 0 ? '+' : ''}${atom.charge}`,
        atomIds: [atom.id],
        severity: 'warning'
      });
    }
  });

  return warnings;
}

function validateGeometry(graph: MoleculeGraph): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  
  // Check for overlapping atoms
  for (let i = 0; i < graph.atoms.length; i++) {
    for (let j = i + 1; j < graph.atoms.length; j++) {
      const atom1 = graph.atoms[i];
      const atom2 = graph.atoms[j];
      
      const distance = Math.sqrt(
        Math.pow(atom1.position.x - atom2.position.x, 2) +
        Math.pow(atom1.position.y - atom2.position.y, 2)
      );
      
      if (distance < 10) { // Atoms too close (less than 10 pixels)
        warnings.push({
          id: `overlap-${atom1.id}-${atom2.id}`,
          type: 'geometry',
          message: `Atoms too close: ${atom1.element} and ${atom2.element}`,
          atomIds: [atom1.id, atom2.id],
          severity: 'warning'
        });
      }
    }
  }

  return warnings;
}

export function validateStructure(graph: MoleculeGraph): MoleculeValidation {
  const warnings: ValidationWarning[] = [];

  // Validate each atom's valence
  graph.atoms.forEach(atom => {
    warnings.push(...validateAtomValence(graph, atom));
  });

  // Validate connectivity
  warnings.push(...validateConnectivity(graph));

  // Validate charges
  warnings.push(...validateCharges(graph));

  // Validate geometry
  warnings.push(...validateGeometry(graph));

  const hasErrors = warnings.some(w => w.severity === 'error');

  return {
    isValid: !hasErrors,
    warnings
  };
}

export function calculateImplicitHydrogens(graph: MoleculeGraph, atom: Atom): number {
  const expectedValences = ELEMENT_VALENCES[atom.element];
  if (!expectedValences) return 0;

  const actualValence = calculateAtomValence(graph, atom);
  const primaryValence = expectedValences[0]; // Use primary valence

  const implicitH = Math.max(0, primaryValence - actualValence);
  return implicitH;
}
