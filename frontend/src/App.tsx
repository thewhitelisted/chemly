import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import About from './components/About';
import Contact from './components/Contact';
import { ChemCanvas } from './components/ChemCanvas';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import type { DrawingState, ElementSymbol, Molecule, Point } from './types/chemistry';
import { graphToOclMolecule, oclMoleculeToGraph } from './utils/oclGraphAdapter';
import * as OCL from 'openchemlib';
import { HydrogenManager } from './utils/hydrogenManager';
import Navbar from './components/Navbar';

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

  // Dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';
    // Default to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

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
    <Router>
      {/* Only show Navbar on non-app routes */}
      <Routes>
        <Route path="/app" element={
          <div className="flex h-screen bg-white dark:bg-zinc-900 transition-colors">
            <Toolbar
              selectedElement={drawingState.selectedElement}
              selectedTool={drawingState.selectedTool}
              onElementSelect={el => updateDrawingState({ selectedElement: el, selectedTool: 'atom' })}
              onToolSelect={tool => updateDrawingState({ selectedTool: tool })}
              onCleanStructure={handleCleanStructure}
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode(dm => !dm)}
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
        } />
        {/* Navbar for all other routes */}
        <Route path="/*" element={<><Navbar /><Routes><Route path="/" element={<LandingPage />} /><Route path="/about" element={<About />} /><Route path="/contact" element={<Contact />} /></Routes></>} />
      </Routes>
    </Router>
  );
}

export default App;
