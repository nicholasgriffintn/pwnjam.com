import { Challenge } from './challenge';

export interface UserScore {
  userId: string;
  totalScore: number;
  challengesSolved: number;
  totalTime: number;
  hintsUsed: number;
  lastSolveTime?: number;
}

export interface ScoreCalculationInput {
  challenge: Challenge;
  solveTime: number;
  hintsUsed: number;
  isCollaboration?: boolean;
  userLevel?: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  totalScore: number;
  challengesSolved: number;
  averageTime: number;
  efficiency: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: {
    type: 'score' | 'challenges' | 'speed' | 'category' | 'streak';
    value: number;
    category?: string;
  };
}
