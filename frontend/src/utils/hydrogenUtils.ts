import { v4 as uuidv4 } from 'uuid';
import type { Molecule, Atom, Bond, ElementSymbol } from '../types/chemistry';

// Valence electrons for common elements
const ELEMENT_VALENCE: Record<ElementSymbol, number> = {
  H: 1,
  C: 4,
  N: 3,
  O: 2,
  P: 5,
  S: 6,
  F: 1,
  Cl: 1,
  Br: 1,
  I: 1,
};

// Bond order values for different bond types
const BOND_ORDER: Record<string, number> = {
  single: 1,
  double: 2,
  triple: 3,
  wedge: 1,
  dash: 1,
};

/**
 * Calculate how many bonds an atom currently has
 */
export function getAtomBondCount(atomId: string, bonds: Bond[]): number {
  const count = bonds.reduce((count, bond) => {
    if (bond.sourceAtomId === atomId || bond.targetAtomId === atomId) {
      const bondOrder = BOND_ORDER[bond.type];
      return count + bondOrder;
    }
    return count;
  }, 0);
  
  return count;
}

/**
 * Calculate how many hydrogen atoms an atom needs to complete its valence
 */
export function getRequiredHydrogens(atom: Atom, bonds: Bond[]): number {
  const valence = ELEMENT_VALENCE[atom.element as ElementSymbol];
  if (!valence) return 0;
  
  const currentBonds = getAtomBondCount(atom.id, bonds);
  const neededHydrogens = Math.max(0, valence - currentBonds);
  
  return neededHydrogens;
}

/**
 * Get all hydrogen atoms connected to a specific atom
 */
export function getConnectedHydrogens(atomId: string, molecule: Molecule): Atom[] {
  const hydrogenIds = molecule.bonds
    .filter(bond => {
      const isConnected = bond.sourceAtomId === atomId || bond.targetAtomId === atomId;
      if (!isConnected) return false;
      
      const otherAtomId = bond.sourceAtomId === atomId ? bond.targetAtomId : bond.sourceAtomId;
      const otherAtom = molecule.atoms.find(atom => atom.id === otherAtomId);
      return otherAtom?.element === 'H';
    })
    .map(bond => bond.sourceAtomId === atomId ? bond.targetAtomId : bond.sourceAtomId);
  
  const result = molecule.atoms.filter(atom => hydrogenIds.includes(atom.id));
  
  return result;
}

/**
 * Add a specific number of hydrogen atoms to an atom
 */
export function addSpecificHydrogens(atom: Atom, molecule: Molecule, numberOfHydrogens: number): Molecule {
  
  if (numberOfHydrogens <= 0) {
    return molecule;
  }
  
  const newAtoms: Atom[] = [];
  const newBonds: Bond[] = [];
  
  // Position hydrogens around the main atom
  const angleStep = (2 * Math.PI) / Math.max(numberOfHydrogens, 3); // Minimum 3 positions for better spacing
  const hydrogenDistance = 30; // Distance from main atom
  
  for (let i = 0; i < numberOfHydrogens; i++) {
    const angle = i * angleStep;
    const hydrogenPosition = {
      x: atom.position.x + Math.cos(angle) * hydrogenDistance,
      y: atom.position.y + Math.sin(angle) * hydrogenDistance,
    };
    
    const hydrogenAtom: Atom = {
      id: uuidv4(),
      element: 'H',
      position: hydrogenPosition,
    };
    
    const hydrogenBond: Bond = {
      id: uuidv4(),
      sourceAtomId: atom.id,
      targetAtomId: hydrogenAtom.id,
      type: 'single',
    };
    
    newAtoms.push(hydrogenAtom);
    newBonds.push(hydrogenBond);
  }
  
  const result = {
    atoms: [...molecule.atoms, ...newAtoms],
    bonds: [...molecule.bonds, ...newBonds],
  };
  
  return result;
}

/**
 * Add hydrogen atoms to complete valence for a newly created atom
 */
export function addHydrogensToAtom(atom: Atom, molecule: Molecule): Molecule {
  const neededHydrogens = getRequiredHydrogens(atom, molecule.bonds);
  return addSpecificHydrogens(atom, molecule, neededHydrogens);
}

/**
 * Remove excess hydrogen atoms when a new bond is formed
 */
