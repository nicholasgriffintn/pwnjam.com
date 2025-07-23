import type { FC } from 'react';

import { config } from '../config';

interface WelcomeScreenProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

const WelcomeScreen: FC<WelcomeScreenProps> = ({
  onCreateRoom,
  onJoinRoom,
}) => {
  const { app } = config;

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6">
      <h1 className="text-3xl font-bold text-cyber-green-500">
        Welcome to {app.name}
      </h1>
      <p className="text-cyber-text-secondary">
        A starter template for collaborative applications.
      </p>

      <div className="flex flex-col space-y-4 w-full max-w-md">
        <button
          type="button"
          onClick={onCreateRoom}
          className="px-6 py-2 text-cyber-bg bg-cyber-green-500 rounded-md hover:bg-cyber-green-600 font-semibold transition-colors"
        >
          Create Room
        </button>
        <button
          type="button"
          onClick={onJoinRoom}
          className="px-6 py-2 text-cyber-green-500 bg-cyber-surface border border-cyber-green-500 rounded-md hover:bg-cyber-surface-alt transition-colors"
        >
          Join Room
        </button>

        <p className="mt-4 text-cyber-text-muted">
          <a href={app.githubRepo} className="text-cyber-cyan-500 hover:underline transition-colors">
            View the source code on GitHub
          </a>
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
