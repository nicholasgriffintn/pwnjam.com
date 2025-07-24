export interface RoomSettings {
  diagramCode?: string;
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  challengeCategories?: string[];
  gameMode?: 'practice' | 'timed' | 'tournament';
  aiAssistanceLevel?: 'none' | 'basic' | 'full';
  hintsEnabled?: boolean;
  timeLimit?: number;
  scoringMultiplier?: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: number;
  flag: string;
  hints: string[];
  metadata: {
    author?: string;
    tags?: string[];
    estimatedTime?: number;
    resources?: string[];
  };
  startTime?: number;
  endTime?: number;
  attempts: number;
  hintsUsed: number;
}

export interface UserScore {
  userId: string;
  totalScore: number;
  challengesSolved: number;
  totalTime: number;
  hintsUsed: number;
  lastSolveTime?: number;
}

export interface RoomData {
  key: string;
  users: string[];
  moderator: string;
  connectedUsers: Record<string, boolean>;
  createdAt?: string;
  lastActivity?: string;
  settings: RoomSettings;
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

export interface WebSocketErrorData {
  error?: string;
  message?: string;
  code?: number;
}

export interface WebSocketMessage {
  type: string;
  roomData?: RoomData;
  settings?: RoomSettings;
  error?: string;
  message?: string;
  user?: string;
  isConnected?: boolean;
  challenge?: Challenge;
  flag?: string;
  hint?: string;
  maxHints?: number;
  score?: UserScore;
  leaderboard?: {
    global?: LeaderboardEntry[];
  };
  challengeId?: string;
  category?: string;
  difficulty?: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  totalScore: number;
  challengesSolved: number;
  averageTime: number;
  efficiency: number;
}

export type WebSocketMessageType =
  | 'roomJoined'
  | 'roomData'
  | 'userJoined'
  | 'userLeft'
  | 'userConnectionStatus'
  | 'settingsUpdated'
  | 'error'
  | 'startChallenge'
  | 'challengeStarted'
  | 'submitFlag'
  | 'challengeSolved'
  | 'flagIncorrect'
  | 'requestHint'
  | 'hintReceived'
  | 'getLeaderboard'
  | 'leaderboardUpdated'
  | 'scoreUpdated'
  | 'disconnected'
  | 'error'
  | 'initialize'
  | 'userJoined'
  | 'userLeft'
  | 'userConnectionStatus'
  | 'newModerator'
  | 'settingsUpdated';