export type ElementSymbol = 'C' | 'N' | 'O' | 'P' | 'S' | 'F' | 'Cl' | 'Br' | 'I' | 'H';

export type BondType = 'single' | 'double' | 'triple' | 'wedge' | 'dash';

export interface Point {
  x: number;
  y: number;
}

export interface Atom {
  id: string;
  element: ElementSymbol;
  position: Point;
  charge?: number;
  hydrogens?: number;
}

export interface Bond {
  id: string;
  atomId1: string;
  atomId2: string;
  type: BondType;
}

export interface Molecule {
  atoms: Atom[];
  bonds: Bond[];
}

export interface DrawingState {
  molecule: Molecule;
  selectedTool: 'atom' | 'bond' | 'select' | 'eraser';
  selectedElement: ElementSymbol;
  selectedBondType: BondType;
  canvasOffset: Point;
  scale: number;
}

export interface ToolbarState {
  activeElement: ElementSymbol;
  activeBondType: BondType;
  activeTool: 'atom' | 'bond' | 'select' | 'eraser';
}
