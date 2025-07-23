import type { FC, ChangeEvent, FormEvent } from 'react';

interface JoinRoomScreenProps {
  name: string;
  roomKey: string;
  onNameChange: (name: string) => void;
  onRoomKeyChange: (key: string) => void;
  onJoinRoom: () => void;
  onBack: () => void;
  error: string;
  onClearError: () => void;
}

const JoinRoomScreen: FC<JoinRoomScreenProps> = ({
  name,
  roomKey,
  onNameChange,
  onRoomKeyChange,
  onJoinRoom,
  onBack,
  error,
  onClearError,
}) => {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (name && roomKey) {
      onClearError();
      onJoinRoom();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6">
      <h1 className="text-2xl font-bold text-cyber-green-500">Join Existing Room</h1>

      <form onSubmit={handleSubmit} className="w-full max-w-md p-6 bg-cyber-surface rounded-lg shadow-md border border-cyber-border">
        {error && (
          <div className="p-3 mb-4 text-sm text-cyber-red-300 bg-cyber-red-900 rounded-md">
            {error}
          </div>
        )}
        
        <div className="mb-4">
          <label htmlFor="join-name" className="block mb-2 text-sm font-medium text-cyber-text-primary">
            Your Name
          </label>
          <input
            id="join-name"
            type="text"
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onNameChange(e.target.value)}
            className="w-full px-3 py-2 border border-cyber-border rounded-md bg-cyber-bg text-cyber-text-primary focus:outline-none focus:ring-2 focus:ring-cyber-green-500 focus:border-cyber-green-500"
            placeholder="Enter your name"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="join-room-key" className="block mb-2 text-sm font-medium text-cyber-text-primary">
            Room Key
          </label>
          <input
            id="join-room-key"
            type="text"
            value={roomKey}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onRoomKeyChange(e.target.value.toUpperCase())}
            className="w-full px-3 py-2 border border-cyber-border rounded-md bg-cyber-bg text-cyber-text-primary focus:outline-none focus:ring-2 focus:ring-cyber-green-500 focus:border-cyber-green-500 font-mono"
            placeholder="Enter room key"
            required
          />
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-cyber-text-primary bg-cyber-surface-alt border border-cyber-border rounded-md hover:bg-cyber-surface hover:border-cyber-text-muted transition-colors"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={!name || !roomKey}
            className={`flex-1 px-4 py-2 text-cyber-bg rounded-md font-semibold transition-colors ${
              name && roomKey
                ? 'bg-cyber-green-500 hover:bg-cyber-green-600'
                : 'bg-cyber-green-800 cursor-not-allowed'
            }`}
          >
            Join Room
          </button>
        </div>
      </form>
    </div>
  );
};

export default JoinRoomScreen; 