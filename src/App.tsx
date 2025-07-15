import { useState } from 'react';
import { ChemCanvas } from './components/ChemCanvas';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import type { DrawingState, ElementSymbol, Molecule, Point } from './types/chemistry';
import { graphToOclMolecule, oclMoleculeToGraph } from './utils/oclGraphAdapter';
import * as OCL from 'openchemlib';
import { HydrogenManager } from './utils/hydrogenManager';

function App() {
  const [drawingState, setDrawingState] = useState<DrawingState>({
    molecule: {
      atoms: [],
      bonds: []
    },
    selectedTool: 'select',
    selectedElement: 'C',
    canvasOffset: { x: 0, y: 0 },
    scale: 1
  });

  const updateDrawingState = (updates: Partial<DrawingState>) => {
    setDrawingState(prev => ({ ...prev, ...updates }));
  };

  const handleCleanStructure = () => {
    // Convert to OCL, roundtrip through SMILES to normalize, then back to graph
    const oclMol = graphToOclMolecule(drawingState.molecule);
    const smiles = oclMol.toSmiles();
    const cleanedMol = OCL.Molecule.fromSmiles(smiles);
    let cleanedGraph = oclMoleculeToGraph(cleanedMol);
    // Remove and re-add hydrogens for correct layout
    cleanedGraph = HydrogenManager.fillAllValences(cleanedGraph);
    // Clear implicitHydrogens for all non-hydrogen atoms
    cleanedGraph = {
      ...cleanedGraph,
      atoms: cleanedGraph.atoms.map(atom =>
        atom.element === 'H' ? atom : { ...atom, implicitHydrogens: 0 }
      ),
    };
    updateDrawingState({ molecule: cleanedGraph });
  };

  return (
    <div className="flex h-screen">
      <Toolbar
        selectedElement={drawingState.selectedElement}
        selectedTool={drawingState.selectedTool}
        onElementSelect={el => updateDrawingState({ selectedElement: el, selectedTool: 'atom' })}
        onToolSelect={tool => updateDrawingState({ selectedTool: tool })}
        onCleanStructure={handleCleanStructure}
      />
      <ChemCanvas
        molecule={drawingState.molecule}
        selectedTool={drawingState.selectedTool}
        selectedElement={drawingState.selectedElement}
        canvasOffset={drawingState.canvasOffset}
        scale={drawingState.scale}
        onMoleculeChange={(molecule: Molecule) => updateDrawingState({ molecule })}
        onCanvasTransformChange={(canvasOffset: Point, scale: number) => updateDrawingState({ canvasOffset, scale })}
      />
      <Sidebar
        molecule={drawingState.molecule}
        onMoleculeChange={(molecule: Molecule) => updateDrawingState({ molecule })}
      />
    </div>
  );
}

export default App;
