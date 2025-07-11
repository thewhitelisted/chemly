import { MousePointer, Eraser, Move } from 'lucide-react';
import type { ElementSymbol } from '../types/chemistry';

interface ToolbarProps {
  selectedElement: ElementSymbol;
  selectedTool: 'atom' | 'select' | 'eraser' | 'pan';
  onElementSelect: (element: ElementSymbol) => void;
  onToolSelect: (tool: 'atom' | 'select' | 'eraser' | 'pan') => void;
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
];

export function Toolbar({
  selectedElement,
  selectedTool,
  onElementSelect,
  onToolSelect,
}: ToolbarProps) {
  return (
    <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 shadow-sm">
      {/* Tool Selection */}
      <div className="flex flex-col gap-1 mb-6 items-center self-center w-full">
        <div className="text-base text-gray-900 mb-2 font-semibold text-center">Tools</div>
        <div className="flex flex-col gap-2 w-full items-center">
        <button
          onClick={() => onToolSelect('select')}
          className={`p-3 rounded-lg transition-colors ${
            selectedTool === 'select'
              ? 'bg-blue-100 text-blue-600'
              : 'hover:bg-gray-100 text-gray-600'
          }`}
          title="Select Tool - Click and drag to create bonds between atoms"
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
          title="Eraser - Delete atoms and bonds"
        >
          <Eraser size={20} />
        </button>
        </div>
      </div>

      {/* Element Picker */}
      <div className="flex flex-col gap-1 mb-6 items-center self-center w-full">
        <div className="text-base text-gray-900 mb-2 font-semibold text-center">Atoms</div>
        <div className="flex flex-col items-center gap-1 w-full">
          {elements.map((element) => (
            <button
              key={element.symbol}
              onClick={() => onElementSelect(element.symbol)}
              className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center text-white text-sm font-bold transition-all text-center ${
                selectedElement === element.symbol && selectedTool === 'atom'
                  ? 'ring-2 ring-blue-400 ring-offset-1'
                  : ''
              } ${element.color} hover:scale-105`}
              title={element.name}
            >
              <span className="flex items-center justify-center w-full h-full text-center">{element.symbol}</span>
            </button>
          ))}
        </div>
      </div>
      
    </div>
  );
}
