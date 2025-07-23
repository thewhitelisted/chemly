import { useState, useEffect, useMemo, useRef } from 'react';
import type { Molecule } from '../types/chemistry';
import { exportToSmiles } from './graphToSmiles';

interface SmilesResult {
  smiles: string;
  isLoading: boolean;
  error: string | null;
}

// Create a stable hash of molecule structure to detect real changes
function createMoleculeHash(molecule: Molecule): string {
  // Sort atoms and bonds for consistent hashing
  const sortedAtoms = molecule.atoms
    .map(atom => `${atom.element}:${atom.position.x.toFixed(2)},${atom.position.y.toFixed(2)}`)
    .sort()
    .join('|');
  
  const sortedBonds = molecule.bonds
    .map(bond => {
      const [source, target] = [bond.sourceAtomId, bond.targetAtomId].sort();
      return `${source}-${target}:${bond.type}`;
    })
    .sort()
    .join('|');
  
  return `atoms:${sortedAtoms}||bonds:${sortedBonds}`;
}

export function useSmilesOptimization(molecule: Molecule): SmilesResult {
  const [smiles, setSmiles] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cache previous results
  const cacheRef = useRef<Map<string, string>>(new Map());
  const lastHashRef = useRef<string>('');
  
  // Memoize the molecule hash to avoid recalculating on every render
  const moleculeHash = useMemo(() => createMoleculeHash(molecule), [
    molecule.atoms.length,
    molecule.bonds.length,
    // Only recalculate if structural changes occur
    JSON.stringify(molecule.atoms.map(a => ({ element: a.element, id: a.id }))),
    JSON.stringify(molecule.bonds.map(b => ({ sourceAtomId: b.sourceAtomId, targetAtomId: b.targetAtomId, type: b.type })))
  ]);
  
  useEffect(() => {
    // Skip if structure hasn't actually changed
    if (moleculeHash === lastHashRef.current) {
      return;
    }
    
    lastHashRef.current = moleculeHash;
    
    // Check cache first
    const cached = cacheRef.current.get(moleculeHash);
    if (cached !== undefined) {
      setSmiles(cached);
      setError(null);
      setIsLoading(false);
      return;
    }
    
    // No cache hit, need to compute
    let isCancelled = false;
    setIsLoading(true);
    setError(null);
    
    const computeSmiles = async () => {
      try {
        const result = await exportToSmiles(molecule);
        
        if (isCancelled) return;
        
        if (result.success && result.smiles) {
          const newSmiles = result.smiles;
          
          // Cache the result
          cacheRef.current.set(moleculeHash, newSmiles);
          
          // Limit cache size
          if (cacheRef.current.size > 100) {
            const firstKey = Array.from(cacheRef.current.keys())[0];
            if (firstKey) {
              cacheRef.current.delete(firstKey);
            }
          }
          
          setSmiles(newSmiles);
          setError(null);
        } else {
          setSmiles('');
          setError(result.error || 'Failed to generate SMILES');
        }
      } catch (err) {
        if (isCancelled) return;
        
        setSmiles('');
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };
    
    computeSmiles();
    
    // Cleanup function to cancel the operation
    return () => {
      isCancelled = true;
    };
  }, [moleculeHash, molecule]);
  
  return {
    smiles,
    isLoading,
    error
  };
}

// Hook for getting cache statistics (useful for debugging)
export function useSmilesCache() {
  const cacheRef = useRef<Map<string, string>>(new Map());
  
  return {
    getCacheSize: () => cacheRef.current.size,
    clearCache: () => cacheRef.current.clear(),
    getCacheStats: () => ({
      size: cacheRef.current.size,
      maxSize: 100
    })
  };
} 