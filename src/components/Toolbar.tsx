import { MousePointer, Eraser, Move, Sparkles, Sun, Moon } from 'lucide-react';
import type { ElementSymbol } from '../types/chemistry';

interface ToolbarProps {
  selectedElement: ElementSymbol;
  selectedTool: 'atom' | 'select' | 'eraser' | 'pan';
  onElementSelect: (element: ElementSymbol) => void;
  onToolSelect: (tool: 'atom' | 'select' | 'eraser' | 'pan') => void;
  onCleanStructure: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const elements: { symbol: ElementSymbol; name: string; color: string; darkColor: string }[] = [
  { symbol: 'C', name: 'Carbon', color: 'bg-gray-700 text-white', darkColor: 'bg-gray-300 text-white' },
  { symbol: 'O', name: 'Oxygen', color: 'bg-red-500 text-white', darkColor: 'bg-red-300 text-white' },
  { symbol: 'N', name: 'Nitrogen', color: 'bg-blue-500 text-white', darkColor: 'bg-blue-300 text-white' },
  { symbol: 'P', name: 'Phosphorus', color: 'bg-orange-500 text-white', darkColor: 'bg-orange-300 text-white' },
  { symbol: 'S', name: 'Sulfur', color: 'bg-yellow-500 text-white', darkColor: 'bg-yellow-200 text-white' },
  { symbol: 'F', name: 'Fluorine', color: 'bg-green-400 text-white', darkColor: 'bg-green-300 text-white' },
  { symbol: 'Cl', name: 'Chlorine', color: 'bg-green-600 text-white', darkColor: 'bg-green-200 text-white' },
  { symbol: 'Br', name: 'Bromine', color: 'bg-red-800 text-white', darkColor: 'bg-red-300 text-white' },
  { symbol: 'I', name: 'Iodine', color: 'bg-purple-800 text-white', darkColor: 'bg-purple-200 text-white' },
];

export function Toolbar({
  selectedElement,
  selectedTool,
  onElementSelect,
  onToolSelect,
  onCleanStructure,
  darkMode,
  onToggleDarkMode,
}: ToolbarProps) {
  return (
    <div className="w-16 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 flex flex-col items-center py-4 shadow-sm relative transition-colors">
      {/* Tool Selection */}
      <div className="flex flex-col gap-1 mb-6 items-center self-center w-full">
        <div className="text-base text-gray-900 dark:text-gray-100 mb-2 font-semibold text-center">Tools</div>
        <div className="flex flex-col gap-2 w-full items-center">
        <button
          onClick={() => onToolSelect('select')}
          className={`p-3 rounded-lg transition-colors ${
            selectedTool === 'select'
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200'
              : 'hover:bg-gray-100 text-gray-600 dark:hover:bg-zinc-700 dark:text-gray-300'
          }`}
          title="Select Tool - Click and drag to create bonds between atoms"
        >
          <MousePointer size={20} />
        </button>
        
        <button
          onClick={() => onToolSelect('pan')}
          className={`p-3 rounded-lg transition-colors ${
            selectedTool === 'pan'
              ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200'
              : 'hover:bg-gray-100 text-gray-600 dark:hover:bg-zinc-700 dark:text-gray-300'
          }`}
          title="Pan Tool"
        >
          <Move size={20} />
        </button>
        
        <button
          onClick={() => onToolSelect('eraser')}
          className={`p-3 rounded-lg transition-colors ${
            selectedTool === 'eraser'
              ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200'
              : 'hover:bg-gray-100 text-gray-600 dark:hover:bg-zinc-700 dark:text-gray-300'
          }`}
          title="Eraser - Delete atoms and bonds"
        >
          <Eraser size={20} />
        </button>
        </div>
      </div>

      {/* Element Picker */}
      <div className="flex flex-col gap-1 mb-6 items-center self-center w-full">
        <div className="text-base text-gray-900 dark:text-gray-100 mb-2 font-semibold text-center">Atoms</div>
        <div className="flex flex-col items-center gap-1 w-full">
          {elements.map((element) => (
            <button
              key={element.symbol}
              onClick={() => onElementSelect(element.symbol)}
              className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center text-sm font-bold transition-all text-center
                ${selectedElement === element.symbol && selectedTool === 'atom' ? 'ring-2 ring-blue-400 ring-offset-1' : ''}
                ${element.color} hover:scale-105
                dark:${element.darkColor}
              `}
              title={element.name}
            >
              <span className="flex items-center justify-center w-full h-full text-center">{element.symbol}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Clean Structure Button and Dark Mode Switch at the bottom */}
      <div className="w-full flex flex-col items-center gap-2" style={{ position: 'absolute', bottom: 16, left: 0 }}>
        <button
          onClick={onCleanStructure}
          className="w-10 h-10 rounded-lg bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-colors flex items-center justify-center"
          title="Clean Structure"
        >
          <Sparkles size={22} />
        </button>
        <button
          onClick={onToggleDarkMode}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-zinc-700`}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun size={22} /> : <Moon size={22} />}
        </button>
      </div>
    </div>
  );
}
