import type { FC, ChangeEvent, FormEvent } from 'react';

interface CreateRoomScreenProps {
  name: string;
  onNameChange: (name: string) => void;
  onCreateRoom: () => void;
  onBack: () => void;
  error: string;
  onClearError: () => void;
}

const CreateRoomScreen: FC<CreateRoomScreenProps> = ({
  name,
  onNameChange,
  onCreateRoom,
  onBack,
  error,
  onClearError,
}) => {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (name) {
      onClearError();
      onCreateRoom();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6">
      <h1 className="text-2xl font-bold text-cyber-green-500">Create New Room</h1>

      <form onSubmit={handleSubmit} className="w-full max-w-md p-6 bg-cyber-surface rounded-lg shadow-md border border-cyber-border">
        {error && (
          <div className="p-3 mb-4 text-sm text-cyber-red-300 bg-cyber-red-900 rounded-md">
            {error}
          </div>
        )}
        
        <div className="mb-4">
          <label htmlFor="create-name" className="block mb-2 text-sm font-medium text-cyber-text-primary">
            Your Name
          </label>
          <input
            id="create-name"
            type="text"
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onNameChange(e.target.value)}
            className="w-full px-3 py-2 border border-cyber-border rounded-md bg-cyber-bg text-cyber-text-primary focus:outline-none focus:ring-2 focus:ring-cyber-green-500 focus:border-cyber-green-500"
            placeholder="Enter your name"
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
            disabled={!name}
            className={`flex-1 px-4 py-2 text-cyber-bg rounded-md font-semibold transition-colors ${
              name
                ? 'bg-cyber-green-500 hover:bg-cyber-green-600'
                : 'bg-cyber-green-800 cursor-not-allowed'
            }`}
          >
            Create Room
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateRoomScreen; 