export function updateHydrogensAfterBonding(atomId: string, molecule: Molecule): Molecule {
  const atom = molecule.atoms.find(a => a.id === atomId);
  if (!atom) return molecule;
  
  const connectedHydrogens = getConnectedHydrogens(atomId, molecule);
  const currentBonds = getAtomBondCount(atomId, molecule.bonds);
  const valence = ELEMENT_VALENCE[atom.element as ElementSymbol] || 0;
  
  // Calculate how many hydrogens we need to remove
  const excessHydrogens = Math.max(0, currentBonds - valence);
  const hydrogensToRemove = Math.min(excessHydrogens, connectedHydrogens.length);
  
  if (hydrogensToRemove <= 0) {
    return molecule;
  }
  
  // Remove the specified number of hydrogen atoms and their bonds
  const hydrogensToRemoveIds = connectedHydrogens.slice(0, hydrogensToRemove).map(h => h.id);
  
  const updatedAtoms = molecule.atoms.filter(atom => !hydrogensToRemoveIds.includes(atom.id));
  const updatedBonds = molecule.bonds.filter(bond => 
    !hydrogensToRemoveIds.includes(bond.sourceAtomId) && 
    !hydrogensToRemoveIds.includes(bond.targetAtomId)
  );
  
  return {
    atoms: updatedAtoms,
    bonds: updatedBonds,
  };
}

/**
 * Update hydrogen atoms for both atoms involved in a new bond
 */
export function updateMoleculeAfterBonding(sourceAtomId: string, targetAtomId: string, molecule: Molecule): Molecule {
  let updatedMolecule = molecule;
  
  // Update hydrogens for both atoms involved in the bond
  updatedMolecule = updateHydrogensAfterBonding(sourceAtomId, updatedMolecule);
  updatedMolecule = updateHydrogensAfterBonding(targetAtomId, updatedMolecule);
  
  return updatedMolecule;
}

/**
 * Remove an atom and all hydrogen atoms connected to it, then restore hydrogens to affected atoms
 */
export function removeAtomWithHydrogens(atomId: string, molecule: Molecule): Molecule {
  const atomToRemove = molecule.atoms.find(a => a.id === atomId);
  if (!atomToRemove) return molecule;
  
  // Find all atoms that were bonded to the atom being removed (excluding hydrogens)
  const connectedAtomIds = molecule.bonds
    .filter(bond => bond.sourceAtomId === atomId || bond.targetAtomId === atomId)
    .map(bond => bond.sourceAtomId === atomId ? bond.targetAtomId : bond.sourceAtomId)
    .filter(connectedId => {
      const connectedAtom = molecule.atoms.find(a => a.id === connectedId);
      return connectedAtom && connectedAtom.element !== 'H'; // Only non-hydrogen atoms
    });
  
  // Get all hydrogen atoms connected to this atom
  const connectedHydrogens = getConnectedHydrogens(atomId, molecule);
  const hydrogenIds = connectedHydrogens.map(h => h.id);
  
  // Remove the main atom and all connected hydrogens
  const atomsToRemove = [atomId, ...hydrogenIds];
  
  let updatedMolecule = {
    atoms: molecule.atoms.filter(atom => !atomsToRemove.includes(atom.id)),
    bonds: molecule.bonds.filter(bond => 
      !atomsToRemove.includes(bond.sourceAtomId) && 
      !atomsToRemove.includes(bond.targetAtomId)
    ),
  };
  
  // Now restore hydrogens to all atoms that lost a bond
  for (const connectedAtomId of connectedAtomIds) {
    updatedMolecule = updateHydrogensAfterBondRemoval(connectedAtomId, updatedMolecule);
  }
  
  return updatedMolecule;
}

/**
 * Update hydrogen atoms after a bond is removed/broken
 */
