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

  // @ts-ignore
  const handleChange = (
    key: keyof RoomSettings,
    value: string
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

        <div className="space-y-4">
          {/* Room settings controls go here */}
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