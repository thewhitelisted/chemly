import type { MoleculeGraph, Atom, Bond } from '../models/MoleculeGraph';
import type { ElementSymbol } from '../types/chemistry';
import { v4 as uuidv4 } from 'uuid';
import { 
  BOND_ORDER, 
  getBestValenceForBondCount, 
  getPreferredValence, 
  canAcceptMoreBonds 
} from './valenceDefinitions';

// Ensure all elements in the toolbar are supported in valence logic
const TOOLBAR_ELEMENTS: ElementSymbol[] = ['C','O','N','P','S','F','Cl','Br','I','H'];

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
   * Get atoms connected to a specific atom (excluding hydrogens for positioning)
   */
  private static getConnectedAtoms(atomId: string, graph: MoleculeGraph, excludeHydrogens: boolean = true): Atom[] {
    return graph.bonds
      .filter(bond => (bond.sourceAtomId === atomId || bond.targetAtomId === atomId))
      .map(bond => {
        const otherAtomId = bond.sourceAtomId === atomId ? bond.targetAtomId : bond.sourceAtomId;
        return graph.atoms.find(a => a.id === otherAtomId);
      })
      .filter(atom => atom && (!excludeHydrogens || atom.element !== 'H')) as Atom[];
  }

  /**
   * Get hydrogen atoms connected to a specific atom
   */
  private static getConnectedHydrogens(atomId: string, graph: MoleculeGraph): Atom[] {
    return graph.bonds
      .filter(bond => (bond.sourceAtomId === atomId || bond.targetAtomId === atomId))
      .map(bond => {
        const otherAtomId = bond.sourceAtomId === atomId ? bond.targetAtomId : bond.sourceAtomId;
        return graph.atoms.find(a => a.id === otherAtomId);
      })
      .filter(atom => atom && atom.element === 'H') as Atom[];
  }

  /**
   * Remove all hydrogen atoms connected to a specific atom
   */
  private static removeHydrogensFromAtom(atomId: string, graph: MoleculeGraph): MoleculeGraph {
    const hydrogens = this.getConnectedHydrogens(atomId, graph);
    const hydrogenIds = hydrogens.map(h => h.id);

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
    // Skip hydrogen atoms
    if (atom.element === 'H') return graph;

    const currentBonds = this.getCurrentBondCount(atom.id, graph);
    const targetValence = getBestValenceForBondCount(atom.element as ElementSymbol, currentBonds);
    
    if (!targetValence) return graph;

    const neededHydrogens = Math.max(0, targetValence - currentBonds);
    if (neededHydrogens === 0) return graph;

    const newHydrogens: Atom[] = [];
    const newBonds: Bond[] = [];
    const hydrogenDistance = 30;

    // Find angles of all existing bonds (to non-hydrogen atoms)
    const bondedAtoms = this.getConnectedAtoms(atom.id, graph, true);
    const bondAngles = bondedAtoms.map(a => Math.atan2(a.position.y - atom.position.y, a.position.x - atom.position.x));
    bondAngles.sort((a, b) => a - b);

    let hydrogenAngles: number[] = [];
    
    if (bondedAtoms.length === 0) {
      // No bonds: space hydrogens evenly around atom
      for (let i = 0; i < neededHydrogens; i++) {
        hydrogenAngles.push((2 * Math.PI * i) / neededHydrogens);
      }
    } else if (bondedAtoms.length === 1) {
      // One bond: place hydrogens opposite or at angles
      const bondAngle = bondAngles[0];
      if (neededHydrogens === 1) {
        hydrogenAngles.push(bondAngle + Math.PI);
      } else {
        // Multiple hydrogens: spread them around avoiding the bond
        for (let i = 0; i < neededHydrogens; i++) {
          const angle = bondAngle + Math.PI + ((i - (neededHydrogens - 1) / 2) * Math.PI / 3);
          hydrogenAngles.push(angle);
        }
      }
    } else if (bondedAtoms.length === 2) {
      // Two bonds: place hydrogens in the largest angular gap
      const angle1 = bondAngles[0];
      const angle2 = bondAngles[1];
      let a1 = angle1;
      let a2 = angle2;
      if (a2 < a1) [a1, a2] = [a2, a1];
      const gap1 = a2 - a1;
      const gap2 = 2 * Math.PI - gap1;
      let gapStart, gapSize;
      if (gap1 > gap2) {
        gapStart = a1;
        gapSize = gap1;
      } else {
        gapStart = a2;
        gapSize = gap2;
      }
      for (let i = 0; i < neededHydrogens; i++) {
        const hAngle = gapStart + ((i + 1) / (neededHydrogens + 1)) * gapSize;
        hydrogenAngles.push(hAngle);
      }
    } else {
      // Three or more bonds: find gaps and place hydrogens
      const allAngles = [...bondAngles, bondAngles[0] + 2 * Math.PI];
      let largestGap = 0;
      let gapStart = 0;
      
      for (let i = 0; i < bondAngles.length; i++) {
        const gap = allAngles[i + 1] - allAngles[i];
        if (gap > largestGap) {
          largestGap = gap;
          gapStart = allAngles[i];
        }
      }
      
      for (let i = 0; i < neededHydrogens; i++) {
        const hAngle = gapStart + ((i + 1) / (neededHydrogens + 1)) * largestGap;
        hydrogenAngles.push(hAngle % (2 * Math.PI));
      }
    }

    for (let i = 0; i < neededHydrogens; i++) {
      const angle = hydrogenAngles[i];
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
   * Update hydrogens for specific atoms
   */
  static updateHydrogensForAtoms(atomIds: string[], graph: MoleculeGraph): MoleculeGraph {
    let updatedGraph = graph;
    
    for (const atomId of atomIds) {
      const atom = updatedGraph.atoms.find(a => a.id === atomId);
      if (!atom || atom.element === 'H') continue;
      
      // Remove existing hydrogens first
      updatedGraph = this.removeHydrogensFromAtom(atomId, updatedGraph);
      
      // Add new hydrogens based on current valence state
      updatedGraph = this.addHydrogensToAtom(atom, updatedGraph);
    }
    
    return updatedGraph;
  }

  /**
   * Fill valences for all non-hydrogen atoms
   */
  static fillAllValences(graph: MoleculeGraph): MoleculeGraph {
    const nonHydrogenAtoms = graph.atoms.filter(atom => atom.element !== 'H');
    const atomIds = nonHydrogenAtoms.map(atom => atom.id);
    return this.updateHydrogensForAtoms(atomIds, graph);
  }

  /**
   * Check if a bond can be created between two atoms
   */
  static canCreateBond(sourceAtomId: string, targetAtomId: string, graph: MoleculeGraph, bondOrder: number = 1): boolean {
    const sourceAtom = graph.atoms.find(a => a.id === sourceAtomId);
    const targetAtom = graph.atoms.find(a => a.id === targetAtomId);
    
    if (!sourceAtom || !targetAtom) return false;
    
    // Don't allow bonds to self
    if (sourceAtomId === targetAtomId) return false;
    
    // Check if bond already exists
    const existingBond = graph.bonds.find(bond =>
      (bond.sourceAtomId === sourceAtomId && bond.targetAtomId === targetAtomId) ||
      (bond.sourceAtomId === targetAtomId && bond.targetAtomId === sourceAtomId)
    );
    
    if (existingBond) {
      // Bond exists, check if we can increase its order
      const currentOrder = BOND_ORDER[existingBond.type];
      const newOrder = currentOrder + bondOrder;
      
      const sourceCurrentBonds = this.getCurrentBondCount(sourceAtomId, graph);
      const targetCurrentBonds = this.getCurrentBondCount(targetAtomId, graph);
      
      // Calculate what the new bond counts would be
      const sourceNewBonds = sourceCurrentBonds - currentOrder + newOrder;
      const targetNewBonds = targetCurrentBonds - currentOrder + newOrder;
      
      return canAcceptMoreBonds(sourceAtom.element as ElementSymbol, sourceNewBonds - bondOrder, bondOrder) &&
             canAcceptMoreBonds(targetAtom.element as ElementSymbol, targetNewBonds - bondOrder, bondOrder);
    } else {
      // New bond
      const sourceCurrentBonds = this.getCurrentBondCount(sourceAtomId, graph);
      const targetCurrentBonds = this.getCurrentBondCount(targetAtomId, graph);
      
      return canAcceptMoreBonds(sourceAtom.element as ElementSymbol, sourceCurrentBonds, bondOrder) &&
             canAcceptMoreBonds(targetAtom.element as ElementSymbol, targetCurrentBonds, bondOrder);
    }
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
   * Handle atom deletion - remove atom, connected hydrogens, and update remaining connected atoms
   */
  static onAtomDeleted(atomId: string, graph: MoleculeGraph): MoleculeGraph {
    // Find all atoms that were bonded to the deleted atom
    const connectedAtomIds = graph.bonds
      .filter(bond => bond.sourceAtomId === atomId || bond.targetAtomId === atomId)
      .map(bond => bond.sourceAtomId === atomId ? bond.targetAtomId : bond.sourceAtomId)
      .filter(id => id !== atomId);

    // Separate hydrogen and non-hydrogen connected atoms
    const connectedHydrogenIds = connectedAtomIds.filter(id => {
      const atom = graph.atoms.find(a => a.id === id);
      return atom && atom.element === 'H';
    });
    
    const connectedNonHydrogenIds = connectedAtomIds.filter(id => {
      const atom = graph.atoms.find(a => a.id === id);
      return atom && atom.element !== 'H';
    });

    // Remove the atom, connected hydrogens, and all related bonds
    const atomsToRemove = [atomId, ...connectedHydrogenIds];
    const updatedGraph = {
      atoms: graph.atoms.filter(atom => !atomsToRemove.includes(atom.id)),
      bonds: graph.bonds.filter(bond => 
        !atomsToRemove.includes(bond.sourceAtomId) && 
        !atomsToRemove.includes(bond.targetAtomId)
      )
    };

    // Update hydrogens for remaining non-hydrogen atoms that lost a bond
    return this.updateHydrogensForAtoms(connectedNonHydrogenIds, updatedGraph);
  }
}
