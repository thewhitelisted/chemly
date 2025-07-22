import * as OCL from 'openchemlib';
import type { MoleculeGraph, Atom, Bond } from '../models/MoleculeGraph';
import { v4 as uuidv4 } from 'uuid';

// Convert OCL.Molecule to MoleculeGraph
export function oclMoleculeToGraph(mol: OCL.Molecule): MoleculeGraph {
  // Fallback: no 2D coordinate generation available in this OCL build
  const atoms: Atom[] = [];
  const bonds: Bond[] = [];
  const atomIdMap: Record<number, string> = {};

  for (let i = 0; i < mol.getAllAtoms(); i++) {
    const element = mol.getAtomLabel(i);
    const charge = mol.getAtomCharge(i);
    const implicitHydrogens = mol.getImplicitHydrogens ? mol.getImplicitHydrogens(i) : 0;
    // Try to use OCL's 2D coordinates if available, otherwise fallback
    let x = i * 50;
    let y = 0;
    if (typeof mol.getAtomX === 'function' && typeof mol.getAtomY === 'function') {
      x = mol.getAtomX(i);
      y = mol.getAtomY(i);
    }
    const atom: Atom = {
      id: uuidv4(),
      element,
      position: {
        x,
        y,
      },
      charge: charge !== 0 ? charge : undefined,
      implicitHydrogens: implicitHydrogens,
    };
    atoms.push(atom);
    atomIdMap[i] = atom.id;
  }

  // Create bonds before centering/scaling
  for (let i = 0; i < mol.getAllBonds(); i++) {
    const source = mol.getBondAtom(0, i);
    const target = mol.getBondAtom(1, i);
    const order = mol.getBondOrder(i);
    let type: Bond['type'] = 'single';
    if (order === 2) type = 'double';
    else if (order === 3) type = 'triple';
    // Stereochemistry not handled here
    bonds.push({
      id: uuidv4(),
      sourceAtomId: atomIdMap[source],
      targetAtomId: atomIdMap[target],
      type,
    });
  }

  // Center the molecule in the canvas at (400, 300)
  if (atoms.length > 0) {
    if (bonds.length === 0) {
      // All atoms are disconnected: arrange in a grid
      const gridSpacing = 140;
      const canvasCenterX = 400;
      const canvasCenterY = 300;
      const n = atoms.length;
      const cols = Math.ceil(Math.sqrt(n));
      const rows = Math.ceil(n / cols);
      // Calculate top-left corner to center the grid
      const totalWidth = (cols - 1) * gridSpacing;
      const totalHeight = (rows - 1) * gridSpacing;
      const startX = canvasCenterX - totalWidth / 2;
      const startY = canvasCenterY - totalHeight / 2;
      for (let i = 0; i < n; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        atoms[i].position.x = startX + col * gridSpacing;
        atoms[i].position.y = startY + row * gridSpacing;
      }
    } else {
      const minX = Math.min(...atoms.map(a => a.position.x));
      const maxX = Math.max(...atoms.map(a => a.position.x));
      const minY = Math.min(...atoms.map(a => a.position.y));
      const maxY = Math.max(...atoms.map(a => a.position.y));
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const canvasCenterX = 400;
      const canvasCenterY = 300;
      const offsetX = canvasCenterX - centerX;
      const offsetY = canvasCenterY - centerY;
      for (const atom of atoms) {
        atom.position.x += offsetX;
        atom.position.y += offsetY;
      }
      // Scale so that average bond length between non-hydrogen atoms is TARGET_BOND_LENGTH
      const TARGET_BOND_LENGTH = 75;
      // Find all bonds between non-hydrogen atoms
      const heavyAtomBonds = bonds
        .map(bond => {
          const a1 = atoms.find(a => a.id === bond.sourceAtomId);
          const a2 = atoms.find(a => a.id === bond.targetAtomId);
          return (a1 && a2 && a1.element !== 'H' && a2.element !== 'H') ? { a1, a2 } : null;
        })
        .filter(Boolean) as { a1: Atom, a2: Atom }[];
      if (heavyAtomBonds.length > 0) {
        const avgBondLength =
          heavyAtomBonds.reduce((sum, { a1, a2 }) => {
            const dx = a1.position.x - a2.position.x;
            const dy = a1.position.y - a2.position.y;
            return sum + Math.sqrt(dx * dx + dy * dy);
          }, 0) / heavyAtomBonds.length;
        const scale = TARGET_BOND_LENGTH / avgBondLength;
        for (const atom of atoms) {
          atom.position.x = canvasCenterX + (atom.position.x - canvasCenterX) * scale;
          atom.position.y = canvasCenterY + (atom.position.y - canvasCenterY) * scale;
        }
      }
    }
  }

  // Remove grid snapping for free movement

  return { atoms, bonds };
}

// Convert MoleculeGraph to OCL.Molecule
export function graphToOclMolecule(graph: MoleculeGraph): OCL.Molecule {
  const mol = new OCL.Molecule(0, 0);
  const atomIdMap: Record<string, number> = {};
  for (const atom of graph.atoms) {
    const atomicNo = OCL.Molecule.getAtomicNoFromLabel(atom.element);
    const idx = mol.addAtom(atomicNo);
    atomIdMap[atom.id] = idx;
    if (atom.charge) mol.setAtomCharge(idx, atom.charge);
    // Hydrogens: OCL will handle implicit Hs automatically
  }
  for (const bond of graph.bonds) {
    const a1 = atomIdMap[bond.sourceAtomId];
    const a2 = atomIdMap[bond.targetAtomId];
    // Check if bond already exists
    let alreadyExists = false;
    for (let i = 0; i < mol.getAllBonds(); i++) {
      const s = mol.getBondAtom(0, i);
      const t = mol.getBondAtom(1, i);
      if ((s === a1 && t === a2) || (s === a2 && t === a1)) {
        alreadyExists = true;
        break;
      }
    }
    if (alreadyExists) continue;
    let order = 1;
    if (bond.type === 'double') order = 2;
    else if (bond.type === 'triple') order = 3;
    else if (bond.type === 'wedge' || bond.type === 'dash') {
      // Stereochemistry not handled yet; treat as single bond
      // TODO: Add stereochemistry support
      order = 1;
    }
    const bondIdx = mol.addBond(a1, a2);
    mol.setBondOrder(bondIdx, order);
  }
  // After all bonds, log OCL molecule's bonds
  for (let i = 0; i < mol.getAllBonds(); i++) {
    const s = mol.getBondAtom(0, i);
    const t = mol.getBondAtom(1, i);
    const o = mol.getBondOrder(i);
  }
  // TODO: If you want to support 2D coordinates, use OCL coordinate generation here
  return mol;
}

// Returns the ids of hydrogen atoms attached to a given atom
export function getAttachedHydrogens(graph: MoleculeGraph, atomId: string): string[] {
  const atom = graph.atoms.find(a => a.id === atomId);
  if (!atom) return [];
  // Find all bonds where this atom is one end and the other is a hydrogen
  return graph.bonds
    .filter(b => b.sourceAtomId === atomId || b.targetAtomId === atomId)
    .map(b => b.sourceAtomId === atomId ? b.targetAtomId : b.sourceAtomId)
    .filter(neighborId => {
      const neighbor = graph.atoms.find(a => a.id === neighborId);
      return neighbor && neighbor.element === 'H';
    });
} 