export type Atom = {
  id: string;
  element: string; // e.g., "C", "O", "N"
  position: { x: number; y: number };
  charge?: number;
  implicitHydrogens?: number; // For proper valence calculation
};

export type Bond = {
  id: string;
  sourceAtomId: string;
  targetAtomId: string;
  type: 'single' | 'double' | 'triple' | 'wedge' | 'dash';
};

export type MoleculeGraph = {
  atoms: Atom[];
  bonds: Bond[];
};

export type ValidationWarning = {
  id: string;
  type: 'valence' | 'charge' | 'connectivity' | 'geometry';
  message: string;
  atomIds: string[]; // Atoms involved in this warning
  severity: 'error' | 'warning' | 'info';
};

export type MoleculeValidation = {
  isValid: boolean;
  warnings: ValidationWarning[];
};

// Helper functions for graph operations
export class MoleculeGraphUtils {
  static getAtomById(graph: MoleculeGraph, atomId: string): Atom | undefined {
    return graph.atoms.find(atom => atom.id === atomId);
  }

  static getBondsForAtom(graph: MoleculeGraph, atomId: string): Bond[] {
    return graph.bonds.filter(bond => 
      bond.sourceAtomId === atomId || bond.targetAtomId === atomId
    );
  }

  static getConnectedAtoms(graph: MoleculeGraph, atomId: string): Atom[] {
    const bonds = this.getBondsForAtom(graph, atomId);
    const connectedAtomIds = bonds.map(bond => 
      bond.sourceAtomId === atomId ? bond.targetAtomId : bond.sourceAtomId
    );
    return connectedAtomIds.map(id => this.getAtomById(graph, id)).filter(Boolean) as Atom[];
  }

  static addAtom(graph: MoleculeGraph, atom: Atom): MoleculeGraph {
    return {
      ...graph,
      atoms: [...graph.atoms, atom]
    };
  }

  static addBond(graph: MoleculeGraph, bond: Bond): MoleculeGraph {
    // Check if bond already exists
    const existingBond = graph.bonds.find(b => 
      (b.sourceAtomId === bond.sourceAtomId && b.targetAtomId === bond.targetAtomId) ||
      (b.sourceAtomId === bond.targetAtomId && b.targetAtomId === bond.sourceAtomId)
    );

    if (existingBond) {
      // Update existing bond type
      return {
        ...graph,
        bonds: graph.bonds.map(b => 
          b.id === existingBond.id ? { ...b, type: bond.type } : b
        )
      };
    } else {
      // Add new bond
      return {
        ...graph,
        bonds: [...graph.bonds, bond]
      };
    }
  }

  static removeAtom(graph: MoleculeGraph, atomId: string): MoleculeGraph {
    return {
      atoms: graph.atoms.filter(atom => atom.id !== atomId),
      bonds: graph.bonds.filter(bond => 
        bond.sourceAtomId !== atomId && bond.targetAtomId !== atomId
      )
    };
  }

  static removeBond(graph: MoleculeGraph, bondId: string): MoleculeGraph {
    return {
      ...graph,
      bonds: graph.bonds.filter(bond => bond.id !== bondId)
    };
  }

  static updateAtomPosition(graph: MoleculeGraph, atomId: string, position: { x: number; y: number }): MoleculeGraph {
    return {
      ...graph,
      atoms: graph.atoms.map(atom => 
        atom.id === atomId ? { ...atom, position } : atom
      )
    };
  }

  static updateAtomElement(graph: MoleculeGraph, atomId: string, element: string): MoleculeGraph {
    return {
      ...graph,
      atoms: graph.atoms.map(atom => 
        atom.id === atomId ? { ...atom, element } : atom
      )
    };
  }

  static clone(graph: MoleculeGraph): MoleculeGraph {
    return {
      atoms: [...graph.atoms],
      bonds: [...graph.bonds]
    };
  }
}
