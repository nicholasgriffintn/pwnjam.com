import type { FC } from 'react';

const LoadingOverlay: FC = () => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(15, 15, 35, 0.8)' }}
    >
      <div className="p-6 bg-cyber-surface rounded-lg shadow-xl flex flex-col items-center border border-cyber-border">
        <div className="w-12 h-12 border-4 border-cyber-green-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-cyber-text-primary font-medium">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
