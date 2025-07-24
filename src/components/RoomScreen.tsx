import { type FC, useState, useEffect } from 'react';

import { config } from '../config';
import type { RoomData, Challenge } from '../types';
import ConnectionStatus from './ConnectionStatus';
import ErrorBanner from './ErrorBanner';
import SettingsModal from './SettingsModal';
import ShareRoomModal from './ShareRoomModal';
import { ChallengePanel } from './ChallengePanel';
import { ScoreboardPanel } from './ScoreboardPanel';

interface RoomScreenProps {
  roomData: RoomData;
  name: string;
  isModeratorView: boolean;
  onUpdateSettings: (settings: RoomData['settings']) => void;
  error: string;
  onClearError: () => void;
  isConnected: boolean;
  onLeaveRoom: () => void;
}

const RoomScreen: FC<RoomScreenProps> = ({
  roomData,
  name,
  isModeratorView,
  onUpdateSettings,
  error,
  onClearError,
  isConnected,
  onLeaveRoom,
}) => {
  const { app } = config;
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'challenge' | 'leaderboard'>('challenge');
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | undefined>(roomData.currentChallenge);

  useEffect(() => {
    console.log('Room settings updated:', roomData.settings);
  }, [roomData.settings]);

  useEffect(() => {
    setCurrentChallenge(roomData.currentChallenge);
  }, [roomData.currentChallenge]);

  const handleChallengeUpdate = (challenge: Challenge) => {
    setCurrentChallenge(challenge);
  };

  return (
    <div className="flex flex-col h-screen">
      {error && <ErrorBanner message={error} onClose={onClearError} />}

      <header className="p-4 bg-gradient-to-r from-cyber-surface to-cyber-surface-alt text-cyber-text-primary shadow-md border-b border-cyber-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-4">
            <h1 className="text-lg md:text-xl font-bold">{app.name}</h1>
            <div className="flex items-stretch h-7">
              <div className="px-2 md:px-3 py-1 text-xs md:text-sm bg-cyber-cyan-500 text-cyber-bg rounded-l-md truncate max-w-[80px] md:max-w-none flex items-center font-mono font-bold">
                {roomData.key}
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="px-2 py-1 bg-cyber-cyan-600 hover:bg-cyber-cyan-700 rounded-r-md border-l border-cyber-cyan-400 flex items-center transition-colors"
                title="Share Room"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <title>Share Room</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              </button>
            </div>
            <button
              type="button"
              onClick={onLeaveRoom}
              className="text-xs md:text-sm px-2 md:px-3 py-1 bg-cyber-red-300 hover:bg-cyber-red-400 text-cyber-bg rounded-md transition-colors font-semibold"
              title="Leave Room"
            >
              Leave Room
            </button>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            <ConnectionStatus isConnected={isConnected} />
            <div
              className={`hidden sm:block text-xs md:text-sm px-2 md:px-3 py-1 rounded-md font-semibold ${
                isModeratorView
                  ? 'bg-cyber-gold-500 text-cyber-bg'
                  : 'bg-cyber-surface-alt text-cyber-text-secondary'
              }`}
            >
              {isModeratorView ? 'Moderator' : 'Team Member'}
            </div>
            {isModeratorView && (
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(true)}
                className="p-1 md:p-1.5 rounded-full bg-teal-800 hover:bg-teal-900 transition-colors"
                title="Room Settings"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 md:h-5 md:w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <title>Room Settings</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[30%_70%] flex-1 h-full">
        <div className="p-4 bg-cyber-surface border-b border-cyber-border md:border-b-0 md:border-r overflow-y-auto">
          <h2 className="mb-4 text-lg font-medium text-cyber-text-primary">
            Participants ({roomData.users.length})
          </h2>
          <ul className="space-y-3">
            {roomData.users.map((user: string) => {
              const userScore = roomData.scores?.[user];
              const isConnected = roomData.connectedUsers?.[user];
              
              return (
                <li
                  key={user}
                  className="p-3 bg-cyber-surface-alt rounded-md border border-cyber-border transition-all hover:bg-cyber-bg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        isConnected ? 'bg-cyber-green-500' : 'bg-cyber-red-500'
                      }`} />
                      <span
                        className={`text-sm font-medium ${
                          user === name
                            ? 'text-cyber-green-500'
                            : 'text-cyber-text-primary'
                        }`}
                      >
                        {user}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {user === roomData.moderator && (
                        <span className="px-2 py-1 text-xs bg-cyber-gold-500 text-cyber-bg rounded font-semibold">
                          MOD
                        </span>
                      )}
                      {user === name && (
                        <span className="px-2 py-1 text-xs bg-cyber-cyan-500 text-cyber-bg rounded">
                          YOU
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {userScore && (
                    <div className="grid grid-cols-2 gap-2 text-xs text-cyber-text-secondary">
                      <div className="flex justify-between">
                        <span>Score:</span>
                        <span className="font-medium text-cyber-cyan-400">
                          {userScore.totalScore.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Solved:</span>
                        <span className="font-medium text-cyber-green-400">
                          {userScore.challengesSolved}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {!userScore && (
                    <div className="text-xs text-cyber-text-muted italic">
                      No challenges completed yet
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-col p-4 md:p-6 overflow-y-auto bg-cyber-bg">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-cyber-text-primary">
                🎯 CTF Challenge Platform
              </h2>
              
              <div className="flex bg-cyber-surface rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('challenge')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'challenge'
                      ? 'bg-cyber-cyan-600 text-white'
                      : 'text-cyber-text-secondary hover:text-cyber-text-primary'
                  }`}
                >
                  🧩 Challenge
                </button>
                <button
                  onClick={() => setActiveTab('leaderboard')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'leaderboard'
                      ? 'bg-cyber-cyan-600 text-white'
                      : 'text-cyber-text-secondary hover:text-cyber-text-primary'
                  }`}
                >
                  🏆 Leaderboard
                </button>
              </div>
            </div>
            
            {activeTab === 'challenge' && (
              <ChallengePanel
                currentChallenge={currentChallenge}
                isRoomModerator={isModeratorView}
                onChallengeUpdate={handleChallengeUpdate}
                settings={roomData.settings}
              />
            )}
            
            {activeTab === 'leaderboard' && (
              <ScoreboardPanel
                roomScores={roomData.scores || {}}
                currentUser={name}
              />
            )}
          </div>
        </div>
      </div>

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={roomData.settings}
        onSaveSettings={onUpdateSettings}
      />

      <ShareRoomModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        roomKey={roomData.key}
      />
    </div>
  );
};

export default RoomScreen;
