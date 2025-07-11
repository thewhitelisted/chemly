import type { MoleculeGraph, Atom, Bond } from '../models/MoleculeGraph';
import { v4 as uuidv4 } from 'uuid';

// Valence electrons for common elements
const ELEMENT_VALENCE: Record<string, number> = {
  H: 1,
  C: 4,
  N: 3,
  O: 2,
  P: 3,  // Common valence for phosphorus in organic chemistry
  S: 2,  // Common valence for sulfur in organic chemistry
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

export class HydrogenManager {
  /**
   * Calculate how many bonds (including hydrogens) an atom currently has
   */
  private static getCurrentBondCount(atomId: string, graph: MoleculeGraph): number {
    return graph.bonds.reduce((count, bond) => {
      if (bond.sourceAtomId === atomId || bond.targetAtomId === atomId) {
        return count + BOND_ORDER[bond.type];
      }
      return count;
    }, 0);
  }

  /**
   * Get all hydrogen atoms connected to a specific atom
   */
  private static getConnectedHydrogens(atomId: string, graph: MoleculeGraph): Atom[] {
    const hydrogenIds = new Set<string>();
    
    graph.bonds.forEach(bond => {
      let connectedAtomId: string | null = null;
      
      if (bond.sourceAtomId === atomId) {
        connectedAtomId = bond.targetAtomId;
      } else if (bond.targetAtomId === atomId) {
        connectedAtomId = bond.sourceAtomId;
      }
      
      if (connectedAtomId) {
        const connectedAtom = graph.atoms.find(a => a.id === connectedAtomId);
        if (connectedAtom && connectedAtom.element === 'H') {
          hydrogenIds.add(connectedAtomId);
        }
      }
    });
    
    return graph.atoms.filter(atom => hydrogenIds.has(atom.id));
  }

  /**
   * Remove hydrogen atoms and their bonds from the graph
   */
  private static removeHydrogens(hydrogenIds: string[], graph: MoleculeGraph): MoleculeGraph {
    return {
      atoms: graph.atoms.filter(atom => !hydrogenIds.includes(atom.id)),
      bonds: graph.bonds.filter(bond => 
        !hydrogenIds.includes(bond.sourceAtomId) && 
        !hydrogenIds.includes(bond.targetAtomId)
      )
    };
  }

  /**
   * Add hydrogen atoms to complete an atom's valence
   */
  private static addHydrogensToAtom(atom: Atom, graph: MoleculeGraph): MoleculeGraph {
    const valence = ELEMENT_VALENCE[atom.element];
    if (!valence) return graph;

    const currentBonds = this.getCurrentBondCount(atom.id, graph);
    const neededHydrogens = Math.max(0, valence - currentBonds);

    if (neededHydrogens === 0) return graph;

    const newHydrogens: Atom[] = [];
    const newBonds: Bond[] = [];

    // Position hydrogens around the atom
    const angleStep = (2 * Math.PI) / Math.max(neededHydrogens, 3);
    const hydrogenDistance = 30;

    for (let i = 0; i < neededHydrogens; i++) {
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

      newHydrogens.push(hydrogenAtom);
      newBonds.push(hydrogenBond);
    }

    return {
      atoms: [...graph.atoms, ...newHydrogens],
      bonds: [...graph.bonds, ...newBonds],
    };
  }

  /**
   * Update hydrogens for a specific atom
   */
  static updateHydrogensForAtom(atomId: string, graph: MoleculeGraph): MoleculeGraph {
    const atom = graph.atoms.find(a => a.id === atomId);
    if (!atom || atom.element === 'H') return graph;

    // Remove existing hydrogens
    const existingHydrogens = this.getConnectedHydrogens(atomId, graph);
    const hydrogenIds = existingHydrogens.map(h => h.id);
    let updatedGraph = this.removeHydrogens(hydrogenIds, graph);

    // Add new hydrogens to complete valence
    updatedGraph = this.addHydrogensToAtom(atom, updatedGraph);

    return updatedGraph;
  }

  /**
   * Update hydrogens for multiple atoms
   */
  static updateHydrogensForAtoms(atomIds: string[], graph: MoleculeGraph): MoleculeGraph {
    let updatedGraph = graph;
    
    for (const atomId of atomIds) {
      updatedGraph = this.updateHydrogensForAtom(atomId, updatedGraph);
    }
    
    return updatedGraph;
  }

  /**
   * Add hydrogens to all non-hydrogen atoms in the graph
   */
  static fillAllValences(graph: MoleculeGraph): MoleculeGraph {
    const nonHydrogenAtoms = graph.atoms.filter(atom => atom.element !== 'H');
    const atomIds = nonHydrogenAtoms.map(atom => atom.id);
    
    return this.updateHydrogensForAtoms(atomIds, graph);
  }

  /**
   * Handle atom creation - add hydrogens to fill valence
   */
  static onAtomCreated(newAtom: Atom, graph: MoleculeGraph): MoleculeGraph {
    if (newAtom.element === 'H') return graph;
    
    return this.addHydrogensToAtom(newAtom, graph);
  }

  /**
   * Handle bond creation - update hydrogens for both atoms
   */
  static onBondCreated(bond: Bond, graph: MoleculeGraph): MoleculeGraph {
    return this.updateHydrogensForAtoms([bond.sourceAtomId, bond.targetAtomId], graph);
  }

  /**
   * Handle bond deletion - update hydrogens for both atoms
   */
  static onBondDeleted(bond: Bond, graph: MoleculeGraph): MoleculeGraph {
    return this.updateHydrogensForAtoms([bond.sourceAtomId, bond.targetAtomId], graph);
  }

  /**
   * Handle bond type change - update hydrogens for both atoms
   */
  static onBondTypeChanged(bond: Bond, graph: MoleculeGraph): MoleculeGraph {
    return this.updateHydrogensForAtoms([bond.sourceAtomId, bond.targetAtomId], graph);
  }

  /**
   * Handle atom deletion - remove atom and update connected atoms
   */
  static onAtomDeleted(deletedAtomId: string, graph: MoleculeGraph): MoleculeGraph {
    // Find all atoms that were connected to the deleted atom
    const connectedAtomIds = new Set<string>();
    const hydrogenAtomsToDelete = new Set<string>();
    
    graph.bonds.forEach(bond => {
      if (bond.sourceAtomId === deletedAtomId) {
        connectedAtomIds.add(bond.targetAtomId);
        // If the connected atom is hydrogen, mark it for deletion
        const connectedAtom = graph.atoms.find(a => a.id === bond.targetAtomId);
        if (connectedAtom && connectedAtom.element === 'H') {
          hydrogenAtomsToDelete.add(bond.targetAtomId);
        }
      } else if (bond.targetAtomId === deletedAtomId) {
        connectedAtomIds.add(bond.sourceAtomId);
        // If the connected atom is hydrogen, mark it for deletion
        const connectedAtom = graph.atoms.find(a => a.id === bond.sourceAtomId);
        if (connectedAtom && connectedAtom.element === 'H') {
          hydrogenAtomsToDelete.add(bond.sourceAtomId);
        }
      }
    });

    console.log(`Deleting atom ${deletedAtomId} and ${hydrogenAtomsToDelete.size} connected hydrogens`);

    // Remove the atom, connected hydrogens, and all related bonds
    const atomsToDelete = new Set([deletedAtomId, ...hydrogenAtomsToDelete]);
    const updatedGraph: MoleculeGraph = {
      atoms: graph.atoms.filter(atom => !atomsToDelete.has(atom.id)),
      bonds: graph.bonds.filter(bond => 
        !atomsToDelete.has(bond.sourceAtomId) && 
        !atomsToDelete.has(bond.targetAtomId)
      )
    };

    // Update hydrogens for remaining non-hydrogen atoms that were connected to the deleted atom
    const nonHydrogenConnectedAtoms = Array.from(connectedAtomIds).filter(atomId => {
      const atom = updatedGraph.atoms.find(a => a.id === atomId);
      return atom && atom.element !== 'H';
    });

    return this.updateHydrogensForAtoms(nonHydrogenConnectedAtoms, updatedGraph);
  }
}
