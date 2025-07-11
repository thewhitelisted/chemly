import { useState, useEffect } from 'react';
import { Copy, Download, FileText, AlertTriangle, Lightbulb, Upload } from 'lucide-react';
import type { Molecule, ValidationWarning } from '../types/chemistry';
import { exportToSmiles } from '../utils/graphToSmiles';
import { importFromSmiles } from '../utils/smilesToGraph';
import { validateStructure } from '../utils/validateStructure';

interface SidebarProps {
  molecule: Molecule;
  onMoleculeChange: (molecule: Molecule) => void;
}

export function Sidebar({ molecule, onMoleculeChange }: SidebarProps) {
  const [smilesInput, setSmilesInput] = useState('');
  const [currentSmiles, setCurrentSmiles] = useState('');
  const [promptInput, setPromptInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [validation, setValidation] = useState<{ isValid: boolean; warnings: ValidationWarning[] }>({ 
    isValid: true, 
    warnings: [] 
  });

  // Update SMILES when molecule changes
  useEffect(() => {
    const updateSmiles = async () => {
      setIsExporting(true);
      try {
        const result = await exportToSmiles(molecule);
        if (result.success && result.smiles) {
          setCurrentSmiles(result.smiles);
        } else {
          setCurrentSmiles('');
        }
      } catch (error) {
        console.error('Failed to generate SMILES:', error);
        setCurrentSmiles('');
      } finally {
        setIsExporting(false);
      }
    };

    updateSmiles();
  }, [molecule]);

  // Update validation when molecule changes
  useEffect(() => {
    const newValidation = validateStructure(molecule);
    setValidation(newValidation);
  }, [molecule]);

  const handleCopySmiles = async () => {
    try {
      await navigator.clipboard.writeText(currentSmiles);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy SMILES:', err);
    }
  };

  const handleSmilesImport = async () => {
    if (!smilesInput.trim()) return;
    
    setIsImporting(true);
    try {
      const result = await importFromSmiles(smilesInput.trim());
      if (result.success && result.graph) {
        onMoleculeChange(result.graph);
        setSmilesInput(''); // Clear input after successful import
      } else {
        alert(`Failed to import SMILES: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to import SMILES:', error);
      alert('Failed to import SMILES structure');
    } finally {
      setIsImporting(false);
    }
  };

  const handlePromptSubmit = () => {
    if (!promptInput.trim()) return;
    
    // Placeholder for AI prompt handling
    console.log('AI Prompt:', promptInput);
    alert(`AI prompt received: "${promptInput}"\n\nThis feature will be implemented in the next phase.`);
    setPromptInput('');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'info': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 flex flex-col space-y-6 overflow-y-auto">
      {/* AI Prompt Box */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Lightbulb className="w-4 h-4" />
          AI Structure Generation
        </h3>
        <div className="space-y-2">
          <textarea
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder="Describe the molecule you want to draw..."
            className="w-full p-3 text-sm border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
          <button
            onClick={handlePromptSubmit}
            disabled={!promptInput.trim()}
            className="w-full px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Generate Structure
          </button>
        </div>
      </div>

      {/* SMILES Import */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Import SMILES
        </h3>
        <div className="space-y-2">
          <input
            type="text"
            value={smilesInput}
            onChange={(e) => setSmilesInput(e.target.value)}
            placeholder="Enter SMILES string..."
            className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && handleSmilesImport()}
          />
          <button
            onClick={handleSmilesImport}
            disabled={!smilesInput.trim() || isImporting}
            className="w-full px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isImporting ? 'Importing...' : 'Import Structure'}
          </button>
        </div>
      </div>

      {/* SMILES Export */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export SMILES
        </h3>
        <div className="space-y-2">
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
            <code className="text-sm text-gray-700 font-mono break-all">
              {isExporting ? 'Generating...' : currentSmiles || 'No structure'}
            </code>
          </div>
          <button
            onClick={handleCopySmiles}
            disabled={!currentSmiles || isExporting}
            className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Copied!' : 'Copy SMILES'}
          </button>
        </div>
      </div>

      {/* Structure Validation */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Structure Validation
        </h3>
        <div className="space-y-2">
          <div className={`p-2 rounded-md text-sm ${
            validation.isValid 
              ? 'text-green-700 bg-green-50 border border-green-200'
              : 'text-orange-700 bg-orange-50 border border-orange-200'
          }`}>
            {validation.isValid ? '✓ Structure is valid' : `⚠ ${validation.warnings.length} issue(s) found`}
          </div>
          
          {validation.warnings.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {validation.warnings.map((warning) => (
                <div
                  key={warning.id}
                  className={`p-2 border rounded-md text-xs ${getSeverityColor(warning.severity)}`}
                >
                  <div className="flex items-start gap-2">
                    {getSeverityIcon(warning.severity)}
                    <div>
                      <div className="font-medium capitalize">{warning.type}</div>
                      <div>{warning.message}</div>
                      {warning.atomIds.length > 0 && (
                        <div className="text-xs opacity-70 mt-1">
                          Atoms: {warning.atomIds.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Molecule Statistics */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Molecule Info
        </h3>
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Atoms:</span>
            <span className="font-medium">{molecule.atoms.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Bonds:</span>
            <span className="font-medium">{molecule.bonds.length}</span>
          </div>
          {molecule.atoms.length > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Elements:</span>
              <span className="font-medium">
                {Array.from(new Set(molecule.atoms.map(a => a.element))).join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}