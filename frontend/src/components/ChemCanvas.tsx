import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Molecule, Atom, Bond, Point, ElementSymbol, BondType } from '../types/chemistry';
import { HydrogenManager } from '../utils/hydrogenManager';

interface ChemCanvasProps {
  molecule: Molecule;
  selectedTool: 'atom' | 'select' | 'eraser' | 'pan';
  selectedElement: ElementSymbol;
  canvasOffset: Point;
  scale: number;
  onMoleculeChange: (molecule: Molecule) => void;
  onCanvasTransformChange: (offset: Point, scale: number) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const ATOM_RADIUS = 15;

// Helper hook to detect dark mode
function useDarkMode() {
  const [dark, setDark] = useState(() => document.body.classList.contains('dark'));
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDark(document.body.classList.contains('dark'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return dark;
}

const lightElementColors: Record<ElementSymbol, string> = {
  C: '#1f2937', // gray-800
  O: '#ef4444', // red-500  
  N: '#3b82f6', // blue-500
  P: '#f97316', // orange-500
  S: '#eab308', // yellow-500
  F: '#4ade80', // green-400
  Cl: '#16a34a', // green-600
  Br: '#991b1b', // red-800
  I: '#6b21a8', // purple-800
  H: '#d1d5db', // gray-300
};
const darkElementColors: Record<ElementSymbol, string> = {
  C: '#27272a', // zinc-800 (was H)
  O: '#fca5a5', // red-300
  N: '#93c5fd', // blue-300
  P: '#fdba74', // orange-300
  S: '#fde68a', // yellow-200
  F: '#6ee7b7', // green-300
  Cl: '#bbf7d0', // green-200
  Br: '#fca5a5', // red-300
  I: '#ddd6fe', // purple-200
  H: '#fff', // white for hydrogen in dark mode
};

// Helper to determine if a hex color is light
function isColorLight(hex: string) {
  // Remove # if present
  hex = hex.replace('#', '');
  // Convert 3-digit hex to 6-digit
  if (hex.length === 3) {
    hex = hex.split('').map(x => x + x).join('');
  }
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // Perceived luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}

// Memoized Bond component with stable props
const MemoizedBond = React.memo(function MemoizedBond({ 
  bond, 
  atom1, 
  atom2, 
  isHoveredForErase 
}: { 
  bond: Bond; 
  atom1: Atom; 
  atom2: Atom; 
  isHoveredForErase: boolean;
}) {
  const bondOffset = bond.type === 'double' ? 3 : bond.type === 'triple' ? 6 : 0;
  
  // Render highlight for eraser hover
  const highlight = isHoveredForErase ? (
    <line
      x1={atom1.position.x}
      y1={atom1.position.y}
      x2={atom2.position.x}
      y2={atom2.position.y}
      stroke="#ef4444"
      strokeWidth="8"
      opacity="0.4"
      pointerEvents="none"
    />
  ) : null;

  if (bond.type === 'single') {
    return (
      <g>
        {highlight}
        <line
          x1={atom1.position.x}
          y1={atom1.position.y}
          x2={atom2.position.x}
          y2={atom2.position.y}
          stroke="#374151"
          strokeWidth="2"
        />
      </g>
    );
  }
  
  if (bond.type === 'double' || bond.type === 'triple') {
    const dx = atom2.position.x - atom1.position.x;
    const dy = atom2.position.y - atom1.position.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const offsetX = (-dy / length) * bondOffset;
    const offsetY = (dx / length) * bondOffset;
    
    if (bond.type === 'double') {
      return (
        <g>
          {highlight}
          <line
            x1={atom1.position.x + offsetX}
            y1={atom1.position.y + offsetY}
            x2={atom2.position.x + offsetX}
            y2={atom2.position.y + offsetY}
            stroke="#374151"
            strokeWidth="2"
          />
          <line
            x1={atom1.position.x - offsetX}
            y1={atom1.position.y - offsetY}
            x2={atom2.position.x - offsetX}
            y2={atom2.position.y - offsetY}
            stroke="#374151"
            strokeWidth="2"
          />
        </g>
      );
    } else {
      // triple
      return (
        <g>
          {highlight}
          <line
            x1={atom1.position.x}
            y1={atom1.position.y}
            x2={atom2.position.x}
            y2={atom2.position.y}
            stroke="#374151"
            strokeWidth="2"
          />
          <line
            x1={atom1.position.x + offsetX}
            y1={atom1.position.y + offsetY}
            x2={atom2.position.x + offsetX}
            y2={atom2.position.y + offsetY}
            stroke="#374151"
            strokeWidth="2"
          />
          <line
            x1={atom1.position.x - offsetX}
            y1={atom1.position.y - offsetY}
            x2={atom2.position.x - offsetX}
            y2={atom2.position.y - offsetY}
            stroke="#374151"
            strokeWidth="2"
          />
        </g>
      );
    }
  }
  
  if (bond.type === 'wedge') {
    const dx = atom2.position.x - atom1.position.x;
    const dy = atom2.position.y - atom1.position.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const offsetX = (-dy / length) * 4;
    const offsetY = (dx / length) * 4;
    
    return (
      <g>
        {highlight}
        <polygon
          points={`${atom1.position.x},${atom1.position.y} ${atom2.position.x + offsetX},${atom2.position.y + offsetY} ${atom2.position.x - offsetX},${atom2.position.y - offsetY}`}
          fill="#374151"
          stroke="#374151"
          strokeWidth="1"
        />
      </g>
    );
  }
  
  if (bond.type === 'dash') {
    return (
      <g>
        {highlight}
        <line
          x1={atom1.position.x}
          y1={atom1.position.y}
          x2={atom2.position.x}
          y2={atom2.position.y}
          stroke="#374151"
          strokeWidth="2"
          strokeDasharray="5,3"
        />
      </g>
    );
  }
  
  return null;
});

// Memoized Atom component with stable props
const MemoizedAtom = React.memo(function MemoizedAtom({ 
  atom, 
  color, 
  isSelected, 
  isHovered, 
  isDragged, 
  isHoveredForErase,
  textColor
}: { 
  atom: Atom; 
  color: string; 
  isSelected: boolean; 
  isHovered: boolean; 
  isDragged: boolean; 
  isHoveredForErase: boolean;
  textColor: string;
}) {
  return (
    <g>
      {/* Selection/hover/drag/eraser ring */}
      {(isSelected || isHovered || isDragged || isHoveredForErase) && (
        <circle
          cx={atom.position.x}
          cy={atom.position.y}
          r={ATOM_RADIUS + 4}
          fill="none"
          stroke={isHoveredForErase ? "#ef4444" : (isSelected || isDragged ? "#3b82f6" : "#93c5fd")}
          strokeWidth={isHoveredForErase ? 3 : 2}
          strokeDasharray={isHovered && !isSelected ? "4,2" : undefined}
          opacity="0.8"
        />
      )}
      {/* Atom circle */}
      <circle
        cx={atom.position.x}
        cy={atom.position.y}
        r={ATOM_RADIUS}
        fill={color}
        stroke="white"
        strokeWidth="2"
      />
      {/* Atom label */}
      <text
        x={atom.position.x}
        y={atom.position.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="12"
        fontWeight="bold"
        fill={textColor}
      >
        {atom.element}
      </text>
    </g>
  );
});

export function ChemCanvas({
  molecule,
  selectedTool,
  selectedElement,
  canvasOffset,
  scale,
  onMoleculeChange,
  onCanvasTransformChange,
  undo,
  redo,
  canUndo,
  canRedo,
}: ChemCanvasProps) {
  const darkMode = useDarkMode();
  const elementColors = useMemo(() => 
    darkMode ? darkElementColors : lightElementColors, 
    [darkMode]
  );
  
  // Memoized atom map for fast lookups
  const atomMap = useMemo(() => {
    const map = new Map<string, Atom>();
    molecule.atoms.forEach(atom => map.set(atom.id, atom));
    return map;
  }, [molecule.atoms]);
  
  // For now, disable virtualization to ensure everything renders
  // Can be re-enabled later for large molecules
  const visibleAtoms = molecule.atoms;
  const visibleBonds = molecule.bonds;
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [selectBox, setSelectBox] = useState<{ start: Point; end: Point } | null>(null);
  const [previewBond, setPreviewBond] = useState<{ start: Point; end: Point } | null>(null);
  const [draggedAtom, setDraggedAtom] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [groupDragStart, setGroupDragStart] = useState<{ mouse: Point; atomPositions: Record<string, Point> } | null>(null);
  const [hoveredAtom, setHoveredAtom] = useState<string | null>(null);
  const [selectedAtom, setSelectedAtom] = useState<string | null>(null);
  const [recentDragEnd, setRecentDragEnd] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point | null>(null);
  const [selectedAtoms, setSelectedAtoms] = useState<string[]>([]);
  const [pendingBoxStart, setPendingBoxStart] = useState<Point | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [hoveredBond, setHoveredBond] = useState<string | null>(null);
  
  // Track if we're currently updating hydrogens to prevent infinite loops
  const isUpdatingHydrogens = useRef(false);
  const prevAtomBondCounts = useRef({ atomCount: molecule.atoms.length, bondCount: molecule.bonds.length });

  // Reset hover state when tool changes to ensure cursor updates immediately
  useEffect(() => {
    setHoveredAtom(null);
    setHoveredBond(null);
    setIsPanning(false);
    setPanStart(null);
    setDraggedAtom(null);
    setIsDragging(false);
    setDragStart(null);
  }, [selectedTool]);

  // Auto-fill hydrogens for atoms that need them when molecule changes (e.g., from SMILES import)
  useEffect(() => {
    // Only run if the number of atoms or bonds changes (not just positions)
    const atomCount = molecule.atoms.length;
    const bondCount = molecule.bonds.length;
    if (
      prevAtomBondCounts.current.atomCount === atomCount &&
      prevAtomBondCounts.current.bondCount === bondCount
    ) {
      // No structural change, skip hydrogen auto-fill
      return;
    }
    prevAtomBondCounts.current = { atomCount, bondCount };

    // Prevent infinite loops - if we're already updating hydrogens, skip this run
    if (isUpdatingHydrogens.current) {
      console.log('Skipping hydrogen auto-fill - already updating');
      return;
    }
    
    console.log('=== HYDROGEN AUTO-FILL CHECK ===');
    
    // Only run if we have non-hydrogen atoms but the molecule doesn't look "complete"
    const nonHydrogenAtoms = molecule.atoms.filter(atom => atom.element !== 'H');
    const hydrogenAtoms = molecule.atoms.filter(atom => atom.element === 'H');
    
    console.log('Non-hydrogen atoms to check:', nonHydrogenAtoms.map(a => `${a.element}(${a.id.slice(0,8)})`));
    console.log('Current hydrogen atoms:', hydrogenAtoms.length);
    
    // Skip if no non-hydrogen atoms
    if (nonHydrogenAtoms.length === 0) {
      console.log('No non-hydrogen atoms, skipping auto-fill');
      console.log('=== END HYDROGEN AUTO-FILL ===');
      return;
    }
    
    // Set flag to prevent recursion
    isUpdatingHydrogens.current = true;
    
    // Use HydrogenManager to fill all valences
    let updatedMolecule = HydrogenManager.fillAllValences(molecule);
    // Clear implicitHydrogens for all non-hydrogen atoms
    updatedMolecule = {
      ...updatedMolecule,
      atoms: updatedMolecule.atoms.map(atom =>
        atom.element === 'H' ? atom : { ...atom, implicitHydrogens: 0 }
      ),
    };
    // Check if anything changed
    const hasChanges = updatedMolecule.atoms.length !== molecule.atoms.length || 
                      updatedMolecule.bonds.length !== molecule.bonds.length;
    
    // Update molecule if we made changes
    if (hasChanges) {
      console.log('Calling onMoleculeChange with updated molecule');
      console.log('Updated molecule after hydrogen changes:', {
        atoms: updatedMolecule.atoms.length,
        bonds: updatedMolecule.bonds.length,
        hydrogens: updatedMolecule.atoms.filter(a => a.element === 'H').length
      });
      onMoleculeChange(updatedMolecule);
    } else {
      console.log('No hydrogen changes needed');
    }
    
    // Clear the flag after a short delay to allow React to finish updating
    setTimeout(() => {
      isUpdatingHydrogens.current = false;
    }, 100);
    
    console.log('=== END HYDROGEN AUTO-FILL ===');
  }, [molecule.atoms.length, molecule.bonds.length]); // Only trigger on structural changes, not molecule reference changes

  // Memoized utility functions
  const getCanvasPoint = useCallback((clientX: number, clientY: number): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };
    
    const rect = svgRef.current.getBoundingClientRect();
    const rawX = clientX - rect.left;
    const rawY = clientY - rect.top;
    
    // Transform from screen coordinates to world coordinates
    return {
      x: (rawX - canvasOffset.x) / scale,
      y: (rawY - canvasOffset.y) / scale,
    };
  }, [canvasOffset, scale]);

  const findAtomAtPoint = useCallback((point: Point): Atom | null => {
    const foundAtom = molecule.atoms.find(atom => {
      const distance = Math.sqrt(
        Math.pow(atom.position.x - point.x, 2) + Math.pow(atom.position.y - point.y, 2)
      );
      return distance <= ATOM_RADIUS + 5; // Increased click area for better interaction
    }) || null;
    
    return foundAtom;
  }, [molecule.atoms]);

  const findBondAtPoint = useCallback((point: Point): Bond | null => {
    return molecule.bonds.find(bond => {
      const atom1 = atomMap.get(bond.sourceAtomId);
      const atom2 = atomMap.get(bond.targetAtomId);
      
      if (!atom1 || !atom2) return false;
      
      // Calculate distance from point to line segment
      const lineLength = Math.sqrt(
        Math.pow(atom2.position.x - atom1.position.x, 2) + 
        Math.pow(atom2.position.y - atom1.position.y, 2)
      );
      
      if (lineLength === 0) return false;
      
      // Vector from atom1 to atom2
      const lineUnitX = (atom2.position.x - atom1.position.x) / lineLength;
      const lineUnitY = (atom2.position.y - atom1.position.y) / lineLength;
      
      // Vector from atom1 to click point
      const pointVecX = point.x - atom1.position.x;
      const pointVecY = point.y - atom1.position.y;
      
      // Project point onto line
      const projectionLength = pointVecX * lineUnitX + pointVecY * lineUnitY;
      
      // Clamp projection to line segment
      const clampedProjection = Math.max(0, Math.min(lineLength, projectionLength));
      
      // Find closest point on line segment
      const closestX = atom1.position.x + clampedProjection * lineUnitX;
      const closestY = atom1.position.y + clampedProjection * lineUnitY;
      
      // Calculate distance from click point to closest point on line
      const distance = Math.sqrt(
        Math.pow(point.x - closestX, 2) + Math.pow(point.y - closestY, 2)
      );
      
      return distance <= 8; // Bond click tolerance
    }) || null;
  }, [molecule.bonds, atomMap]);

  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    // Don't handle clicks immediately after a drag operation
    if (isDragging || recentDragEnd) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const point = getCanvasPoint(event.clientX, event.clientY);
    const existingAtom = findAtomAtPoint(point);

    if (selectedTool === 'select') {
      // For select tool, handle selection and bond clicking
      if (existingAtom) {
        // Select the clicked atom
        setSelectedAtoms([existingAtom.id]);
      } else {
        // Check if we clicked on a bond to increase its order
        const clickedBond = findBondAtPoint(point);
        if (clickedBond) {
          console.log('Clicking bond to increase order:', clickedBond.id, 'current type:', clickedBond.type);
          
          // Cycle through bond types: single -> double -> triple -> single
          let newBondType: BondType;
          switch (clickedBond.type) {
            case 'single':
              newBondType = 'double';
              break;
            case 'double':
              newBondType = 'triple';
              break;
            case 'triple':
              newBondType = 'single';
              break;
            case 'wedge':
              newBondType = 'dash';
              break;
            case 'dash':
              newBondType = 'single';
              break;
            default:
              newBondType = 'single';
          }
          
          // For now, allow bond type changes (validation could be enhanced in the future)
          const updatedBonds = molecule.bonds.map(bond =>
            bond.id === clickedBond.id
              ? { ...bond, type: newBondType }
              : bond
          );
          
          // Create molecule with updated bond
          const moleculeWithUpdatedBond = { ...molecule, bonds: updatedBonds };
          
          // Pass the updated bond to HydrogenManager
          const updatedBond = { ...clickedBond, type: newBondType };
          const finalMolecule = HydrogenManager.onBondTypeChanged(updatedBond, moleculeWithUpdatedBond);
          onMoleculeChange(finalMolecule);
        } else {
          // Clear selection if clicking on empty space
          setSelectedAtoms([]);
        }
      }
    } else if (selectedTool === 'atom') {
      if (existingAtom) {
        // Only replace element if clicking (not dragging) and not connecting two atoms
        // If dragging from one atom to another, do NOT change the element
        // This logic is now handled in mouse up (bond creation)
        // Do nothing here
        return;
      } else {
        // Add new atom
        const newAtom: Atom = {
          id: uuidv4(),
          element: selectedElement,
          position: point,
        };
        
        // Add the atom first
        const moleculeWithNewAtom = {
          ...molecule,
          atoms: [...molecule.atoms, newAtom],
        };
        
        // Then add hydrogens to complete valence (except for hydrogen atoms)
        if (selectedElement !== 'H') {
          const finalMolecule = HydrogenManager.onAtomCreated(newAtom, moleculeWithNewAtom);
          onMoleculeChange(finalMolecule);
        } else {
          onMoleculeChange(moleculeWithNewAtom);
        }
      }
    } else if (selectedTool === 'eraser') {
      // Try to delete atom first (broaden tolerance)
      const atomToDelete = findAtomAtPoint(point) || findAtomAtPoint(point);
      if (atomToDelete) {
        let updatedMolecule = HydrogenManager.onAtomDeleted(atomToDelete.id, molecule);
        // Extra safety: update hydrogens for all non-hydrogen atoms
        const nonHydrogenAtoms = updatedMolecule.atoms.filter(a => a.element !== 'H');
        const nonHydrogenIds = nonHydrogenAtoms.map(a => a.id);
        updatedMolecule = HydrogenManager.updateHydrogensForAtoms(nonHydrogenIds, updatedMolecule);
        onMoleculeChange(updatedMolecule);
        setSelectedAtom(null);
        setDraggedAtom(null);
        setHoveredAtom(null);
        setHoveredBond(null);
        return;
      }
      // Try to delete bond if no atom found
      const bondToDelete = findBondAtPoint(point);
      if (bondToDelete) {
        const updatedBonds = molecule.bonds.filter(bond => bond.id !== bondToDelete.id);
        const updatedMolecule = { ...molecule, bonds: updatedBonds };
        const finalMolecule = HydrogenManager.onBondDeleted(bondToDelete, updatedMolecule);
        onMoleculeChange(finalMolecule);
        setSelectedAtom(null);
        setDraggedAtom(null);
        setHoveredAtom(null);
        setHoveredBond(null);
        return;
      }
      // If nothing found, do nothing
    }
  }, [molecule, selectedTool, selectedElement, getCanvasPoint, onMoleculeChange, isDragging, recentDragEnd]);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (recentDragEnd) {
      return;
    }
    setIsMouseDown(true);
    event.preventDefault();
    event.stopPropagation();
    const rawPoint = getCanvasPoint(event.clientX, event.clientY);
    if (selectedTool === 'pan') {
      // Start panning, clear any atom drag state
      setDraggedAtom(null);
      setIsDragging(false);
      setDragStart(null);
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        setIsPanning(true);
        setPanStart({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        });
      }
    } else if (selectedTool === 'select') {
      const atom = findAtomAtPoint(rawPoint) || findAtomAtPoint(rawPoint);
      if (atom) {
        // Only allow individual selection if no dragStart (i.e., not starting a selection box)
        if (!dragStart) {
          if (selectedAtoms.length > 1 && selectedAtoms.includes(atom.id)) {
            // Clicked atom is already in selection: start group drag, preserve selection
            setDraggedAtom(atom.id);
            setIsDragging(true);
            setGroupDragStart({
              mouse: rawPoint,
              atomPositions: Object.fromEntries(
                molecule.atoms.filter(a => selectedAtoms.includes(a.id)).map(a => [a.id, { ...a.position }])
              )
            });
          } else if (selectedAtoms.length === 1 && selectedAtoms[0] === atom.id) {
            // Only one atom selected and it's the one clicked: preserve selection, start drag
            setDraggedAtom(atom.id);
            setIsDragging(true);
            setGroupDragStart({
              mouse: rawPoint,
              atomPositions: { [atom.id]: { ...atom.position } }
            });
          } else {
            // Clicked atom is not in selection: select only this atom and start drag
            setSelectedAtoms([atom.id]);
            setDraggedAtom(atom.id);
            setIsDragging(true);
            setGroupDragStart({
              mouse: rawPoint,
              atomPositions: { [atom.id]: { ...atom.position } }
            });
          }
        }
        // If dragStart is set, do nothing (we're starting a selection box)
      } else {
        // Only set pendingBoxStart, don't start dragStart yet
        setPendingBoxStart(rawPoint);
        setSelectBox(null);
        setIsDragging(false);
        setDraggedAtom(null);
        setGroupDragStart(null);
      }
    } else if (selectedTool === 'atom') {
      // For atom tool, check if we're clicking on an existing atom to start bond creation
      const foundAtom = findAtomAtPoint(rawPoint) || findAtomAtPoint(rawPoint);
      if (foundAtom) {
        console.log('Starting atom bond creation from:', foundAtom.id);
        setDraggedAtom(foundAtom.id);
        setDragStart(foundAtom.position);
        setIsDragging(false);
      }
    }
  }, [selectedTool, selectedAtom, molecule.atoms, getCanvasPoint, selectedAtoms, dragStart, recentDragEnd]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    const rawPoint = getCanvasPoint(event.clientX, event.clientY);

    if (selectedTool === 'pan' && isPanning && panStart) {
      // Handle panning (atom drag state is ignored)
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        const currentScreenPoint = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        };
        const deltaX = currentScreenPoint.x - panStart.x;
        const deltaY = currentScreenPoint.y - panStart.y;
        const newOffset = {
          x: canvasOffset.x + deltaX,
          y: canvasOffset.y + deltaY
        };
        onCanvasTransformChange(newOffset, scale);
        setPanStart(currentScreenPoint);
      }
      return;
    }

    // Only start select box if mouse has moved enough from pendingBoxStart and mouse is down
    if (selectedTool === 'select' && isMouseDown && pendingBoxStart && !dragStart) {
      const dragDistance = Math.sqrt(
        Math.pow(rawPoint.x - pendingBoxStart.x, 2) + Math.pow(rawPoint.y - pendingBoxStart.y, 2)
      );
      if (dragDistance > 2) {
        setDragStart(pendingBoxStart);
        setIsDragging(true);
        setSelectBox({ start: pendingBoxStart, end: rawPoint });
        setPendingBoxStart(null);
        return;
      }
    }

    // === ERASER TOOL HOVER LOGIC ===
    if (selectedTool === 'eraser') {
      const hoveredAtomObj = findAtomAtPoint(rawPoint);
      const hoveredBondObj = !hoveredAtomObj ? findBondAtPoint(rawPoint) : null;
      setHoveredAtom(hoveredAtomObj ? hoveredAtomObj.id : null);
      setHoveredBond(hoveredBondObj ? hoveredBondObj.id : null);
      return;
    }

    // Update hovered atom for cursor changes (only when not dragging, not panning, and not in selection box drag)
    if (
      !draggedAtom &&
      !isPanning &&
      !(selectedTool === 'select' && (dragStart || selectBox))
    ) {
      const hoveredAtomId = findAtomAtPoint(rawPoint)?.id || null;
      setHoveredAtom(hoveredAtomId);
    } else if (selectedTool === 'select' && (dragStart || selectBox)) {
      // If selection box drag is in progress, clear hoveredAtom
      if (hoveredAtom !== null) setHoveredAtom(null);
    }

    if (selectedTool === 'select' && draggedAtom && isDragging && groupDragStart && selectedAtoms.length > 0) {
      const deltaX = rawPoint.x - groupDragStart.mouse.x;
      const deltaY = rawPoint.y - groupDragStart.mouse.y;
      
      // Move all selected atoms to their new positions
      const updatedAtoms = molecule.atoms.map(atom =>
        selectedAtoms.includes(atom.id)
          ? { ...atom, position: {
              x: groupDragStart.atomPositions[atom.id].x + deltaX,
              y: groupDragStart.atomPositions[atom.id].y + deltaY
            } }
          : atom
      );
      
      // Check if any hydrogen atoms are manually selected
      const selectedHydrogenIds = selectedAtoms.filter(atomId => {
        const atom = molecule.atoms.find(a => a.id === atomId);
        return atom && atom.element === 'H';
      });
      
      let updatedMolecule = { ...molecule, atoms: updatedAtoms };
      
      // Only recalculate hydrogens for heavy atoms that don't have manually selected hydrogens
      if (selectedHydrogenIds.length === 0) {
        // No hydrogen atoms are manually selected, safe to recalculate all heavy atoms
        const movedHeavyAtomIds = selectedAtoms.filter(atomId => {
          const atom = molecule.atoms.find(a => a.id === atomId);
          return atom && atom.element !== 'H';
        });
        if (movedHeavyAtomIds.length > 0) {
          updatedMolecule = HydrogenManager.updateHydrogensForAtoms(movedHeavyAtomIds, updatedMolecule);
        }
      } else {
        // Hydrogen atoms are manually selected - don't recalculate any hydrogens
        // This preserves the manual selection of hydrogen atoms during group moves
      }
      
      onMoleculeChange(updatedMolecule);
      setPreviewBond(null); // No bond preview in move mode
    } else if (selectedTool === 'select' && dragStart) {
      // Only start select box if drag exceeds threshold
      const dragDistance = Math.sqrt(
        Math.pow(rawPoint.x - dragStart.x, 2) + Math.pow(rawPoint.y - dragStart.y, 2)
      );
      if (dragDistance > 2) {
        setIsDragging(true);
        setSelectBox({ start: dragStart, end: rawPoint });
      }
    } else if (selectedTool === 'atom' && draggedAtom && dragStart) {
      // For atom tool, always show preview for bond + new atom creation
      const dragDistance = Math.sqrt(
        Math.pow(rawPoint.x - dragStart.x, 2) + Math.pow(rawPoint.y - dragStart.y, 2)
      );
      
      if (dragDistance > 8) {
        // Show preview bond to where the new atom will be created
        setPreviewBond({ start: dragStart, end: rawPoint });
      }
    }
  }, [selectedTool, draggedAtom, dragStart, isDragging, selectedAtom, isPanning, panStart, canvasOffset, scale, getCanvasPoint, molecule, onMoleculeChange, onCanvasTransformChange, groupDragStart, selectedAtoms, selectBox, pendingBoxStart, isMouseDown, hoveredAtom]);

  const handleMouseUp = useCallback((event: React.MouseEvent) => {
    setIsMouseDown(false);
    // If a selection box was never started, clear pendingBoxStart and dragStart
    if (pendingBoxStart && !dragStart) {
      setPendingBoxStart(null);
      setDragStart(null);
      setSelectBox(null);
    }
    console.log('MouseUp:', { draggedAtom, isDragging, selectedAtom, isPanning, selectedTool });
    
    if (selectedTool === 'pan' && isPanning) {
      // End panning
      setIsPanning(false);
      setPanStart(null);
      return;
    }
    
    if (selectedTool === 'select') {
      if (selectBox) {
        const { start, end } = selectBox;
        const boxWidth = Math.abs(end.x - start.x);
        const boxHeight = Math.abs(end.y - start.y);
        if (boxWidth > 4 && boxHeight > 4) {
          // Select all atoms inside the box
          const left = Math.min(start.x, end.x);
          const right = Math.max(start.x, end.x);
          const top = Math.min(start.y, end.y);
          const bottom = Math.max(start.y, end.y);
          const selectedAtomIds = molecule.atoms
            .filter(atom => atom.position.x >= left && atom.position.x <= right && atom.position.y >= top && atom.position.y <= bottom)
            .map(atom => atom.id);
          setSelectedAtoms(selectedAtomIds);
        } else {
          // Only clear selection if the box was too small (i.e., a click, not a drag)
          setSelectedAtoms([]);
        }
        setSelectBox(null);
        setIsDragging(false);
        setDraggedAtom(null);
        setGroupDragStart(null);
        setDragStart(null);
        setRecentDragEnd(true);
        setTimeout(() => setRecentDragEnd(false), 100);
        return;
      }
      // Only clear selection if this was a click on empty space (not a drag or group move)
      if (!selectBox && !dragStart && !draggedAtom && !isDragging) {
        const rawPoint = getCanvasPoint(event.clientX, event.clientY);
        const atom = findAtomAtPoint(rawPoint) || findAtomAtPoint(rawPoint);
        if (atom) {
          setSelectedAtoms([atom.id]);
        } else {
          setSelectedAtoms([]);
        }
        setIsDragging(false);
        setDraggedAtom(null);
        setGroupDragStart(null);
        return;
      }
      // Do NOT clear selection after a group move (dragging selected atoms)
      // Remove the block that clears selection on dragStart alone
    }
    if (selectedTool === 'select' && draggedAtom && isDragging) {
      // End move mode drag
      setIsDragging(false);
      setDraggedAtom(null);
      setDragStart(null);
      setPreviewBond(null);
      setGroupDragStart(null);
      // Selection is preserved
      setRecentDragEnd(true);
      setTimeout(() => setRecentDragEnd(false), 100);
    } else if (selectedTool === 'atom' && draggedAtom && dragStart) {
      // Create new atom with bond from the dragged atom
      const rawPoint = getCanvasPoint(event.clientX, event.clientY);
      const startAtom = molecule.atoms.find(a => a.id === draggedAtom);
      
      // Check if we dragged far enough to create a new atom
      const dragDistance = Math.sqrt(
        Math.pow(rawPoint.x - dragStart.x, 2) + Math.pow(rawPoint.y - dragStart.y, 2)
      );
      
      if (startAtom && dragDistance > 8) {
        // Check if there's already an atom at the target position
        const existingAtom = findAtomAtPoint(rawPoint);
        if (existingAtom && existingAtom.id !== startAtom.id) {
          // Connect to existing atom instead of creating new one
          const existingBond = molecule.bonds.find(
            bond =>
              (bond.sourceAtomId === startAtom.id && bond.targetAtomId === existingAtom.id) ||
              (bond.sourceAtomId === existingAtom.id && bond.targetAtomId === startAtom.id)
          );
          if (!existingBond) {
            // Check if bond can be created
            if (HydrogenManager.canCreateBond(startAtom.id, existingAtom.id, molecule)) {
              // Create new bond to existing atom
              const newBond: Bond = {
                id: uuidv4(),
                sourceAtomId: startAtom.id,
                targetAtomId: existingAtom.id,
                type: 'single',
              };
              const moleculeWithBond = {
                ...molecule,
                bonds: [...molecule.bonds, newBond],
              };
              const finalMolecule = HydrogenManager.onBondCreated(newBond, moleculeWithBond);
              onMoleculeChange(finalMolecule);
            } else {
              console.log('Cannot create bond: would exceed valence limits');
            }
          }
        } else {
          // Create new atom at the drop position
          const newAtom: Atom = {
            id: uuidv4(),
            element: selectedElement,
            position: rawPoint,
          };
          // Create bond between start atom and new atom
          const newBond: Bond = {
            id: uuidv4(),
            sourceAtomId: startAtom.id,
            targetAtomId: newAtom.id,
            type: 'single',
          };
          // Add both atom and bond
          const moleculeWithAtomAndBond = {
            ...molecule,
            atoms: [...molecule.atoms, newAtom],
            bonds: [...molecule.bonds, newBond],
          };
          // Update hydrogens for both atoms
          let finalMolecule = HydrogenManager.onBondCreated(newBond, moleculeWithAtomAndBond);
          // Also add hydrogens to the new atom if it's not hydrogen
          if (selectedElement !== 'H') {
            finalMolecule = HydrogenManager.onAtomCreated(newAtom, finalMolecule);
          }
          console.log('Created new atom with bond:', { newAtom: newAtom.id, startAtom: startAtom.id });
          onMoleculeChange(finalMolecule);
        }
      }
      
      // Clear atom tool drag states
      setDraggedAtom(null);
      setDragStart(null);
      setPreviewBond(null);
    }
    // Always clear pendingBoxStart on mouse up
    setPendingBoxStart(null);
  }, [selectedTool, draggedAtom, isDragging, dragStart, isPanning, molecule, selectedElement, getCanvasPoint, onMoleculeChange, selectBox, recentDragEnd, pendingBoxStart]);

  // Handle wheel zoom
  const handleWheel = useCallback((event: React.WheelEvent) => {
    event.preventDefault();
    
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Get mouse position relative to canvas
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Calculate zoom with constant 10% increments
    const zoomIncrement = 0.1; // 10%
    const newScale = event.deltaY > 0 
      ? Math.max(0.2, scale - zoomIncrement) 
      : Math.min(2, scale + zoomIncrement);
    
    // Calculate new offset to zoom towards mouse position
    const newOffset = {
      x: mouseX - (mouseX - canvasOffset.x) * (newScale / scale),
      y: mouseY - (mouseY - canvasOffset.y) * (newScale / scale)
    };
    
    onCanvasTransformChange(newOffset, newScale);
  }, [scale, canvasOffset, onCanvasTransformChange]);

  // Handle zoom slider change
  const handleZoomSliderChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const sliderValue = parseFloat(event.target.value);
    
    // Convert slider value (0-100) to scale (0.2-2.0)
    // 50 = center = 100% (scale 1.0)
    // 0 = left = minimum zoom (scale 0.2)
    // 100 = right = maximum zoom (scale 2.0)
    let newScale: number;
    if (sliderValue <= 50) {
      // Left half: 0.2 to 1.0
      newScale = 0.2 + (sliderValue / 50) * (1.0 - 0.2);
    } else {
      // Right half: 1.0 to 2.0
      newScale = 1.0 + ((sliderValue - 50) / 50) * (2.0 - 1.0);
    }
    
    // Get center of canvas for zoom reference point
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate new offset to zoom towards center
    const newOffset = {
      x: centerX - (centerX - canvasOffset.x) * (newScale / scale),
      y: centerY - (centerY - canvasOffset.y) * (newScale / scale)
    };
    
    onCanvasTransformChange(newOffset, newScale);
  }, [scale, canvasOffset, onCanvasTransformChange]);

    const renderBond = useCallback((bond: Bond) => {
    const atom1 = atomMap.get(bond.sourceAtomId);
    const atom2 = atomMap.get(bond.targetAtomId);
    
    if (!atom1 || !atom2) return null;
    
    const isHoveredForErase = selectedTool === 'eraser' && hoveredBond === bond.id;
    
    return (
      <MemoizedBond
        key={bond.id}
        bond={bond}
        atom1={atom1}
        atom2={atom2}
        isHoveredForErase={isHoveredForErase}
      />
    );
  }, [atomMap, selectedTool, hoveredBond]);

  const renderAtom = useCallback((atom: Atom) => {
    const color = elementColors[atom.element as ElementSymbol] || elementColors['C'];
    const isSelected = selectedAtoms.includes(atom.id);
    const isHovered = hoveredAtom === atom.id && selectedTool === 'select';
    const isDragged = draggedAtom === atom.id;
    const isHoveredForErase = selectedTool === 'eraser' && hoveredAtom === atom.id;
    const textColor = isColorLight(color) ? '#18181b' : 'white';
    
    return (
      <MemoizedAtom
        key={atom.id}
        atom={atom}
        color={color}
        isSelected={isSelected}
        isHovered={isHovered}
        isDragged={isDragged}
        isHoveredForErase={isHoveredForErase}
        textColor={textColor}
      />
    );
  }, [elementColors, selectedAtoms, hoveredAtom, selectedTool, draggedAtom]);

  return (
    <div className={darkMode ? "flex-1 bg-gradient-to-br from-zinc-900 to-zinc-800 relative overflow-hidden" : "flex-1 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden"}>
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ 
          cursor: 'default',
          userSelect: 'none',
          transition: 'none'
        }}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setDragStart(null);
          setPreviewBond(null);
          setDraggedAtom(null);
          setIsDragging(false);
          setHoveredAtom(null);
          setHoveredBond(null);
          setIsPanning(false);
          setPanStart(null);
          setSelectBox(null);
        }}
        onWheel={handleWheel}
      >
        {/* Main content group with transform */}
        <g transform={`translate(${canvasOffset.x}, ${canvasOffset.y}) scale(${scale})`}>
          {/* Layer 1: Static bonds (back layer) */}
          <g className="bonds-layer">
            {visibleBonds.map(renderBond)}
          </g>

          {/* Layer 2: Interactive elements (middle layer) */}
          <g className="interactive-layer">
            {/* Preview bond */}
            {previewBond && (
              <line
                x1={previewBond.start.x}
                y1={previewBond.start.y}
                x2={previewBond.end.x}
                y2={previewBond.end.y}
                stroke="#3b82f6"
                strokeWidth="2"
                strokeDasharray="5,5"
                opacity="0.7"
              />
            )}

            {/* Select box preview */}
            {selectBox && (
              <rect
                x={Math.min(selectBox.start.x, selectBox.end.x)}
                y={Math.min(selectBox.start.y, selectBox.end.y)}
                width={Math.abs(selectBox.end.x - selectBox.start.x)}
                height={Math.abs(selectBox.end.y - selectBox.start.y)}
                fill="#3b82f6"
                fillOpacity={0.12}
                stroke="#3b82f6"
                strokeDasharray="6,3"
                strokeWidth={2}
              />
            )}
          </g>

          {/* Layer 3: Atoms (top layer) */}
          <g className="atoms-layer">
            {visibleAtoms.map(renderAtom)}
          </g>
        </g>
      </svg>

      {/* Undo/Redo Controls */}
      <div className="absolute bottom-4 left-4 flex gap-2">
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`
            w-10 h-10 rounded-lg shadow-lg flex items-center justify-center transition-all
            ${darkMode
              ? canUndo 
                ? 'bg-zinc-800/80 hover:bg-zinc-700/90 text-zinc-300 hover:text-zinc-100 border border-zinc-600 cursor-pointer' 
                : 'bg-zinc-900/60 text-zinc-600 border border-zinc-700 cursor-not-allowed'
              : canUndo 
                ? 'bg-white/80 hover:bg-white/90 text-gray-700 hover:text-gray-900 border border-gray-200 cursor-pointer' 
                : 'bg-gray-100/60 text-gray-400 border border-gray-200 cursor-not-allowed'
            }
          `}
          title="Undo (Ctrl+Z)"
        >
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" 
            />
          </svg>
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className={`
            w-10 h-10 rounded-lg shadow-lg flex items-center justify-center transition-all
            ${darkMode
              ? canRedo 
                ? 'bg-zinc-800/80 hover:bg-zinc-700/90 text-zinc-300 hover:text-zinc-100 border border-zinc-600 cursor-pointer' 
                : 'bg-zinc-900/60 text-zinc-600 border border-zinc-700 cursor-not-allowed'
              : canRedo 
                ? 'bg-white/80 hover:bg-white/90 text-gray-700 hover:text-gray-900 border border-gray-200 cursor-pointer' 
                : 'bg-gray-100/60 text-gray-400 border border-gray-200 cursor-not-allowed'
            }
          `}
          title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
        >
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" 
            />
          </svg>
        </button>
      </div>

      {/* Zoom Controls */}
      <style>
        {`
          .slider::-webkit-slider-thumb {
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #000000;
            cursor: pointer;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          .slider::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #000000;
            cursor: pointer;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          .slider::-webkit-slider-track {
            height: 8px;
            border-radius: 4px;
          }
          .slider::-moz-range-track {
            height: 8px;
            border-radius: 4px;
          }
        `}
      </style>
      <div
        className="absolute bottom-4 right-4 rounded-xl shadow-2xl border border-gray-200 p-3" 
        style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.6)'
        }}
      >
        <div className="flex items-center gap-2">
          <svg 
            className="w-4 h-4 text-gray-900" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={
                // Convert current scale back to slider value (0-100)
                scale <= 1.0 
                  ? ((scale - 0.2) / (1.0 - 0.2)) * 50
                  : 50 + ((scale - 1.0) / (2.0 - 1.0)) * 50
              }
              onChange={handleZoomSliderChange}
              className="w-36 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #000000 0%, #000000 ${
                  scale <= 1.0 
                    ? ((scale - 0.2) / (1.0 - 0.2)) * 50
                    : 50 + ((scale - 1.0) / (2.0 - 1.0)) * 50
                }%, #6b7280 ${
                  scale <= 1.0 
                    ? ((scale - 0.2) / (1.0 - 0.2)) * 50
                    : 50 + ((scale - 1.0) / (2.0 - 1.0)) * 50
                }%, #6b7280 100%)`,
                WebkitAppearance: 'none',
              }}
            />
          </div>
          <span className="text-xs font-mono font-bold min-w-[2.5rem] text-center text-gray-900">
            {Math.round(scale * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
