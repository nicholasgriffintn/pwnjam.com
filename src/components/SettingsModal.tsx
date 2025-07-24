import { useState, useEffect, type FC } from 'react';
import type { RoomSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: RoomSettings;
  onSaveSettings: (settings: RoomSettings) => void;
}

const SettingsModal: FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [localSettings, setLocalSettings] = useState<RoomSettings>(settings);

  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleChange = (
    key: keyof RoomSettings,
    value: string | boolean | number | string[]
  ) => {
    setLocalSettings({
      ...localSettings,
      [key]: value,
    });
  };

  const handleSave = () => {
    console.log('Saving settings from modal:', localSettings);
    onSaveSettings(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(15, 15, 35, 0.8)' }}>
      <div className="bg-cyber-surface rounded-lg shadow-xl w-full max-w-md p-6 border border-cyber-border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-cyber-text-primary">Room Settings</h2>
          <button 
            type="button"
            onClick={onClose}
            className="text-cyber-text-muted hover:text-cyber-text-primary transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <title>Close settings modal</title>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* CTF Game Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-cyber-text-primary border-b border-cyber-border pb-2">
              🎯 CTF Settings
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-cyber-text-primary mb-1">
                  Difficulty Level
                </label>
                <select
                  value={localSettings.difficultyLevel || 'intermediate'}
                  onChange={(e) => handleChange('difficultyLevel', e.target.value as any)}
                  className="w-full px-3 py-2 bg-cyber-bg border border-cyber-border rounded-md text-cyber-text-primary focus:ring-2 focus:ring-cyber-cyan-500 focus:border-transparent"
                >
                  <option value="beginner">🟢 Beginner</option>
                  <option value="intermediate">🟡 Intermediate</option>
                  <option value="advanced">🟠 Advanced</option>
                  <option value="expert">🔴 Expert</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-cyber-text-primary mb-1">
                  Game Mode
                </label>
                <select
                  value={localSettings.gameMode || 'practice'}
                  onChange={(e) => handleChange('gameMode', e.target.value as any)}
                  className="w-full px-3 py-2 bg-cyber-bg border border-cyber-border rounded-md text-cyber-text-primary focus:ring-2 focus:ring-cyber-cyan-500 focus:border-transparent"
                >
                  <option value="practice">🎯 Practice</option>
                  <option value="timed">⏱️ Timed</option>
                  <option value="tournament">🏆 Tournament</option>
                </select>
              </div>
            </div>
          </div>

          {/* Challenge Categories */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-cyber-text-primary">
              Challenge Categories
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'web', label: '🌐 Web Security', emoji: '🌐' },
                { id: 'crypto', label: '🔐 Cryptography', emoji: '🔐' },
                { id: 'pwn', label: '💥 Binary Exploitation', emoji: '💥' },
                { id: 'reverse', label: '🔄 Reverse Engineering', emoji: '🔄' },
                { id: 'forensics', label: '🔍 Digital Forensics', emoji: '🔍' },
                { id: 'misc', label: '🎲 Miscellaneous', emoji: '🎲' }
              ].map((category) => (
                <label key={category.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={(localSettings.challengeCategories || []).includes(category.id)}
                    onChange={(e) => {
                      const currentCategories = localSettings.challengeCategories || [];
                      const newCategories = e.target.checked
                        ? [...currentCategories, category.id]
                        : currentCategories.filter(c => c !== category.id);
                      handleChange('challengeCategories', newCategories);
                    }}
                    className="w-4 h-4 text-cyber-cyan-600 bg-cyber-bg border-cyber-border rounded focus:ring-cyber-cyan-500"
                  />
                  <span className="text-sm text-cyber-text-primary">{category.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* AI and Hint Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-cyber-text-primary">
              AI & Assistance Settings
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-cyber-text-primary mb-1">
                  AI Assistance Level
                </label>
                <select
                  value={localSettings.aiAssistanceLevel || 'basic'}
                  onChange={(e) => handleChange('aiAssistanceLevel', e.target.value as any)}
                  className="w-full px-3 py-2 bg-cyber-bg border border-cyber-border rounded-md text-cyber-text-primary focus:ring-2 focus:ring-cyber-cyan-500 focus:border-transparent"
                >
                  <option value="none">🚫 None</option>
                  <option value="basic">⚡ Basic</option>
                  <option value="full">🤖 Full</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={localSettings.hintsEnabled !== false}
                    onChange={(e) => handleChange('hintsEnabled', e.target.checked)}
                    className="w-4 h-4 text-cyber-cyan-600 bg-cyber-bg border-cyber-border rounded focus:ring-cyber-cyan-500"
                  />
                  <span className="text-sm text-cyber-text-primary">💡 Enable Hints</span>
                </label>
              </div>
            </div>
          </div>

          {/* Scoring Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-cyber-text-primary">
              Scoring & Time Settings
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-cyber-text-primary mb-1">
                  Time Limit (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  max="180"
                  value={localSettings.timeLimit || 30}
                  onChange={(e) => handleChange('timeLimit', parseInt(e.target.value) || 30)}
                  className="w-full px-3 py-2 bg-cyber-bg border border-cyber-border rounded-md text-cyber-text-primary focus:ring-2 focus:ring-cyber-cyan-500 focus:border-transparent"
                  placeholder="30"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-cyber-text-primary mb-1">
                  Scoring Multiplier
                </label>
                <select
                  value={localSettings.scoringMultiplier || 1}
                  onChange={(e) => handleChange('scoringMultiplier', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 bg-cyber-bg border border-cyber-border rounded-md text-cyber-text-primary focus:ring-2 focus:ring-cyber-cyan-500 focus:border-transparent"
                >
                  <option value={0.5}>0.5x (Training)</option>
                  <option value={1}>1x (Normal)</option>
                  <option value={1.5}>1.5x (Competitive)</option>
                  <option value={2}>2x (Tournament)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Legacy Diagram Code Setting */}
          {localSettings.diagramCode !== undefined && (
            <div className="space-y-3 pt-4 border-t border-cyber-border">
              <h4 className="text-sm font-medium text-cyber-text-secondary">
                Legacy Settings
              </h4>
              <div>
                <label className="block text-sm font-medium text-cyber-text-secondary mb-1">
                  Diagram Code
                </label>
                <textarea
                  value={localSettings.diagramCode || ''}
                  onChange={(e) => handleChange('diagramCode', e.target.value)}
                  className="w-full px-3 py-2 bg-cyber-bg border border-cyber-border rounded-md text-cyber-text-primary focus:ring-2 focus:ring-cyber-cyan-500 focus:border-transparent"
                  rows={3}
                  placeholder="Enter diagram code..."
                />
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-cyber-border rounded-md text-sm font-medium text-cyber-text-primary bg-cyber-surface-alt hover:bg-cyber-bg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyber-green-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-cyber-bg bg-cyber-green-500 hover:bg-cyber-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyber-green-500 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal; 