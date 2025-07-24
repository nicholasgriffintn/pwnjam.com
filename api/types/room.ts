import { Challenge } from './challenge';
import { UserScore } from './scoring';

export interface RoomData {
  key: string;
  users: string[];
  moderator: string;
  connectedUsers: Record<string, boolean>;
  settings: {
    difficultyLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    challengeCategories?: string[];
    gameMode?: 'practice' | 'timed' | 'tournament';
    aiAssistanceLevel?: 'none' | 'basic' | 'full';
    hintsEnabled?: boolean;
    timeLimit?: number;
    scoringMultiplier?: number;
  };
  currentChallenge?: Challenge;
  scores: Record<string, UserScore>;
  challengeHistory: Challenge[];
  gameSettings: {
    maxChallenges?: number;
    currentRound?: number;
    totalRounds?: number;
    isActive?: boolean;
  };
}
