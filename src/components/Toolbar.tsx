import { MousePointer, Eraser, Lightbulb, Move } from 'lucide-react';
import type { ElementSymbol, BondType } from '../types/chemistry';

interface ToolbarProps {
  selectedElement: ElementSymbol;
  selectedBondType: BondType;
  selectedTool: 'atom' | 'bond' | 'select' | 'eraser' | 'pan';
  onElementSelect: (element: ElementSymbol) => void;
  onBondTypeSelect: (bondType: BondType) => void;
  onToolSelect: (tool: 'atom' | 'bond' | 'select' | 'eraser' | 'pan') => void;
}

const elements: { symbol: ElementSymbol; name: string; color: string }[] = [
  { symbol: 'C', name: 'Carbon', color: 'bg-gray-700' },
  { symbol: 'O', name: 'Oxygen', color: 'bg-red-500' },
  { symbol: 'N', name: 'Nitrogen', color: 'bg-blue-500' },
  { symbol: 'P', name: 'Phosphorus', color: 'bg-orange-500' },
  { symbol: 'S', name: 'Sulfur', color: 'bg-yellow-500' },
  { symbol: 'F', name: 'Fluorine', color: 'bg-green-400' },
  { symbol: 'Cl', name: 'Chlorine', color: 'bg-green-600' },
  { symbol: 'Br', name: 'Bromine', color: 'bg-red-800' },
  { symbol: 'I', name: 'Iodine', color: 'bg-purple-800' },
  { symbol: 'H', name: 'Hydrogen', color: 'bg-gray-300' },
];

const bondTypes: { type: BondType; name: string; display: string }[] = [
  { type: 'single', name: 'Single Bond', display: '—' },
  { type: 'double', name: 'Double Bond', display: '=' },
  { type: 'triple', name: 'Triple Bond', display: '≡' },
  { type: 'wedge', name: 'Wedge Bond', display: '⟋' },
  { type: 'dash', name: 'Dash Bond', display: '⋯' },
];

export function Toolbar({
  selectedElement,
  selectedBondType,
  selectedTool,
  onElementSelect,
  onBondTypeSelect,
  onToolSelect,
}: ToolbarProps) {
  return (
    <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 shadow-sm">
      {/* Tool Selection */}
      <div className="flex flex-col gap-2 mb-6">
        <button
          onClick={() => onToolSelect('select')}
          className={`p-3 rounded-lg transition-colors ${
            selectedTool === 'select'
              ? 'bg-blue-100 text-blue-600'
              : 'hover:bg-gray-100 text-gray-600'
          }`}
          title="Select Tool"
        >
          <MousePointer size={20} />
        </button>
        
        <button
          onClick={() => onToolSelect('pan')}
          className={`p-3 rounded-lg transition-colors ${
            selectedTool === 'pan'
              ? 'bg-green-100 text-green-600'
              : 'hover:bg-gray-100 text-gray-600'
          }`}
          title="Pan Tool"
        >
          <Move size={20} />
        </button>
        
        <button
          onClick={() => onToolSelect('eraser')}
          className={`p-3 rounded-lg transition-colors ${
            selectedTool === 'eraser'
              ? 'bg-red-100 text-red-600'
              : 'hover:bg-gray-100 text-gray-600'
          }`}
          title="Eraser"
        >
          <Eraser size={20} />
        </button>
      </div>

      {/* Element Picker */}
      <div className="flex flex-col gap-1 mb-6">
        <div className="text-xs text-gray-500 mb-2 text-center">Elements</div>
        {elements.slice(0, 6).map((element) => (
          <button
            key={element.symbol}
            onClick={() => onElementSelect(element.symbol)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold transition-all ${
              selectedElement === element.symbol && selectedTool === 'atom'
                ? 'ring-2 ring-blue-400 ring-offset-1'
                : ''
            } ${element.color} hover:scale-105`}
            title={element.name}
          >
            {element.symbol}
          </button>
        ))}
      </div>

      {/* Bond Types */}
      <div className="flex flex-col gap-1 mb-6">
        <div className="text-xs text-gray-500 mb-2 text-center">Bonds</div>
        {bondTypes.slice(0, 3).map((bond) => (
          <button
            key={bond.type}
            onClick={() => onBondTypeSelect(bond.type)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold transition-all ${
              selectedBondType === bond.type && selectedTool === 'bond'
                ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-400 ring-offset-1'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title={bond.name}
          >
            {bond.display}
          </button>
        ))}
      </div>

      {/* AI Assistant */}
      <div className="mt-auto">
        <button
          className="p-3 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 transition-all transform hover:scale-105"
          title="AI Assistant (Coming Soon)"
        >
          <Lightbulb size={20} />
        </button>
      </div>
    </div>
  );
}
