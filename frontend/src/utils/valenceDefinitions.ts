import type { ElementSymbol } from '../types/chemistry';

// Standard valences for common elements (in order of preference/stability)
export const ELEMENT_VALENCES: Record<ElementSymbol, number[]> = {
  'H': [1],
  'C': [4],
  'N': [3, 5], // 3 is more common in organic chemistry
  'O': [2],
  'P': [3, 5], // 3 is common in organophosphorus, 5 in phosphates
  'S': [2, 4, 6], // 2 is most common in organic chemistry
  'F': [1],
  'Cl': [1, 3, 5, 7], // 1 is most common
  'Br': [1, 3, 5, 7], // 1 is most common  
  'I': [1, 3, 5, 7]   // 1 is most common
};

// Bond order values for different bond types
export const BOND_ORDER: Record<string, number> = {
  single: 1,
  double: 2,
  triple: 3,
  wedge: 1,
  dash: 1,
};

/**
 * Get the most common (preferred) valence for an element
 */
export function getPreferredValence(element: ElementSymbol): number {
  const valences = ELEMENT_VALENCES[element];
  return valences ? valences[0] : 0;
}

/**
 * Get all possible valences for an element
 */
export function getPossibleValences(element: ElementSymbol): number[] {
  return ELEMENT_VALENCES[element] || [];
}

/**
 * Check if a valence is valid for an element
 */
export function isValidValence(element: ElementSymbol, valence: number): boolean {
  const valences = ELEMENT_VALENCES[element];
  return valences ? valences.includes(valence) : false;
}

/**
 * Find the best valence for an element given current bond count
 * Returns the smallest valid valence that can accommodate the current bonds
 */
export function getBestValenceForBondCount(element: ElementSymbol, currentBonds: number): number | null {
  const valences = ELEMENT_VALENCES[element];
  if (!valences) return null;
  
  // Find the smallest valence that can accommodate current bonds
  for (const valence of valences) {
    if (valence >= currentBonds) {
      return valence;
    }
  }
  
  // If no valence can accommodate current bonds, return the largest possible
  return valences[valences.length - 1];
}

/**
 * Check if an atom can accept additional bonds
 */
export function canAcceptMoreBonds(element: ElementSymbol, currentBonds: number, additionalBonds: number = 1): boolean {
  const valences = ELEMENT_VALENCES[element];
  if (!valences) return false;
  
  const targetBonds = currentBonds + additionalBonds;
  
  // Check if any valence state can accommodate the target bond count
  return valences.some(valence => valence >= targetBonds);
}

/**
 * Get the maximum possible valence for an element
 */
export function getMaxValence(element: ElementSymbol): number {
  const valences = ELEMENT_VALENCES[element];
  return valences ? Math.max(...valences) : 0;
}

// Ensure all elements in the toolbar are supported
const TOOLBAR_ELEMENTS: ElementSymbol[] = ['C','O','N','P','S','F','Cl','Br','I','H'];
for (const el of TOOLBAR_ELEMENTS) {
  if (!(el in ELEMENT_VALENCES)) {
    throw new Error(`Element ${el} is used in the UI but not supported in valence logic. Please add it to ELEMENT_VALENCES.`);
  }
} 