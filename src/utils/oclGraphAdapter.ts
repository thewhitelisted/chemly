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

  // Center the molecule in the canvas at (400, 300)
  if (atoms.length > 0) {
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
    // After centering, scale the molecule to a reasonable size
    if (atoms.length > 1) {
      const minX2 = Math.min(...atoms.map(a => a.position.x));
      const maxX2 = Math.max(...atoms.map(a => a.position.x));
      const minY2 = Math.min(...atoms.map(a => a.position.y));
      const maxY2 = Math.max(...atoms.map(a => a.position.y));
      const width = maxX2 - minX2;
      const height = maxY2 - minY2;
      const targetWidth = 200;
      const targetHeight = 200;
      const scale = Math.min(targetWidth / width, targetHeight / height);
      // Center point (after previous centering)
      for (const atom of atoms) {
        atom.position.x = canvasCenterX + (atom.position.x - canvasCenterX) * scale;
        atom.position.y = canvasCenterY + (atom.position.y - canvasCenterY) * scale;
      }
    }
  }

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

  return { atoms, bonds };
}

// Convert MoleculeGraph to OCL.Molecule
export function graphToOclMolecule(graph: MoleculeGraph): OCL.Molecule {
  const mol = new OCL.Molecule(0, 0);
  const atomIdMap: Record<string, number> = {};
  console.log('graphToOclMolecule: Atoms:', graph.atoms);
  for (const atom of graph.atoms) {
    const atomicNo = OCL.Molecule.getAtomicNoFromLabel(atom.element);
    const idx = mol.addAtom(atomicNo);
    atomIdMap[atom.id] = idx;
    if (atom.charge) mol.setAtomCharge(idx, atom.charge);
    // Hydrogens: OCL will handle implicit Hs automatically
    console.log(`Added atom: ${atom.element} (id: ${atom.id}) -> OCL idx: ${idx}`);
  }
  console.log('graphToOclMolecule: Bonds:', graph.bonds);
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
      console.warn(`Bond type '${bond.type}' is not supported for stereochemistry and will be treated as single.`);
      order = 1;
    }
    const bondIdx = mol.addBond(a1, a2);
    mol.setBondOrder(bondIdx, order);
    console.log(`Added bond: ${bond.type} (${order}) between OCL idx ${a1} and ${a2}, bondIdx: ${bondIdx}`);
  }
  // After all bonds, log OCL molecule's bonds
  for (let i = 0; i < mol.getAllBonds(); i++) {
    const s = mol.getBondAtom(0, i);
    const t = mol.getBondAtom(1, i);
    const o = mol.getBondOrder(i);
    console.log(`OCL bond ${i}: ${s} - ${t}, order: ${o}`);
  }
  // TODO: If you want to support 2D coordinates, use OCL coordinate generation here
  return mol;
} 