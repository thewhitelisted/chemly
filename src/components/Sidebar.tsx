import { useState } from 'react';
import { Copy, Download, FileText } from 'lucide-react';
import type { Molecule } from '../types/chemistry';

interface SidebarProps {
  molecule: Molecule;
  onMoleculeChange: (molecule: Molecule) => void;
}

// Simple SMILES generation (very basic implementation)
const generateSMILES = (molecule: Molecule): string => {
  if (molecule.atoms.length === 0) return '';
  
  // Very simplified SMILES generation for demo purposes
  const atomSymbols = molecule.atoms.map(atom => atom.element).join('');
  return atomSymbols || 'C'; // Default to carbon if empty
};

export function Sidebar({ molecule, onMoleculeChange }: SidebarProps) {
  const [smilesInput, setSmilesInput] = useState('');
  const [copied, setCopied] = useState(false);

  const currentSmiles = generateSMILES(molecule);

  const handleCopySmiles = async () => {
    try {
      await navigator.clipboard.writeText(currentSmiles);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy SMILES:', err);
    }
  };

  const handleSmilesInput = () => {
    // Very basic SMILES parsing for demo - just create atoms for each character
    if (smilesInput.trim()) {
      const atoms = smilesInput
        .split('')
        .filter(char => /[A-Z]/.test(char))
        .map((char, index) => ({
          id: `atom-${index}`,
          element: char as any, // Simplified for demo
          position: { x: 100 + index * 60, y: 200 },
        }));

      onMoleculeChange({
        atoms,
        bonds: [], // Simplified - no bond parsing for now
      });
      setSmilesInput('');
    }
  };

  const atomCount = molecule.atoms.length;
  const bondCount = molecule.bonds.length;

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Structure Info</h2>
      </div>

      {/* Molecule Statistics */}
      <div className="p-4 border-b border-gray-200">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Atoms:</span>
            <span className="font-medium">{atomCount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Bonds:</span>
            <span className="font-medium">{bondCount}</span>
          </div>
        </div>
      </div>

      {/* SMILES Export */}
      <div className="p-4 border-b border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Current SMILES
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={currentSmiles}
            readOnly
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
            placeholder="No structure drawn"
          />
          <button
            onClick={handleCopySmiles}
            disabled={!currentSmiles}
            className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            title="Copy SMILES"
          >
            {copied ? '✓' : <Copy size={16} />}
          </button>
        </div>
      </div>

      {/* SMILES Import */}
      <div className="p-4 border-b border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Import from SMILES
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={smilesInput}
            onChange={(e) => setSmilesInput(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter SMILES string..."
            onKeyPress={(e) => e.key === 'Enter' && handleSmilesInput()}
          />
          <button
            onClick={handleSmilesInput}
            disabled={!smilesInput.trim()}
            className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            title="Import Structure"
          >
            <FileText size={16} />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Basic SMILES parsing (demo)
        </p>
      </div>

      {/* Structure Validation */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Validation</h3>
        <div className="space-y-1">
          {atomCount === 0 && (
            <div className="text-xs text-gray-500">No structure to validate</div>
          )}
          {atomCount > 0 && (
            <div className="text-xs text-green-600">✓ Structure contains atoms</div>
          )}
          {bondCount > 0 && (
            <div className="text-xs text-green-600">✓ Bonds present</div>
          )}
          {atomCount > 0 && bondCount === 0 && (
            <div className="text-xs text-yellow-600">⚠ Isolated atoms detected</div>
          )}
        </div>
      </div>

      {/* AI Assistant Placeholder */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">AI Assistant</h3>
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-3">
          <div className="text-xs text-purple-700 mb-2">✨ Coming Soon</div>
          <div className="text-xs text-gray-600">
            • Text to structure generation
            <br />
            • Auto-complete suggestions
            <br />
            • Reaction prediction
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="p-4 mt-auto">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Export</h3>
        <div className="space-y-2">
          <button
            disabled
            className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-400 rounded-md cursor-not-allowed"
            title="Coming Soon"
          >
            <Download size={16} className="inline mr-2" />
            Export as PNG
          </button>
          <button
            disabled
            className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-400 rounded-md cursor-not-allowed"
            title="Coming Soon"
          >
            <Download size={16} className="inline mr-2" />
            Export as SVG
          </button>
        </div>
      </div>
    </div>
  );
}
