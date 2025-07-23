import type { MoleculeGraph, Atom, ValidationWarning, MoleculeValidation } from '../models/MoleculeGraph';
import type { ElementSymbol } from '../types/chemistry';
import { MoleculeGraphUtils } from '../models/MoleculeGraph';
import { BOND_ORDER, isValidValence, getPossibleValences } from './valenceDefinitions';

function getBondOrder(bondType: string): number {
  return BOND_ORDER[bondType] || 1;
}

function calculateAtomValence(graph: MoleculeGraph, atom: Atom): number {
  const bonds = MoleculeGraphUtils.getBondsForAtom(graph, atom.id);
  return bonds.reduce((total, bond) => total + getBondOrder(bond.type), 0);
}

function validateAtomValence(graph: MoleculeGraph, atom: Atom): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  const expectedValences = getPossibleValences(atom.element as ElementSymbol);
  
  if (expectedValences.length === 0) {
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

  if (!isValidValence(atom.element as ElementSymbol, totalValence)) {
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
  
  // Check for unreasonable formal charges
  graph.atoms.forEach(atom => {
    if (atom.charge && Math.abs(atom.charge) > 3) {
      warnings.push({
        id: `charge-${atom.id}`,
        type: 'charge',
        message: `Unusual formal charge (${atom.charge > 0 ? '+' : ''}${atom.charge}) on ${atom.element}`,
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
  const atomPositions = new Map<string, {x: number, y: number}>();
  graph.atoms.forEach(atom => {
    atomPositions.set(atom.id, atom.position);
  });

  const atoms = Array.from(atomPositions.entries());
  for (let i = 0; i < atoms.length; i++) {
    for (let j = i + 1; j < atoms.length; j++) {
      const [id1, pos1] = atoms[i];
      const [id2, pos2] = atoms[j];
      
      const distance = Math.sqrt(
        Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2)
      );
      
      if (distance < 5) { // Very close atoms
        const atom1 = graph.atoms.find(a => a.id === id1);
        const atom2 = graph.atoms.find(a => a.id === id2);
        
        warnings.push({
          id: `overlap-${id1}-${id2}`,
          type: 'geometry',
          message: `Atoms ${atom1?.element} and ${atom2?.element} are overlapping`,
          atomIds: [id1, id2],
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
  const expectedValences = getPossibleValences(atom.element as ElementSymbol);
  if (expectedValences.length === 0) return 0;

  const actualValence = calculateAtomValence(graph, atom);
  const primaryValence = expectedValences[0]; // Use primary valence

  const implicitH = Math.max(0, primaryValence - actualValence);
  return implicitH;
}
