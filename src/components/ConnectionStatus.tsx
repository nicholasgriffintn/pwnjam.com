import type { FC } from 'react';

interface ConnectionStatusProps {
  isConnected: boolean;
}

const ConnectionStatus: FC<ConnectionStatusProps> = ({ isConnected }) => {
  return (
    <div
      className={`flex items-center px-2 py-1 rounded-md ${isConnected ? 'bg-cyber-green-900 text-cyber-green-500' : 'bg-cyber-red-900 text-cyber-red-300'}`}
      title={isConnected ? 'Connected' : 'Disconnected'}
    >
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-cyber-green-500' : 'bg-cyber-red-300'}`} />
      <span className="ml-1.5 text-xs font-medium hidden sm:inline">
        {isConnected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  );
};

export default ConnectionStatus;