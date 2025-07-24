import type { D1Database, KVNamespace } from '@cloudflare/workers-types';

import type { ApiConfig } from './config';
import type {
  ScoreCalculationInput,
  UserScore,
  LeaderboardEntry,
  Achievement,
} from './types';
import { ACHIEVEMENTS } from './data-model/scoring';

export class ScoringSystem {
  private config: ApiConfig;
  private db?: D1Database;
  private kv?: KVNamespace;

  constructor(config: ApiConfig, db?: D1Database, kv?: KVNamespace) {
    this.config = config;
    this.db = db;
    this.kv = kv;
  }

  calculateScore(input: ScoreCalculationInput): number {
    const { challenge, solveTime, hintsUsed, isCollaboration = false } = input;

    const basePoints = this.getBasePoints(challenge.difficulty);
    const timeBonus = this.calculateTimeBonus(solveTime, challenge.difficulty);
    const hintPenalty = this.calculateHintPenalty(hintsUsed);
    const collaborationBonus = isCollaboration
      ? basePoints * (this.config.challenge.collaborationBonusMultiplier - 1)
      : 0;

    const MINIMUM_SCORE = 10;

    const totalScore = Math.max(
      Math.floor(basePoints + timeBonus - hintPenalty + collaborationBonus),
      MINIMUM_SCORE
    );

    return totalScore;
  }

  private getBasePoints(difficulty: number): number {
    const multiplier =
      this.config.challenge.difficultyPointMultipliers[difficulty - 1] || 1;
    return this.config.challenge.basePoints * multiplier;
  }

  private calculateTimeBonus(solveTime: number, difficulty: number): number {
    const expectedTime = this.getExpectedTime(difficulty);
    const timeRatio = Math.max(0, (expectedTime - solveTime) / expectedTime);
    const basePoints = this.getBasePoints(difficulty);

    return Math.floor(
      basePoints * timeRatio * (this.config.challenge.timeBonusMultiplier - 1)
    );
  }

  private calculateHintPenalty(hintsUsed: number): number {
    return hintsUsed * this.config.challenge.hintPenalty;
  }

  private getExpectedTime(difficulty: number): number {
    return (10 + difficulty * 5) * 60;
  }

  async updateLeaderboard(
    roomKey: string,
    userScore: UserScore
  ): Promise<void> {
    if (!this.kv) return;

    try {
      const leaderboardKey = `leaderboard:${roomKey}`;
      const existingData =
        ((await this.kv.get(leaderboardKey, 'json')) as LeaderboardEntry[]) ||
        [];

      const existingEntry = existingData.find(
        (entry) => entry.userId === userScore.userId
      );

      if (existingEntry) {
        existingEntry.totalScore = userScore.totalScore;
        existingEntry.challengesSolved = userScore.challengesSolved;
        existingEntry.averageTime =
          userScore.totalTime / userScore.challengesSolved;
        existingEntry.efficiency = this.calculateEfficiency(userScore);
      } else {
        const newEntry: LeaderboardEntry = {
          rank: 0,
          userId: userScore.userId,
          totalScore: userScore.totalScore,
          challengesSolved: userScore.challengesSolved,
          averageTime: userScore.totalTime / userScore.challengesSolved,
          efficiency: this.calculateEfficiency(userScore),
        };
        existingData.push(newEntry);
      }

      existingData.sort((a, b) => b.totalScore - a.totalScore);
      existingData.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      await this.kv.put(leaderboardKey, JSON.stringify(existingData), {
        expirationTtl: 86400, // 24 hours
      });
    } catch (error) {
      console.error('Error updating leaderboard:', error);
    }
  }

