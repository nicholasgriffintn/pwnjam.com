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

export interface ChallengeGenerationRequest {
  category: string;
  difficulty: number;
  previousChallenges?: string[];
  userLevel?: number;
}

export interface HintRequest {
  challengeId: string;
  currentProgress?: string;
  previousHints?: string[];
  hintsUsed: number;
}
