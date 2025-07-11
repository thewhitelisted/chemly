import { useRef, useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Molecule, Atom, Bond, Point, ElementSymbol, BondType } from '../types/chemistry';

interface ChemCanvasProps {
  molecule: Molecule;
  selectedTool: 'atom' | 'bond' | 'select' | 'eraser';
  selectedElement: ElementSymbol;
  selectedBondType: BondType;
  onMoleculeChange: (molecule: Molecule) => void;
}

const ATOM_RADIUS = 15;
const GRID_SIZE = 20;

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
  onMoleculeChange,
}: ChemCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [previewBond, setPreviewBond] = useState<{ start: Point; end: Point } | null>(null);
  const [draggedAtom, setDraggedAtom] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredAtom, setHoveredAtom] = useState<string | null>(null);
  const [selectedAtom, setSelectedAtom] = useState<string | null>(null);
  const [recentDragEnd, setRecentDragEnd] = useState(false);

  const getCanvasPoint = useCallback((clientX: number, clientY: number): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };
    
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

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
        onMoleculeChange({
          ...molecule,
          atoms: [...molecule.atoms, newAtom],
        });
      }
    } else if (selectedTool === 'eraser' && existingAtom) {
      // Remove atom and all connected bonds
      const updatedAtoms = molecule.atoms.filter(atom => atom.id !== existingAtom.id);
      const updatedBonds = molecule.bonds.filter(
        bond => bond.atomId1 !== existingAtom.id && bond.atomId2 !== existingAtom.id
      );
      onMoleculeChange({ atoms: updatedAtoms, bonds: updatedBonds });
      setSelectedAtom(null);
    }
  }, [molecule, selectedTool, selectedElement, getCanvasPoint, onMoleculeChange, isDragging]);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const point = getCanvasPoint(event.clientX, event.clientY);
    const snappedPoint = snapToGrid(point);
    
    if (selectedTool === 'select') {
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

    // Update hovered atom for cursor changes (only when not dragging)
    if (!draggedAtom) {
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
  }, [selectedTool, draggedAtom, dragStart, isDragging, selectedAtom, getCanvasPoint, molecule, onMoleculeChange]);

  const handleMouseUp = useCallback((event: React.MouseEvent) => {
    console.log('MouseUp:', { draggedAtom, isDragging, selectedAtom });
    
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
            (bond.atomId1 === startAtom.id && bond.atomId2 === endAtom.id) ||
            (bond.atomId1 === endAtom.id && bond.atomId2 === startAtom.id)
        );

        if (existingBond) {
          // Update bond type
          const updatedBonds = molecule.bonds.map(bond =>
            bond.id === existingBond.id
              ? { ...bond, type: selectedBondType }
              : bond
          );
          onMoleculeChange({ ...molecule, bonds: updatedBonds });
        } else {
          // Create new bond
          const newBond: Bond = {
            id: uuidv4(),
            atomId1: startAtom.id,
            atomId2: endAtom.id,
            type: selectedBondType,
          };
          onMoleculeChange({
            ...molecule,
            bonds: [...molecule.bonds, newBond],
          });
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
          atomId1: startAtom.id,
          atomId2: newAtom.id,
          type: selectedBondType,
        };
        onMoleculeChange({
          atoms: [...molecule.atoms, newAtom],
          bonds: [...molecule.bonds, newBond],
        });
      }

      setDragStart(null);
      setPreviewBond(null);
    }
  }, [selectedTool, draggedAtom, isDragging, dragStart, molecule, selectedBondType, selectedElement, getCanvasPoint, onMoleculeChange]);

  const renderBond = (bond: Bond) => {
    const atom1 = molecule.atoms.find(a => a.id === bond.atomId1);
    const atom2 = molecule.atoms.find(a => a.id === bond.atomId2);
    
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
    }

    return null;
  };

  const renderAtom = (atom: Atom) => {
    const color = elementColors[atom.element];
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
                  selectedTool === 'eraser' ? 'pointer' : 'default'
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
        }}
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
              stroke="#f3f4f6"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

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
      </svg>
    </div>
  );
}
