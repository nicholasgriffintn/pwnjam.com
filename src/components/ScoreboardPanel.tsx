import { useState, useEffect } from 'react';
import type { UserScore, WebSocketMessage, LeaderboardEntry } from '../types';
import {
  getGlobalLeaderboard,
  addEventListener,
  removeEventListener,
} from '../lib/api-service';

interface ScoreboardPanelProps {
  roomScores: Record<string, UserScore>;
  currentUser: string;
}

export function ScoreboardPanel({
  roomScores,
  currentUser,
}: ScoreboardPanelProps) {
  const [activeTab, setActiveTab] = useState<'room' | 'global'>('room');
  const [globalLeaderboard, setGlobalLeaderboard] = useState<
    LeaderboardEntry[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const calculateEfficiency = (score: UserScore): number => {
    if (score.challengesSolved === 0) return 0;

    const avgTimePerChallenge = score.totalTime / score.challengesSolved;
    const pointsPerMinute = score.totalScore / (avgTimePerChallenge / 60000);
    const hintEfficiency = Math.max(
      0,
      1 - score.hintsUsed / (score.challengesSolved * 3)
    );

    return Math.floor(pointsPerMinute * hintEfficiency);
  };

  // Convert room scores to leaderboard format
  const roomLeaderboard: LeaderboardEntry[] = Object.values(roomScores)
    .map((score, index) => ({
      rank: index + 1,
      userId: score.userId,
      totalScore: score.totalScore,
      challengesSolved: score.challengesSolved,
      averageTime:
        score.challengesSolved > 0
          ? score.totalTime / score.challengesSolved
          : 0,
      efficiency: calculateEfficiency(score),
    }))
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  useEffect(() => {
    const handleLeaderboardUpdate = (data: WebSocketMessage) => {
      if (data.leaderboard) {
        if (data.leaderboard?.global) {
          setGlobalLeaderboard(data.leaderboard.global);
        }
      }
    };

    const handleScoreUpdate = () => {
      // Room leaderboard will be updated automatically via roomScores prop
      // Fetch global leaderboard when scores update
      if (activeTab === 'global') {
        fetchGlobalLeaderboard();
      }
    };

    addEventListener('leaderboardUpdated', handleLeaderboardUpdate);
    addEventListener('scoreUpdated', handleScoreUpdate);

    return () => {
      removeEventListener('leaderboardUpdated', handleLeaderboardUpdate);
      removeEventListener('scoreUpdated', handleScoreUpdate);
    };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'global' && globalLeaderboard.length === 0) {
      fetchGlobalLeaderboard();
    }
  }, [activeTab]);

  const fetchGlobalLeaderboard = async () => {
    setIsLoading(true);
    setError('');

    try {
      const leaderboard = await getGlobalLeaderboard();
      setGlobalLeaderboard(leaderboard);
    } catch (err) {
      console.error('Error fetching global leaderboard:', err);
      setError('Failed to load global leaderboard');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes === 0) {
      return `${remainingSeconds}s`;
    }

    return `${minutes}m ${remainingSeconds}s`;
  };

  const getSkillBadge = (
    totalScore: number
  ): { level: number; title: string; color: string } => {
    if (totalScore >= 5000)
      return { level: 6, title: 'Grandmaster', color: '#9c27b0' };
    if (totalScore >= 2000)
      return { level: 5, title: 'Master', color: '#673ab7' };
    if (totalScore >= 800)
      return { level: 4, title: 'Expert', color: '#f44336' };
    if (totalScore >= 300)
      return { level: 3, title: 'Practitioner', color: '#ff9800' };
    if (totalScore >= 100)
      return { level: 2, title: 'Apprentice', color: '#ffc107' };
    return { level: 1, title: 'Novice', color: '#4caf50' };
  };

  const getCurrentUserRank = (
    leaderboard: LeaderboardEntry[]
  ): number | null => {
    const userEntry = leaderboard.find((entry) => entry.userId === currentUser);
    return userEntry ? userEntry.rank : null;
  };

  const getRankClass = (rank: number): string => {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return 'white';
  };

  const getRankIcon = (rank: number): string => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '🏅';
  };

  const currentLeaderboard =
    activeTab === 'room' ? roomLeaderboard : globalLeaderboard;
  const currentUserRank = getCurrentUserRank(currentLeaderboard);

  return (
    <div className="bg-cyber-surface border border-cyber-border rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-cyber-text-primary">
          🏆 Leaderboard
        </h2>
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              activeTab === 'room'
                ? 'bg-cyber-cyan-500 text-cyber-bg'
                : 'bg-cyber-surface-alt text-cyber-text-secondary hover:text-cyber-text-primary'
            }`}
            onClick={() => setActiveTab('room')}
          >
            🏠 Room
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              activeTab === 'global'
                ? 'bg-cyber-cyan-500 text-cyber-bg'
                : 'bg-cyber-surface-alt text-cyber-text-secondary hover:text-cyber-text-primary'
            }`}
            onClick={() => setActiveTab('global')}
          >
            🌍 Global
          </button>
        </div>
      </div>

      {currentUserRank && (
        <div className="bg-cyber-surface-alt border-l-4 border-cyber-cyan-500 rounded-lg p-4 mb-6 flex items-center justify-between">
          <span className="text-cyber-text-secondary text-sm font-medium">
            Your Rank:
          </span>
          <span className="ml-2 px-3 py-1 rounded-full bg-cyber-cyan-500 text-cyber-bg font-bold text-base">
            #{currentUserRank}
          </span>
          {activeTab === 'global' && (
            <span className="ml-4 text-cyber-text-muted text-xs">
              out of {globalLeaderboard.length} players
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center p-8 bg-cyber-surface-alt rounded-lg">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyber-cyan-500 mb-4"></div>
            <span className="text-cyber-text-secondary text-lg">
              Loading leaderboard...
            </span>
          </div>
        )}
        {error && (
          <div className="flex flex-col items-center justify-center p-8 bg-cyber-surface-alt rounded-lg">
            <div className="text-cyber-red-500 text-3xl mb-2">⚠️</div>
            <span className="text-cyber-text-primary mb-2">{error}</span>
            <button
              onClick={fetchGlobalLeaderboard}
              className="px-4 py-2 bg-cyber-cyan-500 text-cyber-bg rounded-lg font-semibold hover:bg-cyber-cyan-600 transition-colors"
            >
              Retry
            </button>
          </div>
        )}
        {!isLoading && !error && currentLeaderboard.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 bg-cyber-surface-alt rounded-lg">
            <div className="text-cyber-cyan-500 text-4xl mb-2">📊</div>
            <h3 className="text-lg font-bold text-cyber-text-primary mb-1">
              No scores yet
            </h3>
            <p className="text-cyber-text-secondary text-sm">
              {activeTab === 'room'
                ? 'Complete some challenges to see scores here!'
                : 'Be the first to make it to the global leaderboard!'}
            </p>
          </div>
        )}
        {!isLoading && !error && currentLeaderboard.length > 0 && (
          <div className="flex flex-col gap-3">
            {currentLeaderboard.map((entry) => {
              const isCurrentUser = entry.userId === currentUser;
              const skill = getSkillBadge(entry.totalScore);
              return (
                <div
                  key={entry.userId}
                  className={`flex items-center justify-between bg-cyber-surface-alt border border-cyber-border rounded-lg px-4 py-3 ${
                    isCurrentUser ? 'border-cyber-cyan-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`px-3 py-1 rounded-full font-bold text-sm text-cyber-text-${getRankClass(
                        entry.rank
                      )}`}
                    >
                      {getRankIcon(entry.rank)} #{entry.rank}
                    </span>
                    <span className="truncate font-semibold text-cyber-text-primary text-base">
                      {entry.userId}
                    </span>
                    {isCurrentUser && (
                      <span className="ml-2 px-2 py-0.5 rounded bg-cyber-cyan-500 text-cyber-bg text-xs font-bold">
                        You
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-6">
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: skill.color }}
                    >
                      {skill.title}
                    </span>
                    <div className="flex flex-col items-end">
                      <span className="text-cyber-text-secondary text-xs">
                        Score
                      </span>
                      <span className="text-cyber-cyan-500 font-bold text-lg">
                        {entry.totalScore.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-cyber-text-secondary text-xs">
                        Solved
                      </span>
                      <span className="text-cyber-text-primary font-bold text-lg">
                        {entry.challengesSolved}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-cyber-text-secondary text-xs">
                        Avg Time
                      </span>
                      <span className="text-cyber-text-primary font-bold text-lg">
                        {formatTime(entry.averageTime)}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-cyber-text-secondary text-xs">
                        Efficiency
                      </span>
                      <span className="text-cyber-text-primary font-bold text-lg">
                        {entry.efficiency}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {currentLeaderboard.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 mt-8 border-t border-cyber-border pt-4">
          <div className="flex gap-6">
            <div className="flex flex-col items-center">
              <span className="text-xs text-cyber-text-muted">
                Total Players
              </span>
              <span className="text-cyber-text-primary font-bold text-base">
                {currentLeaderboard.length}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-cyber-text-muted">Top Score</span>
              <span className="text-cyber-text-primary font-bold text-base">
                {currentLeaderboard[0]?.totalScore.toLocaleString()}
              </span>
            </div>
            {activeTab === 'room' && (
              <div className="flex flex-col items-center">
                <span className="text-xs text-cyber-text-muted">
                  Room Average
                </span>
                <span className="text-cyber-text-primary font-bold text-base">
                  {Math.round(
                    currentLeaderboard.reduce(
                      (sum, entry) => sum + entry.totalScore,
                      0
                    ) / currentLeaderboard.length
                  ).toLocaleString()}
                </span>
              </div>
            )}
          </div>
          {activeTab === 'global' && (
            <button
              onClick={fetchGlobalLeaderboard}
              className="px-4 py-2 bg-cyber-cyan-500 text-cyber-bg rounded-lg font-semibold hover:bg-cyber-cyan-600 transition-colors text-sm"
              disabled={isLoading}
            >
              🔄 Refresh
            </button>
          )}
        </div>
      )}
    </div>
  );
}
