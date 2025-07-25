import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import About from './components/About';
import Contact from './components/Contact';
import Products from './components/Products';
import Pricing from './components/Pricing';
import { ChemCanvas } from './components/ChemCanvas';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import type { ElementSymbol, Molecule, Point } from './types/chemistry';
import { graphToOclMolecule, oclMoleculeToGraph } from './utils/oclGraphAdapter';
import * as OCL from 'openchemlib';
import { HydrogenManager } from './utils/hydrogenManager';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import { useHistory } from './hooks/useHistory';

function App() {
  const { state: molecule, setState: setMolecule, undo, redo, canUndo, canRedo } = useHistory<Molecule>({ atoms: [], bonds: [] });
  const [selectedTool, setSelectedTool] = useState<'select' | 'atom' | 'eraser' | 'pan'>('select');
  const [selectedElement, setSelectedElement] = useState<ElementSymbol>('C');
  const [canvasOffset, setCanvasOffset] = useState<Point>({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

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

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [darkMode, undo, redo]);

  const handleCleanStructure = () => {
    // Convert to OCL, roundtrip through SMILES to normalize, then back to graph
    const oclMol = graphToOclMolecule(molecule);
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
    setMolecule(cleanedGraph);
  };

  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        {/* Only show Navbar on non-app routes */}
        <Routes>
          <Route path="/app" element={
            <ProtectedRoute>
              <div className="flex h-screen bg-white dark:bg-zinc-900 transition-colors">
                <Toolbar
                  selectedElement={selectedElement}
                  selectedTool={selectedTool}
                  onElementSelect={el => {
                    setSelectedElement(el);
                    setSelectedTool('atom');
                  }}
                  onToolSelect={setSelectedTool}
                  onCleanStructure={handleCleanStructure}
                  darkMode={darkMode}
                  onToggleDarkMode={() => setDarkMode(dm => !dm)}
                />
                <ChemCanvas
                  molecule={molecule}
                  selectedTool={selectedTool}
                  selectedElement={selectedElement}
                  canvasOffset={canvasOffset}
                  scale={scale}
                  onMoleculeChange={setMolecule}
                  onCanvasTransformChange={(offset, newScale) => {
                    setCanvasOffset(offset);
                    setScale(newScale);
                  }}
                  undo={undo}
                  redo={redo}
                  canUndo={canUndo}
                  canRedo={canRedo}
                />
                <Sidebar
                  molecule={molecule}
                  onMoleculeChange={setMolecule}
                />
              </div>
            </ProtectedRoute>
          } />
          {/* Navbar for all other routes */}
          <Route path="/*" element={<><Navbar /><Routes><Route path="/" element={<LandingPage />} /><Route path="/products" element={<Products />} /><Route path="/about" element={<About />} /><Route path="/contact" element={<Contact />} /><Route path="/pricing" element={<Pricing />} /></Routes></>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
