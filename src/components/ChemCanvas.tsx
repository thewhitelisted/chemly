import { useRef, useCallback, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Molecule, Atom, Bond, Point, ElementSymbol, BondType } from '../types/chemistry';
import { HydrogenManager } from '../utils/hydrogenManager';

interface ChemCanvasProps {
  molecule: Molecule;
  selectedTool: 'atom' | 'bond' | 'select' | 'eraser' | 'pan';
  selectedElement: ElementSymbol;
  selectedBondType: BondType;
  canvasOffset: Point;
  scale: number;
  onMoleculeChange: (molecule: Molecule) => void;
  onCanvasTransformChange: (offset: Point, scale: number) => void;
}

const ATOM_RADIUS = 15;
const GRID_SIZE = 40;

const elementColors: Record<ElementSymbol, string> = {
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

export function ChemCanvas({
  molecule,
  selectedTool,
  selectedElement,
  selectedBondType,
  canvasOffset,
  scale,
  onMoleculeChange,
  onCanvasTransformChange,
}: ChemCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [previewBond, setPreviewBond] = useState<{ start: Point; end: Point } | null>(null);
  const [draggedAtom, setDraggedAtom] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredAtom, setHoveredAtom] = useState<string | null>(null);
  const [selectedAtom, setSelectedAtom] = useState<string | null>(null);
  const [recentDragEnd, setRecentDragEnd] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point | null>(null);
  
  // Track if we're currently updating hydrogens to prevent infinite loops
  const isUpdatingHydrogens = useRef(false);

  // Auto-fill hydrogens for atoms that need them when molecule changes (e.g., from SMILES import)
  useEffect(() => {
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
    const updatedMolecule = HydrogenManager.fillAllValences(molecule);
    
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

  // Transform world coordinates to screen coordinates for rendering
  const worldToScreen = useCallback((point: Point): Point => {
    return {
      x: point.x * scale + canvasOffset.x,
      y: point.y * scale + canvasOffset.y,
    };
  }, [canvasOffset, scale]);

  const snapToGrid = (point: Point): Point => {
    return {
      x: Math.round(point.x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(point.y / GRID_SIZE) * GRID_SIZE,
    };
  };

  const findAtomAtPoint = (point: Point): Atom | null => {
    const foundAtom = molecule.atoms.find(atom => {
      const distance = Math.sqrt(
        Math.pow(atom.position.x - point.x, 2) + Math.pow(atom.position.y - point.y, 2)
      );
      return distance <= ATOM_RADIUS + 5; // Increased click area for better interaction
    }) || null;
    
    return foundAtom;
  };

  const findBondAtPoint = (point: Point): Bond | null => {
    return molecule.bonds.find(bond => {
      const atom1 = molecule.atoms.find(a => a.id === bond.sourceAtomId);
      const atom2 = molecule.atoms.find(a => a.id === bond.targetAtomId);
      
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
  };

  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    // Don't handle clicks immediately after a drag operation
    if (isDragging || recentDragEnd) {
      console.log('Click prevented due to drag state:', { isDragging, recentDragEnd });
      return;
    }
    
    console.log('Canvas click:', { selectedTool, selectedAtom });
    
    event.preventDefault();
    event.stopPropagation();
    
    const point = getCanvasPoint(event.clientX, event.clientY);
    const snappedPoint = snapToGrid(point);
    const existingAtom = findAtomAtPoint(snappedPoint);

    if (selectedTool === 'select') {
      // For select tool, handle selection
      if (existingAtom) {
        // Select the clicked atom
        console.log('Selecting atom:', existingAtom.id);
        setSelectedAtom(existingAtom.id);
      } else {
        // Clear selection if clicking on empty space
        console.log('Clearing selection');
        setSelectedAtom(null);
      }
    } else if (selectedTool === 'atom') {
      if (existingAtom) {
        // Replace existing atom with new element
        const updatedAtoms = molecule.atoms.map(atom =>
          atom.id === existingAtom.id
            ? { ...atom, element: selectedElement }
            : atom
        );
        onMoleculeChange({ ...molecule, atoms: updatedAtoms });
      } else {
        // Add new atom
        const newAtom: Atom = {
          id: uuidv4(),
          element: selectedElement,
          position: snappedPoint,
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
      if (existingAtom) {
        // Remove atom and all connected bonds, including hydrogen atoms
        const updatedMolecule = HydrogenManager.onAtomDeleted(existingAtom.id, molecule);
        onMoleculeChange(updatedMolecule);
        setSelectedAtom(null);
      } else {
        // Check if we clicked on a bond
        console.log('Checking for bond at point:', point);
        const clickedBond = findBondAtPoint(point);
        console.log('Found bond:', clickedBond);
        
        if (clickedBond) {
          console.log('Deleting bond:', clickedBond.id);
          
          // Remove the bond
          const updatedBonds = molecule.bonds.filter(bond => bond.id !== clickedBond.id);
          const updatedMolecule = { ...molecule, bonds: updatedBonds };
          
          // Update hydrogens for both atoms affected by the bond removal
          const finalMolecule = HydrogenManager.onBondDeleted(clickedBond, updatedMolecule);
          onMoleculeChange(finalMolecule);
        }
      }
    }
  }, [molecule, selectedTool, selectedElement, getCanvasPoint, onMoleculeChange, isDragging]);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const point = getCanvasPoint(event.clientX, event.clientY);
    const snappedPoint = snapToGrid(point);
    
    if (selectedTool === 'pan') {
      // Start panning
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        setIsPanning(true);
        setPanStart({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        });
      }
    } else if (selectedTool === 'select') {
      // Check if we're clicking near the selected atom first
      if (selectedAtom) {
        const selectedAtomObj = molecule.atoms.find(a => a.id === selectedAtom);
        if (selectedAtomObj) {
          const distance = Math.sqrt(
            Math.pow(selectedAtomObj.position.x - point.x, 2) + 
            Math.pow(selectedAtomObj.position.y - point.y, 2)
          );
          if (distance <= ATOM_RADIUS + 5) {
            // We're clicking on the selected atom - start drag
            console.log('Starting drag on selected atom:', selectedAtom);
            setDraggedAtom(selectedAtom);
            setDragStart(point);
            setIsDragging(false);
            return;
          }
        }
      }
      
      // If not clicking on selected atom, check for any other atom
      const atom = findAtomAtPoint(point);
      const atomSnapped = findAtomAtPoint(snappedPoint);
      const foundAtom = atom || atomSnapped;
      
      if (foundAtom) {
        console.log('Selecting and preparing drag for atom:', foundAtom.id);
        setSelectedAtom(foundAtom.id);
        setDraggedAtom(foundAtom.id);
        setDragStart(point);
        setIsDragging(false);
      }
    } else if (selectedTool === 'bond') {
      const foundAtom = findAtomAtPoint(point) || findAtomAtPoint(snappedPoint);
      if (foundAtom) {
        setDragStart(foundAtom.position);
      }
    }
  }, [selectedTool, selectedAtom, molecule.atoms, getCanvasPoint]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    const point = getCanvasPoint(event.clientX, event.clientY);
    const snappedPoint = snapToGrid(point);

    if (selectedTool === 'pan' && isPanning && panStart) {
      // Handle panning
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
        
        // Update panStart for next movement
        setPanStart(currentScreenPoint);
      }
      return;
    }

    // Update hovered atom for cursor changes (only when not dragging or panning)
    if (!draggedAtom && !isPanning) {
      const hoveredAtomId = findAtomAtPoint(point)?.id || null;
      setHoveredAtom(hoveredAtomId);
    }

    if (selectedTool === 'select' && draggedAtom && dragStart) {
      // Check if we've moved enough to start dragging (minimum 3 pixels)
      const dragDistance = Math.sqrt(
        Math.pow(point.x - dragStart.x, 2) + Math.pow(point.y - dragStart.y, 2)
      );
      
      if (dragDistance > 3 || isDragging) {
        // Start or continue dragging
        if (!isDragging) {
          console.log('Starting drag for atom:', draggedAtom);
          setIsDragging(true);
        }
        
        // Use selectedAtom for dragging if we're over it, otherwise use draggedAtom
        const atomToDrag = selectedAtom || draggedAtom;
        
        const updatedAtoms = molecule.atoms.map(atom =>
          atom.id === atomToDrag
            ? { ...atom, position: snappedPoint }
            : atom
        );
        onMoleculeChange({ ...molecule, atoms: updatedAtoms });
      }
    } else if (selectedTool === 'bond' && dragStart) {
      // Preview bond creation
      setPreviewBond({ start: dragStart, end: snappedPoint });
    }
  }, [selectedTool, draggedAtom, dragStart, isDragging, selectedAtom, isPanning, panStart, canvasOffset, scale, getCanvasPoint, molecule, onMoleculeChange, onCanvasTransformChange]);

  const handleMouseUp = useCallback((event: React.MouseEvent) => {
    console.log('MouseUp:', { draggedAtom, isDragging, selectedAtom, isPanning });
    
    if (selectedTool === 'pan' && isPanning) {
      // End panning
      setIsPanning(false);
      setPanStart(null);
      return;
    }
    
    if (selectedTool === 'select' && draggedAtom) {
      // End atom dragging
      const wasDragging = isDragging;
      const draggedAtomId = draggedAtom; // Preserve the ID before clearing
      
      console.log('Ending drag for atom:', draggedAtomId, 'was dragging:', wasDragging);
      
      setDraggedAtom(null);
      setDragStart(null);
      
      // Keep the atom selected after dragging
      setSelectedAtom(draggedAtomId);
      
      // Clear isDragging state with a small delay if we were actually dragging
      if (wasDragging) {
        // Set flag to prevent immediate click handling, then clear it
        setRecentDragEnd(true);
        setTimeout(() => {
          setIsDragging(false);
          setRecentDragEnd(false);
        }, 100);
      } else {
        setIsDragging(false);
      }
    } else if (selectedTool === 'bond' && dragStart) {
      // Complete bond creation
      const point = getCanvasPoint(event.clientX, event.clientY);
      const snappedPoint = snapToGrid(point);
      const startAtom = findAtomAtPoint(dragStart);
      const endAtom = findAtomAtPoint(snappedPoint);

      if (startAtom && endAtom && startAtom.id !== endAtom.id) {
        // Check if bond already exists
        const existingBond = molecule.bonds.find(
          bond =>
            (bond.sourceAtomId === startAtom.id && bond.targetAtomId === endAtom.id) ||
            (bond.sourceAtomId === endAtom.id && bond.targetAtomId === startAtom.id)
        );

        if (existingBond) {
          // Update bond type
          const updatedBonds = molecule.bonds.map(bond =>
            bond.id === existingBond.id
              ? { ...bond, type: selectedBondType }
              : bond
          );
          
          // Create molecule with updated bond
          const moleculeWithUpdatedBond = { ...molecule, bonds: updatedBonds };
          
          // Update hydrogens for both atoms affected by the bond type change
          const finalMolecule = HydrogenManager.onBondTypeChanged(existingBond, moleculeWithUpdatedBond);
          onMoleculeChange(finalMolecule);
        } else {
          // Create new bond
          const newBond: Bond = {
            id: uuidv4(),
            sourceAtomId: startAtom.id,
            targetAtomId: endAtom.id,
            type: selectedBondType,
          };
          
          // Add bond first
          const moleculeWithBond = {
            ...molecule,
            bonds: [...molecule.bonds, newBond],
          };
          
          // Then update hydrogens for both atoms
          const finalMolecule = HydrogenManager.onBondCreated(newBond, moleculeWithBond);
          onMoleculeChange(finalMolecule);
        }
      } else if (!endAtom && startAtom) {
        // Create new atom at end point
        const newAtom: Atom = {
          id: uuidv4(),
          element: selectedElement,
          position: snappedPoint,
        };
        const newBond: Bond = {
          id: uuidv4(),
          sourceAtomId: startAtom.id,
          targetAtomId: newAtom.id,
          type: selectedBondType,
        };
        
        // Add new atom and bond
        let moleculeWithNewAtom = {
          atoms: [...molecule.atoms, newAtom],
          bonds: [...molecule.bonds, newBond],
        };
        
        // Add hydrogens to the new atom if it's not hydrogen
        if (selectedElement !== 'H') {
          moleculeWithNewAtom = HydrogenManager.onAtomCreated(newAtom, moleculeWithNewAtom);
        }
        
        // Update hydrogens for the source atom
        const finalMolecule = HydrogenManager.onBondCreated(newBond, moleculeWithNewAtom);
        onMoleculeChange(finalMolecule);
      }

      setDragStart(null);
      setPreviewBond(null);
    }
  }, [selectedTool, draggedAtom, isDragging, dragStart, isPanning, molecule, selectedBondType, selectedElement, getCanvasPoint, onMoleculeChange]);

  // Handle wheel zoom
  const handleWheel = useCallback((event: React.WheelEvent) => {
    event.preventDefault();
    
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Get mouse position relative to canvas
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Calculate zoom factor
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, scale * zoomFactor));
    
    // Calculate new offset to zoom towards mouse position
    const newOffset = {
      x: mouseX - (mouseX - canvasOffset.x) * (newScale / scale),
      y: mouseY - (mouseY - canvasOffset.y) * (newScale / scale)
    };
    
    onCanvasTransformChange(newOffset, newScale);
  }, [scale, canvasOffset, onCanvasTransformChange]);

  const renderBond = (bond: Bond) => {
    const atom1 = molecule.atoms.find(a => a.id === bond.sourceAtomId);
    const atom2 = molecule.atoms.find(a => a.id === bond.targetAtomId);
    
    if (!atom1 || !atom2) return null;

    const bondOffset = bond.type === 'double' ? 3 : bond.type === 'triple' ? 6 : 0;

    if (bond.type === 'single') {
      return (
        <line
          key={bond.id}
          x1={atom1.position.x}
          y1={atom1.position.y}
          x2={atom2.position.x}
          y2={atom2.position.y}
          stroke="#374151"
          strokeWidth="2"
        />
      );
    } else if (bond.type === 'double') {
      const dx = atom2.position.x - atom1.position.x;
      const dy = atom2.position.y - atom1.position.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const offsetX = (-dy / length) * bondOffset;
      const offsetY = (dx / length) * bondOffset;

      return (
        <g key={bond.id}>
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
    } else if (bond.type === 'triple') {
      const dx = atom2.position.x - atom1.position.x;
      const dy = atom2.position.y - atom1.position.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const offsetX = (-dy / length) * bondOffset;
      const offsetY = (dx / length) * bondOffset;

      return (
        <g key={bond.id}>
          {/* Center line */}
          <line
            x1={atom1.position.x}
            y1={atom1.position.y}
            x2={atom2.position.x}
            y2={atom2.position.y}
            stroke="#374151"
            strokeWidth="2"
          />
          {/* Top line */}
          <line
            x1={atom1.position.x + offsetX}
            y1={atom1.position.y + offsetY}
            x2={atom2.position.x + offsetX}
            y2={atom2.position.y + offsetY}
            stroke="#374151"
            strokeWidth="2"
          />
          {/* Bottom line */}
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
    } else if (bond.type === 'wedge') {
      // Wedge bond rendering (3D representation)
      const dx = atom2.position.x - atom1.position.x;
      const dy = atom2.position.y - atom1.position.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const offsetX = (-dy / length) * 4;
      const offsetY = (dx / length) * 4;

      return (
        <polygon
          key={bond.id}
          points={`${atom1.position.x},${atom1.position.y} ${atom2.position.x + offsetX},${atom2.position.y + offsetY} ${atom2.position.x - offsetX},${atom2.position.y - offsetY}`}
          fill="#374151"
          stroke="#374151"
          strokeWidth="1"
        />
      );
    } else if (bond.type === 'dash') {
      // Dashed bond rendering (3D representation - going into page)
      return (
        <line
          key={bond.id}
          x1={atom1.position.x}
          y1={atom1.position.y}
          x2={atom2.position.x}
          y2={atom2.position.y}
          stroke="#374151"
          strokeWidth="2"
          strokeDasharray="5,3"
        />
      );
    }

    return null;
  };

  const renderAtom = (atom: Atom) => {
    const color = elementColors[atom.element as ElementSymbol];
    const isSelected = selectedAtom === atom.id;
    const isHovered = hoveredAtom === atom.id && selectedTool === 'select';
    const isDraggedAtom = draggedAtom === atom.id;
    
    return (
      <g key={atom.id}>
        {/* Selection/hover ring */}
        {(isSelected || isHovered || isDraggedAtom) && (
          <circle
            cx={atom.position.x}
            cy={atom.position.y}
            r={ATOM_RADIUS + 4}
            fill="none"
            stroke={isSelected || isDraggedAtom ? "#3b82f6" : "#93c5fd"}
            strokeWidth="2"
            strokeDasharray={isHovered && !isSelected ? "4,2" : undefined}
            opacity="0.8"
          />
        )}
        <circle
          cx={atom.position.x}
          cy={atom.position.y}
          r={ATOM_RADIUS}
          fill={color}
          stroke="white"
          strokeWidth="2"
        />
        <text
          x={atom.position.x}
          y={atom.position.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="12"
          fontWeight="bold"
          fill="white"
        >
          {atom.element}
        </text>
      </g>
    );
  };

  return (
    <div className="flex-1 bg-white relative overflow-hidden">
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ 
          cursor: selectedTool === 'atom' ? 'crosshair' : 
                  selectedTool === 'bond' ? 'crosshair' : 
                  selectedTool === 'select' ? (hoveredAtom ? 'move' : 'default') :
                  selectedTool === 'eraser' ? 'pointer' :
                  selectedTool === 'pan' ? (isPanning ? 'move' : 'all-scroll') : 'default',
          userSelect: 'none'
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
          setIsPanning(false);
          setPanStart(null);
        }}
        onWheel={handleWheel}
      >
        {/* Grid Pattern */}
        <defs>
          <pattern
            id="grid"
            width={GRID_SIZE}
            height={GRID_SIZE}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`}
              fill="none"
              stroke="#d1d5db"
              strokeWidth="2"
            />
          </pattern>
        </defs>

        {/* Main content group with transform */}
        <g transform={`translate(${canvasOffset.x}, ${canvasOffset.y}) scale(${scale})`}>
          {/* Background grid that moves with content */}
          <rect 
            x={-10000} 
            y={-10000} 
            width={20000} 
            height={20000} 
            fill="url(#grid)" 
          />

          {/* Render bonds first */}
          {molecule.bonds.map(renderBond)}

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

          {/* Render atoms on top */}
          {molecule.atoms.map(renderAtom)}
        </g>
      </svg>
    </div>
  );
}