export function updateHydrogensAfterBondRemoval(atomId: string, molecule: Molecule): Molecule {
  const atom = molecule.atoms.find(a => a.id === atomId);
  if (!atom || atom.element === 'H') return molecule;
  
  // Calculate how many hydrogens this atom needs now
  const neededHydrogens = getRequiredHydrogens(atom, molecule.bonds);
  const currentHydrogens = getConnectedHydrogens(atomId, molecule);
  
  if (neededHydrogens > currentHydrogens.length) {
    // Add more hydrogens to complete valence
    const hydrogensToAdd = neededHydrogens - currentHydrogens.length;
    
    // Find positions for new hydrogens, avoiding existing ones
    const existingPositions = currentHydrogens.map(h => ({
      angle: Math.atan2(h.position.y - atom.position.y, h.position.x - atom.position.x),
      distance: Math.sqrt(
        Math.pow(h.position.x - atom.position.x, 2) + 
        Math.pow(h.position.y - atom.position.y, 2)
      )
    }));
    
    // Also consider positions of other bonded atoms (non-hydrogen)
    const bondedAtoms = molecule.bonds
      .filter(bond => bond.sourceAtomId === atomId || bond.targetAtomId === atomId)
      .map(bond => {
        const otherAtomId = bond.sourceAtomId === atomId ? bond.targetAtomId : bond.sourceAtomId;
        return molecule.atoms.find(a => a.id === otherAtomId);
      })
      .filter(a => a && a.element !== 'H');
    
    const existingAtomAngles = bondedAtoms.map(a => 
      Math.atan2(a!.position.y - atom.position.y, a!.position.x - atom.position.x)
    );
    
    const newAtoms: Atom[] = [];
    const newBonds: Bond[] = [];
    const hydrogenDistance = 30;
    
    for (let i = 0; i < hydrogensToAdd; i++) {
      // Find an angle that doesn't conflict with existing hydrogens or bonded atoms
      let bestAngle = 0;
      let maxDistance = 0;
      
      // Try different angles and pick the one with maximum distance from existing positions
      for (let testAngle = 0; testAngle < Math.PI * 2; testAngle += Math.PI / 6) {
        let minDistance = Math.PI * 2;
        
        // Check distance to existing hydrogens
        for (const pos of existingPositions) {
          const angleDiff = Math.abs(testAngle - pos.angle);
          const normalizedDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);
          minDistance = Math.min(minDistance, normalizedDiff);
        }
        
        // Check distance to bonded atoms
        for (const existingAngle of existingAtomAngles) {
          const angleDiff = Math.abs(testAngle - existingAngle);
          const normalizedDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);
          minDistance = Math.min(minDistance, normalizedDiff);
        }
        
        if (minDistance > maxDistance) {
          maxDistance = minDistance;
          bestAngle = testAngle;
        }
      }
      
      const finalAngle = bestAngle;
      
      const hydrogenPosition = {
        x: atom.position.x + Math.cos(finalAngle) * hydrogenDistance,
        y: atom.position.y + Math.sin(finalAngle) * hydrogenDistance,
      };
      
      const hydrogenAtom: Atom = {
        id: uuidv4(),
        element: 'H',
        position: hydrogenPosition,
      };
      
      const hydrogenBond: Bond = {
        id: uuidv4(),
        sourceAtomId: atom.id,
        targetAtomId: hydrogenAtom.id,
        type: 'single',
      };
      
      newAtoms.push(hydrogenAtom);
      newBonds.push(hydrogenBond);
      
      // Add this position to existing ones for next iteration
      existingPositions.push({ angle: finalAngle, distance: hydrogenDistance });
    }
    
    return {
      atoms: [...molecule.atoms, ...newAtoms],
      bonds: [...molecule.bonds, ...newBonds],
    };
  }
  
  return molecule;
}

/**
 * Update hydrogens for both atoms when a bond type changes
 */
export function updateHydrogensAfterBondTypeChange(sourceAtomId: string, targetAtomId: string, molecule: Molecule): Molecule {
  let updatedMolecule = molecule;
  
  // For each atom, recalculate and update hydrogens completely
  for (const atomId of [sourceAtomId, targetAtomId]) {
    const atom = updatedMolecule.atoms.find(a => a.id === atomId);
    if (!atom || atom.element === 'H') continue;
    
    // First, remove ALL existing hydrogen atoms connected to this atom
    const existingHydrogens = getConnectedHydrogens(atomId, updatedMolecule);
    
    const hydrogenIds = existingHydrogens.map(h => h.id);
    
    // Remove hydrogen atoms and their bonds
    updatedMolecule = {
      atoms: updatedMolecule.atoms.filter(a => !hydrogenIds.includes(a.id)),
      bonds: updatedMolecule.bonds.filter(b => 
        !hydrogenIds.includes(b.sourceAtomId) && !hydrogenIds.includes(b.targetAtomId)
      )
    };
    
    // Now add the correct number of hydrogens based on current bonds
    const neededHydrogens = getRequiredHydrogens(atom, updatedMolecule.bonds);
    
    if (neededHydrogens > 0) {
      // Add hydrogens using the existing function
      updatedMolecule = addHydrogensToAtom(atom, updatedMolecule);
    }
  }
  
  return updatedMolecule;
}
