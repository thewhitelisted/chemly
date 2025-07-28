import { useState } from 'react';
import { X, Sun, Moon, Settings, Palette, Monitor, Smartphone } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export function SettingsModal({ isOpen, onClose, darkMode, onToggleDarkMode }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'appearance' | 'general'>('appearance');

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-700 w-full max-w-md max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Settings
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-zinc-700">
            <button
              onClick={() => setActiveTab('appearance')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'appearance'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Palette className="w-4 h-4" />
                Appearance
              </div>
            </button>
            <button
              onClick={() => setActiveTab('general')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'general'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Settings className="w-4 h-4" />
                General
              </div>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                {/* Theme Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                    Theme
                  </h3>
                  
                  <div className="space-y-3">
                    {/* System Theme */}
                    <button
                      onClick={() => {
                        // Reset to system preference
                        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                        if (isDark !== darkMode) {
                          onToggleDarkMode();
                        }
                      }}
                      className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Monitor className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <div className="text-left">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            System
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Follow your system theme
                          </div>
                        </div>
                      </div>
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-zinc-600"></div>
                    </button>

                    {/* Light Theme */}
                    <button
                      onClick={() => {
                        if (darkMode) {
                          onToggleDarkMode();
                        }
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors ${
                        !darkMode
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <div className="text-left">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            Light
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Light theme for bright environments
                          </div>
                        </div>
                      </div>
                      {!darkMode && (
                        <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-blue-500"></div>
                      )}
                      {darkMode && (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-zinc-600"></div>
                      )}
                    </button>

                    {/* Dark Theme */}
                    <button
                      onClick={() => {
                        if (!darkMode) {
                          onToggleDarkMode();
                        }
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors ${
                        darkMode
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <div className="text-left">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            Dark
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Dark theme for low-light environments
                          </div>
                        </div>
                      </div>
                      {darkMode && (
                        <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-blue-500"></div>
                      )}
                      {!darkMode && (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-zinc-600"></div>
                      )}
                    </button>
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Preview
                  </h4>
                  <div className={`p-4 rounded-lg border ${
                    darkMode 
                      ? 'bg-zinc-800 border-zinc-700 text-gray-100' 
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        darkMode ? 'bg-zinc-600' : 'bg-gray-300'
                      }`}></div>
                      <div className="text-sm">
                        {darkMode ? 'Dark theme active' : 'Light theme active'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                    General Settings
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-zinc-700">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            Auto-save
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Automatically save your work
                          </div>
                        </div>
                      </div>
                      <div className="w-12 h-6 bg-gray-200 dark:bg-zinc-700 rounded-full relative">
                        <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform"></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-zinc-700">
                      <div className="flex items-center gap-3">
                        <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            Notifications
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Show notifications for updates
                          </div>
                        </div>
                      </div>
                      <div className="w-12 h-6 bg-blue-500 rounded-full relative">
                        <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-transform"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-zinc-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
} 