  async getLeaderboard(roomKey: string): Promise<LeaderboardEntry[]> {
    if (!this.kv) return [];

    try {
      const leaderboardKey = `leaderboard:${roomKey}`;
      const data = (await this.kv.get(
        leaderboardKey,
        'json'
      )) as LeaderboardEntry[];
      return data || [];
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }

  async updateGlobalLeaderboard(userScore: UserScore): Promise<void> {
    if (!this.kv) return;

    try {
      const globalKey = 'global_leaderboard';
      const existingData =
        ((await this.kv.get(globalKey, 'json')) as LeaderboardEntry[]) || [];

      const existingEntry = existingData.find(
        (entry) => entry.userId === userScore.userId
      );

      if (existingEntry) {
        existingEntry.totalScore += userScore.totalScore;
        existingEntry.challengesSolved += userScore.challengesSolved;
        existingEntry.averageTime =
          (existingEntry.averageTime + userScore.totalTime) / 2;
        existingEntry.efficiency = this.calculateEfficiency({
          ...userScore,
          totalScore: existingEntry.totalScore,
          challengesSolved: existingEntry.challengesSolved,
        });
      } else {
        const newEntry: LeaderboardEntry = {
          rank: 0,
          userId: userScore.userId,
          totalScore: userScore.totalScore,
          challengesSolved: userScore.challengesSolved,
          averageTime: userScore.totalTime / userScore.challengesSolved,
          efficiency: this.calculateEfficiency(userScore),
        };
        existingData.push(newEntry);
      }

      existingData.sort((a, b) => b.totalScore - a.totalScore);
      existingData.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      const MAX_ENTRIES = 100;
      const topEntries = existingData.slice(0, MAX_ENTRIES);

      await this.kv.put(globalKey, JSON.stringify(topEntries), {
        expirationTtl: 604800, // 7 days
      });
    } catch (error) {
      console.error('Error updating global leaderboard:', error);
    }
  }

  async getGlobalLeaderboard(): Promise<LeaderboardEntry[]> {
    if (!this.kv) return [];

    try {
      const data = (await this.kv.get(
        'global_leaderboard',
        'json'
      )) as LeaderboardEntry[];
      return data || [];
    } catch (error) {
      console.error('Error fetching global leaderboard:', error);
      return [];
    }
  }

  calculateEfficiency(userScore: UserScore): number {
    if (userScore.challengesSolved === 0) return 0;

    const avgTimePerChallenge =
      userScore.totalTime / userScore.challengesSolved;
    const pointsPerMinute =
      userScore.totalScore / (avgTimePerChallenge / 60000);
    const hintEfficiency = Math.max(
      0,
      1 - userScore.hintsUsed / (userScore.challengesSolved * 3)
    );

    return Math.floor(pointsPerMinute * hintEfficiency);
  }

  async checkAchievements(
    userId: string,
    userStats: UserScore,
    categoryStats?: Record<string, number>
  ): Promise<Achievement[]> {
    const newAchievements: Achievement[] = [];

    for (const achievement of ACHIEVEMENTS) {
      const hasAchievement = await this.hasAchievement(userId, achievement.id);
      if (hasAchievement) continue;

      let qualified = false;

      switch (achievement.criteria.type) {
        case 'score':
          qualified = userStats.totalScore >= achievement.criteria.value;
          break;
        case 'challenges':
          qualified = userStats.challengesSolved >= achievement.criteria.value;
          break;
        case 'speed':
          const avgTime = userStats.totalTime / userStats.challengesSolved;
          qualified = avgTime <= achievement.criteria.value * 1000;
          break;
        case 'category':
          if (categoryStats && achievement.criteria.category) {
            const categoryCount =
              categoryStats[achievement.criteria.category] || 0;
            qualified = categoryCount >= achievement.criteria.value;
          }
          break;
      }

      if (qualified) {
        newAchievements.push(achievement);
        await this.grantAchievement(userId, achievement.id);
      }
    }

    return newAchievements;
  }

  private async hasAchievement(
    userId: string,
    achievementId: string
  ): Promise<boolean> {
    if (!this.kv) return false;

    try {
      const key = `achievements:${userId}`;
      const achievements = ((await this.kv.get(key, 'json')) as string[]) || [];
      return achievements.includes(achievementId);
    } catch (error) {
      console.error('Error checking achievements:', error);
      return false;
    }
  }

  private async grantAchievement(
    userId: string,
    achievementId: string
  ): Promise<void> {
    if (!this.kv) return;

    try {
      const key = `achievements:${userId}`;
      const achievements = ((await this.kv.get(key, 'json')) as string[]) || [];

      if (!achievements.includes(achievementId)) {
        achievements.push(achievementId);
        await this.kv.put(key, JSON.stringify(achievements), {
          expirationTtl: 2592000, // 30 days
        });
      }
    } catch (error) {
      console.error('Error granting achievement:', error);
    }
  }

  async getUserStats(userId: string): Promise<UserScore | null> {
    if (!this.db) return null;

    try {
      const result = await this.db
        .prepare(
          `
        SELECT 
          user_id as userId,
          total_score as totalScore,
          challenges_solved as challengesSolved,
          total_time as totalTime,
          hints_used as hintsUsed,
          last_solve_time as lastSolveTime
        FROM user_stats 
        WHERE user_id = ?
      `
        )
        .bind(userId)
        .first();

      return (result as unknown as UserScore) || null;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return null;
    }
  }

  async updateUserStats(userId: string, score: UserScore): Promise<void> {
    if (!this.db) return;

    try {
      await this.db
        .prepare(
          `
        INSERT OR REPLACE INTO user_stats 
        (user_id, total_score, challenges_solved, total_time, hints_used, last_solve_time)
        VALUES (?, ?, ?, ?, ?, ?)
      `
        )
        .bind(
          userId,
          score.totalScore,
          score.challengesSolved,
          score.totalTime,
          score.hintsUsed,
          score.lastSolveTime || Date.now()
        )
        .run();
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  }

  getSkillLevel(totalScore: number): {
    level: number;
    title: string;
    nextLevelScore: number;
  } {
    const levels = [
      { level: 1, title: 'Novice', minScore: 0 },
      { level: 2, title: 'Apprentice', minScore: 100 },
      { level: 3, title: 'Practitioner', minScore: 300 },
      { level: 4, title: 'Expert', minScore: 800 },
      { level: 5, title: 'Master', minScore: 2000 },
      { level: 6, title: 'Grandmaster', minScore: 5000 },
    ];

    let currentLevel = levels[0];
    let nextLevel = levels[1];

    for (let i = 0; i < levels.length - 1; i++) {
      if (
        totalScore >= levels[i].minScore &&
        totalScore < levels[i + 1].minScore
      ) {
        currentLevel = levels[i];
        nextLevel = levels[i + 1];
        break;
      }
    }

    if (totalScore >= levels[levels.length - 1].minScore) {
      currentLevel = levels[levels.length - 1];
      nextLevel = currentLevel;
    }

    return {
      level: currentLevel.level,
      title: currentLevel.title,
      nextLevelScore: nextLevel.minScore,
    };
  }
}
