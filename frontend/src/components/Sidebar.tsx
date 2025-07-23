import { useState, useEffect, useRef } from 'react';
import { Copy, Download, FileText, AlertTriangle, Lightbulb, Upload } from 'lucide-react';
import type { Molecule, ValidationWarning } from '../types/chemistry';
import { importFromSmiles } from '../utils/smilesToGraph';
import { validateStructure } from '../utils/validateStructure';
import { namingCache } from '../utils/namingCache';
import { createNamingDebouncer } from '../utils/smartDebouncer';
import { useSmilesOptimization } from '../utils/useSmilesOptimization';
import * as OCL from 'openchemlib';

interface SidebarProps {
  molecule: Molecule;
  onMoleculeChange: (molecule: Molecule) => void;
}

export function Sidebar({ molecule, onMoleculeChange }: SidebarProps) {
  const [smilesInput, setSmilesInput] = useState('');
  const [promptInput, setPromptInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [validation, setValidation] = useState<{ isValid: boolean; warnings: ValidationWarning[] }>({ 
    isValid: true, 
    warnings: [] 
  });
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [moleculeName, setMoleculeName] = useState<string | string[]>('');
  const [isNaming, setIsNaming] = useState(false);
  const [namingProgress, setNamingProgress] = useState<'idle' | 'requesting' | 'cached'>('idle');

  // Use optimized SMILES generation
  const { smiles: currentSmiles, isLoading: isExporting, error: smilesError } = useSmilesOptimization(molecule);

  // Create debouncer for naming requests (simplified for pre-cached models)
  const debouncerRef = useRef(createNamingDebouncer(
    async (smiles: string) => {
      if (!smiles) {
        setMoleculeName('');
        setIsNaming(false);
        setNamingProgress('idle');
        return;
      }

      try {
        setIsNaming(true);
        setNamingProgress('requesting');
        
        // Use the caching system
        const result = await namingCache.requestName(smiles);
        setMoleculeName(result);
        setNamingProgress('cached');
      } catch (error) {
        if (error instanceof Error && error.message === 'Request cancelled') {
          // Request was cancelled, don't update state
          return;
        }
        console.error('Naming request failed:', error);
        setMoleculeName('No name found');
        setNamingProgress('idle');
      } finally {
        setIsNaming(false);
      }
    }
  ));

  // Update validation when molecule changes
  useEffect(() => {
    const newValidation = validateStructure(molecule);
    setValidation(newValidation);
  }, [molecule]);

  // Smart debounced naming when SMILES changes
  useEffect(() => {
    const debouncer = debouncerRef.current;
    
    if (!currentSmiles) {
      setMoleculeName('');
      setIsNaming(false);
      setNamingProgress('idle');
      debouncer.cancel(); // Cancel any pending requests
      return;
    }

    // Check cache first for immediate feedback
    const cached = namingCache.getCached(currentSmiles);
    if (cached !== null) {
      setMoleculeName(cached);
      setIsNaming(false);
      setNamingProgress('cached');
      debouncer.cancel(); // No need to make a request
      return;
    }

    // Start the smart debounced request
    setNamingProgress('requesting');
    debouncer.execute(currentSmiles);

    // Cleanup function
    return () => {
      debouncer.cancel();
    };
  }, [currentSmiles]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncerRef.current.cancel();
      namingCache.cancelAllRequests();
    };
  }, []);

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

  // Get loading indicator based on progress
  const getNameLoadingText = () => {
    if (namingProgress === 'cached') return moleculeName;
    if (isNaming && namingProgress === 'requesting') return 'Generating name...';
    return moleculeName || 'No name found';
  };

  const getNameStatusIndicator = () => {
    if (namingProgress === 'cached') return '⚡'; // Fast cache hit
    if (isNaming) return '🔄'; // Loading
    return '';
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

      {/* Molecule Name (Optimized) */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <span className="dark:text-gray-100">Molecule Name{Array.isArray(moleculeName) && moleculeName.length > 1 ? 's' : ''}</span>
          <span className="text-xs">{getNameStatusIndicator()}</span>
        </h3>
        <div className={`p-3 border rounded-md transition-colors ${
          namingProgress === 'cached' ? 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800' :
          isNaming ? 'bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-800' :
          'bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700'
        }`}>
          {Array.isArray(moleculeName) ? (
            <ul className="list-disc pl-5">
              {moleculeName.map((name, idx) => (
                <li key={idx} className="text-sm text-gray-700 dark:text-gray-100 font-mono break-all bg-transparent">{name}</li>
              ))}
            </ul>
          ) : (
            <span className="text-sm text-gray-700 dark:text-gray-100 font-mono break-all bg-transparent">
              {getNameLoadingText()}
            </span>
          )}
        </div>
        {namingProgress === 'cached' && (
          <p className="text-xs text-green-600 dark:text-green-400">⚡ Instant result from cache</p>
        )}
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
          <span className="dark:text-gray-100">Molecule Statistics</span>
        </h3>
        <div className="p-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md">
          <div className="space-y-1 text-sm text-gray-700 dark:text-gray-100">
            <div className="flex justify-between">
              <span>Atoms:</span>
              <span className="font-mono">{molecule.atoms.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Bonds:</span>
              <span className="font-mono">{molecule.bonds.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Non-H atoms:</span>
              <span className="font-mono">{molecule.atoms.filter(a => a.element !== 'H').length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Notifications */}
      {notification && (
        <div className={`p-3 rounded-md border text-sm ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900 dark:border-green-800 dark:text-green-200' 
            : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900 dark:border-red-800 dark:text-red-200'
        }`}>
          {notification.message}
        </div>
      )}
    </div>
  );
}