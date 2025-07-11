import { useState } from 'react';
import { ChemCanvas } from './components/ChemCanvas';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import type { DrawingState, ElementSymbol, Molecule, Point } from './types/chemistry';

function App() {
  const [drawingState, setDrawingState] = useState<DrawingState>({
    molecule: {
      atoms: [],
      bonds: []
    },
    selectedTool: 'atom',
    selectedElement: 'C',
    canvasOffset: { x: 0, y: 0 },
    scale: 1
  });

  const updateDrawingState = (updates: Partial<DrawingState>) => {
    setDrawingState(prev => ({ ...prev, ...updates }));
  };

  const setSelectedElement = (element: ElementSymbol) => {
    setDrawingState(prev => ({ ...prev, selectedElement: element, selectedTool: 'atom' }));
  };

  const setSelectedTool = (tool: 'atom' | 'select' | 'eraser' | 'pan') => {
    setDrawingState(prev => ({ ...prev, selectedTool: tool }));
  };

  return (
    <div 
      className="h-screen w-screen overflow-hidden bg-gray-50 flex"
      style={{ 
        height: '100vh', 
        width: '100vw', 
        display: 'flex', 
        overflow: 'hidden',
        backgroundColor: '#f9fafb'
      }}
    >
      {/* Left Toolbar */}
      <Toolbar
        selectedElement={drawingState.selectedElement}
        selectedTool={drawingState.selectedTool}
        onElementSelect={setSelectedElement}
        onToolSelect={setSelectedTool}
      />
      
      {/* Main Canvas Area */}
      <div 
        className="flex-1 flex flex-col"
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <ChemCanvas
          molecule={drawingState.molecule}
          selectedTool={drawingState.selectedTool}
          selectedElement={drawingState.selectedElement}
          canvasOffset={drawingState.canvasOffset}
          scale={drawingState.scale}
          onMoleculeChange={(molecule: Molecule) => updateDrawingState({ molecule })}
          onCanvasTransformChange={(canvasOffset: Point, scale: number) => updateDrawingState({ canvasOffset, scale })}
        />
      </div>

      {/* Right Sidebar */}
      <Sidebar
        molecule={drawingState.molecule}
        onMoleculeChange={(molecule: Molecule) => updateDrawingState({ molecule })}
      />
    </div>
  );
}

export default App;
