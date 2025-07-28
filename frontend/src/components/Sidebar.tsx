import { useState, useEffect } from 'react';
import { Copy, Download, FileText, AlertTriangle, Lightbulb, Upload, LogOut, User, RefreshCw, Crown } from 'lucide-react';
import type { Molecule, ValidationWarning } from '../types/chemistry';
import { importFromSmiles } from '../utils/smilesToGraph';
import { validateStructure } from '../utils/validateStructure';
import { namingCache } from '../utils/namingCache';
import { useSmilesOptimization } from '../utils/useSmilesOptimization';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../config/api';
import { AdminPanel } from './AdminPanel';


interface SidebarProps {
  molecule: Molecule;
  onMoleculeChange: (molecule: Molecule) => void;
}

export function Sidebar({ molecule, onMoleculeChange }: SidebarProps) {
  const { user, logout } = useAuth();
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
  const [isNamingLoading, setIsNamingLoading] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  // Set auth token for API client
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      apiClient.setAuthToken(token);
    }
  }, []);

  // Use optimized SMILES generation
  const { smiles: currentSmiles, isLoading: isExporting } = useSmilesOptimization(molecule);

  // Update validation when molecule changes
  useEffect(() => {
    const newValidation = validateStructure(molecule);
    setValidation(newValidation);
  }, [molecule]);

  // Clear molecule name when SMILES changes (but don't auto-generate)
  useEffect(() => {
    if (!currentSmiles) {
      setMoleculeName('');
      return;
    }

    // Check cache first for immediate feedback
    const cached = namingCache.getCached(currentSmiles);
    if (cached !== null) {
      setMoleculeName(cached);
    } else {
      // Clear name if not cached
      setMoleculeName('');
    }
  }, [currentSmiles]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      namingCache.cancelAllRequests();
    };
  }, []);

  const handleUpdateName = async () => {
    if (!currentSmiles || isNamingLoading) return;
    
    setIsNamingLoading(true);
    try {
      const result = await namingCache.requestName(currentSmiles);
      setMoleculeName(result);
    } catch (error) {
      if (error instanceof Error && error.message === 'Request cancelled') {
        // Request was cancelled, don't update state
        return;
      }
      console.error('Naming request failed:', error);
      setMoleculeName('No name found');
    } finally {
      setIsNamingLoading(false);
    }
  };

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

      {/* Molecule Name (Manual Update) */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <span className="dark:text-gray-100">Molecule Name{Array.isArray(moleculeName) && moleculeName.length > 1 ? 's' : ''}</span>
        </h3>
        <div className="p-3 border rounded-md transition-colors bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
          {isNamingLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-100">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Loading name...</span>
            </div>
          ) : Array.isArray(moleculeName) ? (
            <ul className="list-disc pl-5">
              {moleculeName.map((name, idx) => (
                <li key={idx} className="text-sm text-gray-700 dark:text-gray-100 font-mono break-all bg-transparent">{name}</li>
              ))}
            </ul>
          ) : (
            <span className="text-sm text-gray-700 dark:text-gray-100 font-mono break-all bg-transparent">
              {moleculeName || 'No name found'}
            </span>
          )}
        </div>
        <button
          onClick={handleUpdateName}
          disabled={!currentSmiles || isNamingLoading}
          className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-800 disabled:dark:bg-zinc-700 disabled:dark:text-gray-400 flex items-center justify-center gap-2"
        >
          {isNamingLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Update Name
            </>
          )}
        </button>
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

      {/* User Info and Logout */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <User className="w-4 h-4" />
          <span className="dark:text-gray-100">Account</span>
        </h3>
        <div className="p-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md">
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-100">
            <div className="flex justify-between items-center">
              <span>Email:</span>
              <span className="font-medium truncate ml-2">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Plan:</span>
              <span className="font-medium capitalize">{user?.subscription_plan}</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span>Basic Credits:</span>
                <span className="font-mono">{user?.basic_credits_used || 0} / {user?.basic_credits_limit || 200}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Premium Credits:</span>
                <span className="font-mono">{user?.premium_credits_used || 0} / {user?.premium_credits_limit || 35}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-zinc-600 space-y-2">
              {/* Admin Panel Button - Only show for specific admin emails */}
              {(user?.email === 'jleechris06@gmail.com') && (
                <button
                  onClick={() => setIsAdminPanelOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-[#007d40] hover:text-[#006030] hover:bg-[#007d40]/10 dark:text-[#007d40] dark:hover:text-[#006030] dark:hover:bg-[#007d40]/20 rounded-md transition-colors duration-200"
                >
                  <Crown className="w-4 h-4" />
                  Admin Panel
                </button>
              )}
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 rounded-md transition-colors duration-200"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
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

      {/* Admin Panel */}
      <AdminPanel 
        isOpen={isAdminPanelOpen} 
        onClose={() => setIsAdminPanelOpen(false)} 
      />
    </div>
  );
}