import { useState, useEffect } from 'react';
import { Copy, Download, FileText, AlertTriangle, Lightbulb, Upload } from 'lucide-react';
import type { Molecule, ValidationWarning } from '../types/chemistry';
import { exportToSmiles } from '../utils/graphToSmiles';
import { importFromSmiles } from '../utils/smilesToGraph';
import { validateStructure } from '../utils/validateStructure';
import * as OCL from 'openchemlib';

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
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [moleculeName, setMoleculeName] = useState<string | string[]>('');
  const [isNaming, setIsNaming] = useState(false);

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

  // Update molecule name(s) when molecule or currentSmiles changes
  useEffect(() => {
    const fetchNames = async () => {
      setIsNaming(true);
      try {
        if (!currentSmiles) {
          setMoleculeName('');
          setIsNaming(false);
          return;
        }
        const fragments = currentSmiles.split('.').map(f => f.trim()).filter(Boolean);
        if (fragments.length === 1) {
          // Single structure
          const response = await fetch(`https://cactus.nci.nih.gov/chemical/structure/${encodeURIComponent(fragments[0])}/iupac_name`);
          if (!response.ok) throw new Error('CACTUS request failed');
          const name = await response.text();
          setMoleculeName(name.trim() || 'No name found');
        } else {
          // Multiple structures
          const names: string[] = [];
          for (const frag of fragments) {
            try {
              const response = await fetch(`https://cactus.nci.nih.gov/chemical/structure/${encodeURIComponent(frag)}/iupac_name`);
              if (!response.ok) throw new Error('CACTUS request failed');
              const name = await response.text();
              names.push(name.trim() || 'No name found');
            } catch {
              names.push('No name found');
            }
          }
          setMoleculeName(names);
        }
      } catch (e) {
        setMoleculeName('No name found');
      } finally {
        setIsNaming(false);
      }
    };
    if (currentSmiles) {
      fetchNames();
    } else {
      setMoleculeName('');
    }
  }, [currentSmiles]);

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
        setNotification({ type: 'success', message: 'SMILES imported successfully!' });
      } else {
        setNotification({ type: 'error', message: `Failed to import SMILES: ${result.error}` });
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to import SMILES structure' });
    } finally {
      setIsImporting(false);
    }
  };

  const handlePromptSubmit = () => {
    if (!promptInput.trim()) return;
    
    // Placeholder for AI prompt handling
    console.log('AI Prompt:', promptInput);
    setNotification({ type: 'success', message: `AI prompt received: "${promptInput}" (feature coming soon)` });
    setPromptInput('');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'text-red-600 bg-red-50 border border-red-200 dark:text-red-200 dark:bg-red-900 dark:border-red-800';
      case 'warning': return 'text-orange-700 bg-orange-50 border border-orange-200 dark:text-orange-200 dark:bg-orange-900 dark:border-orange-800';
      case 'info': return 'text-blue-600 bg-blue-50 border border-blue-200 dark:text-blue-200 dark:bg-blue-900 dark:border-blue-800';
      default: return 'text-gray-600 bg-gray-50 border border-gray-200 dark:text-gray-200 dark:bg-zinc-800 dark:border-zinc-700';
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

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <div className="w-80 bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-800 p-4 flex flex-col space-y-6 overflow-y-auto transition-colors">
      {/* AI Prompt Box */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Lightbulb className="w-4 h-4" />
          <span className="dark:text-gray-100">AI Structure Generation</span>
        </h3>
        <div className="space-y-2">
          <textarea
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder="Describe the molecule you want to draw..."
            className="w-full p-3 text-sm border border-gray-300 dark:border-zinc-700 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
            rows={3}
          />
          <button
            onClick={handlePromptSubmit}
            disabled={!promptInput.trim()}
            className="w-full px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed dark:bg-purple-700 dark:hover:bg-purple-800 disabled:dark:bg-zinc-700 disabled:dark:text-gray-400"
          >
            Generate Structure
          </button>
        </div>
      </div>

      {/* SMILES Import */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Upload className="w-4 h-4" />
          <span className="dark:text-gray-100">Import SMILES</span>
        </h3>
        <div className="space-y-2">
          <input
            type="text"
            value={smilesInput}
            onChange={(e) => setSmilesInput(e.target.value)}
            placeholder="Enter SMILES string..."
            className="w-full p-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
            onKeyPress={(e) => e.key === 'Enter' && handleSmilesImport()}
          />
          <button
            onClick={handleSmilesImport}
            disabled={!smilesInput.trim() || isImporting}
            className="w-full px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed dark:bg-green-700 dark:hover:bg-green-800 disabled:dark:bg-zinc-700 disabled:dark:text-gray-400"
          >
            {isImporting ? 'Importing...' : 'Import Structure'}
          </button>
        </div>
      </div>

      {/* SMILES Export */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Download className="w-4 h-4" />
          <span className="dark:text-gray-100">Export SMILES</span>
        </h3>
        <div className="space-y-2">
          <div className="p-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md">
            <code className="text-sm text-gray-700 dark:text-gray-100 font-mono break-all bg-transparent">
              {isExporting ? 'Generating...' : currentSmiles || 'No structure'}
            </code>
          </div>
          <button
            onClick={handleCopySmiles}
            disabled={!currentSmiles || isExporting}
            className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Copied!' : 'Copy SMILES'}
          </button>
        </div>
      </div>

      {/* Molecule Name (CACTUS) */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <span className="dark:text-gray-100">Molecule Name{Array.isArray(moleculeName) && moleculeName.length > 1 ? 's' : ''}</span>
        </h3>
        <div className="p-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md">
          {isNaming ? (
            <span className="text-sm text-gray-700 dark:text-gray-100 font-mono break-all bg-transparent">Generating...</span>
          ) : Array.isArray(moleculeName) ? (
            <ul className="list-disc pl-5">
              {moleculeName.map((name, idx) => (
                <li key={idx} className="text-sm text-gray-700 dark:text-gray-100 font-mono break-all bg-transparent">{name}</li>
              ))}
            </ul>
          ) : (
            <span className="text-sm text-gray-700 dark:text-gray-100 font-mono break-all bg-transparent">{moleculeName || 'No name found'}</span>
          )}
        </div>
      </div>

      {/* Structure Validation */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="dark:text-gray-100">Structure Validation</span>
        </h3>
        <div className="space-y-2">
          <div className={`p-2 rounded-md text-sm ${
            validation.isValid 
              ? 'text-green-700 bg-green-50 border border-green-200 dark:text-green-200 dark:bg-green-900 dark:border-green-800'
              : 'text-orange-700 bg-orange-50 border border-orange-200 dark:text-orange-200 dark:bg-orange-900 dark:border-orange-800'
          }`}>
            {validation.isValid ? '\u2713 Structure is valid' : `\u26a0 ${validation.warnings.length} issue(s) found`}
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
          <span className="dark:text-gray-100">Molecule Info</span>
        </h3>
        <div className="p-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Atoms:</span>
            <span className="font-medium dark:text-gray-100">{molecule.atoms.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Bonds:</span>
            <span className="font-medium dark:text-gray-100">{molecule.bonds.length}</span>
          </div>
          {molecule.atoms.length > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Elements:</span>
              <span className="font-medium">
                {Array.from(new Set(molecule.atoms.map(a => a.element))).join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>
      {notification && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded shadow-lg text-white ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
          style={{ minWidth: 200, textAlign: 'center' }}>
          {notification.message}
        </div>
      )}
    </div>
  );
}