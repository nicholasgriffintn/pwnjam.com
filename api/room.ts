declare const WebSocketPair: {
  new (): { 0: WebSocket; 1: WebSocket };
};

import type {
  DurableObjectState,
  WebSocket,
  Response as CfResponse,
} from '@cloudflare/workers-types';

import { createApiConfig } from './config';
import { AIChallengeEngine } from './ai-challenge-engine';
import { ScoringSystem } from './scoring-system';
import type { Env, RoomData, SessionInfo, BroadcastMessage } from './types';
import { CHALLENGE_CATEGORIES } from './data-model/challenge';

export class Room {
  state: DurableObjectState;
  env: Env;
  sessions: Map<WebSocket, SessionInfo>;
  config: ReturnType<typeof createApiConfig>;
  AIChallengeEngine: AIChallengeEngine;
  scoringSystem: ScoringSystem;

  defaultRoomData: RoomData = {
    key: '',
    users: [],
    moderator: '',
    connectedUsers: {},
    settings: {
      challengeCategories: Object.keys(CHALLENGE_CATEGORIES),
      difficultyLevel: 'intermediate',
      hintsEnabled: true,
      gameMode: 'practice',
      aiAssistanceLevel: 'basic',
      timeLimit: 60 * 60, // 1 hour in seconds
      scoringMultiplier: 1,
    },
    scores: {},
    challengeHistory: [],
    gameSettings: {
      isActive: false,
      currentRound: 0,
      totalRounds: 1,
    },
  };

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map();
    this.config = createApiConfig(env);
    this.AIChallengeEngine = new AIChallengeEngine(env.AI, this.config);
    this.scoringSystem = new ScoringSystem(this.config, env.DB, env.KV);

    this.state.blockConcurrencyWhile(async () => {
      let roomData = await this.state.storage.get<RoomData>('roomData');
      if (!roomData) {
        roomData = this.defaultRoomData;
        await this.state.storage.put('roomData', roomData);
      } else if (!roomData.connectedUsers) {
        roomData.connectedUsers = {};
        for (const user of roomData.users) {
          roomData.connectedUsers[user] = false;
        }
        await this.state.storage.put('roomData', roomData);
      }
    });
  }

  async fetch(request: Request): Promise<CfResponse> {
    const url = new URL(request.url);

    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader === 'websocket') {
      if (!url.searchParams.has('room') || !url.searchParams.has('name')) {
        return new Response('Missing room key or user name', {
          status: 400,
        }) as unknown as CfResponse;
      }

      const roomKey = url.searchParams.get('room');
      const userName = url.searchParams.get('name');

      if (!roomKey || !userName) {
        return new Response('Missing room key or user name', {
          status: 400,
        }) as unknown as CfResponse;
      }

      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair) as [WebSocket, WebSocket];

      await this.handleSession(server, roomKey, userName);

      // @ts-ignore
      return new Response(null, {
        status: 101,
        webSocket: client,
      } as unknown as CfResponse) as unknown as CfResponse;
    }

    if (url.pathname === '/initialize' && request.method === 'POST') {
      const { roomKey, moderator } = (await request.json()) as {
        roomKey: string;
        moderator: string;
      };

      return await this.state.blockConcurrencyWhile(async () => {
        let roomData = await this.state.storage.get<RoomData>('roomData');

        if (!roomData) {
          // TODO: Handle case where roomData is not found during initialization attempt
          // This scenario might need specific logic depending on requirements,
          // maybe return an error or proceed with initialization.
          // For now, let's assume initialization proceeds if roomData is null/undefined.
        } else if (roomData.key) {
          return new Response(
            JSON.stringify({ error: 'Room already exists' }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          ) as unknown as CfResponse;
        }

        roomData = {
          ...this.defaultRoomData,
          key: roomKey,
          users: [moderator],
          moderator,
          connectedUsers: { [moderator]: true },
          gameSettings: {
            isActive: false,
            currentRound: 0,
            totalRounds: 1,
          },
        };

        await this.state.storage.put('roomData', roomData);

        return new Response(
          JSON.stringify({
            success: true,
            room: roomData,
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        ) as unknown as CfResponse;
      });
    }

    if (url.pathname === '/join' && request.method === 'POST') {
      const { name } = (await request.json()) as { name: string };

      return await this.state.blockConcurrencyWhile(async () => {
        const roomData = await this.state.storage.get<RoomData>('roomData');

        if (!roomData || !roomData.key) {
          return new Response(JSON.stringify({ error: 'Room not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }) as unknown as CfResponse;
        }

        if (!roomData.connectedUsers) {
          roomData.connectedUsers = {};
          for (const user of roomData.users) {
            roomData.connectedUsers[user] = false;
          }
        }

        if (!roomData.users.includes(name)) {
          if (roomData.users.length >= this.config.room.maxUsersPerRoom) {
            return new Response(JSON.stringify({ error: 'Room is full' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }) as unknown as CfResponse;
          }
          roomData.users.push(name);
        }

        roomData.connectedUsers[name] = true;

        await this.state.storage.put('roomData', roomData);

        this.broadcast({
          type: 'userJoined',
          name,
          roomData,
        });

        return new Response(
          JSON.stringify({
            success: true,
            room: roomData,
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        ) as unknown as CfResponse;
      });
    }

    if (url.pathname === '/settings' && request.method === 'GET') {
      return await this.state.blockConcurrencyWhile(async () => {
        const roomData = await this.state.storage.get<RoomData>('roomData');

        if (!roomData || !roomData.key) {
          return new Response(JSON.stringify({ error: 'Room not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }) as unknown as CfResponse;
        }

        return new Response(
          JSON.stringify({
            success: true,
            settings: roomData.settings,
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        ) as unknown as CfResponse;
      });
    }

    if (url.pathname === '/settings' && request.method === 'PUT') {
      const { name, settings } = (await request.json()) as {
        name: string;
        settings: RoomData['settings'];
      };

      return await this.state.blockConcurrencyWhile(async () => {
        const roomData = await this.state.storage.get<RoomData>('roomData');

        if (!roomData || !roomData.key) {
          return new Response(JSON.stringify({ error: 'Room not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }) as unknown as CfResponse;
        }

        if (roomData.moderator !== name) {
          return new Response(
            JSON.stringify({ error: 'Only the moderator can update settings' }),
            {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            }
          ) as unknown as CfResponse;
        }

        roomData.settings = {
          ...roomData.settings,
          ...settings,
        };
        await this.state.storage.put('roomData', roomData);

        this.broadcast({
          type: 'settingsUpdated',
          settings: roomData.settings,
          roomData,
        });

        return new Response(
          JSON.stringify({
            success: true,
            settings: roomData.settings,
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        ) as unknown as CfResponse;
      });
    }

    return new Response('Not found', { status: 404 }) as unknown as CfResponse;
  }

  async handleSession(webSocket: WebSocket, roomKey: string, userName: string) {
    const session = { webSocket, roomKey, userName };
    // @ts-ignore
    this.sessions.set(webSocket, session);

    webSocket.accept();

    await this.state.blockConcurrencyWhile(async () => {
      const roomData = await this.state.storage.get<RoomData>('roomData');
      if (roomData) {
        if (!roomData.connectedUsers) {
          roomData.connectedUsers = {};
          for (const user of roomData.users) {
            roomData.connectedUsers[user] = false;
          }
        }

        if (!roomData.users.includes(userName)) {
          if (roomData.users.length >= this.config.room.maxUsersPerRoom) {
            webSocket.send(
              JSON.stringify({
                type: 'error',
                error: 'Room is full',
              })
            );
            webSocket.close();
            return;
          }
          roomData.users.push(userName);
        }

        roomData.connectedUsers[userName] = true;

        await this.state.storage.put('roomData', roomData);

        this.broadcast({
          type: 'userConnectionStatus',
          user: userName,
          isConnected: true,
          roomData,
        });
      }
    });

    const roomData = await this.state.storage.get<RoomData>('roomData');
    webSocket.send(
      JSON.stringify({
        type: 'initialize',
        roomData,
      })
    );

    webSocket.addEventListener('message', async (msg) => {
      try {
        const messageData =
          typeof msg.data === 'string'
            ? msg.data
            : new TextDecoder().decode(msg.data);
        const data = JSON.parse(messageData);

        if (data.type === 'updateSettings') {
          await this.handleUpdateSettings(userName, data.settings);
        } else if (data.type === 'startChallenge') {
          await this.handleStartChallenge(
            userName,
            data.category,
            data.difficulty
          );
        } else if (data.type === 'submitFlag') {
          await this.handleSubmitFlag(userName, data.flag);
        } else if (data.type === 'requestHint') {
          await this.handleRequestHint(userName);
        } else if (data.type === 'getLeaderboard') {
          await this.handleGetLeaderboard(userName);
        }
      } catch (err: unknown) {
        webSocket.send(
          JSON.stringify({
            type: 'error',
            error: err instanceof Error ? err.message : String(err),
          })
        );
      }
    });

    webSocket.addEventListener('close', async () => {
      this.sessions.delete(webSocket);

      const stillConnected = Array.from(this.sessions.values()).some(
        (s: SessionInfo) => s.userName === userName
      );

      if (!stillConnected) {
        await this.state.blockConcurrencyWhile(async () => {
          const roomData = await this.state.storage.get<RoomData>('roomData');

          if (roomData) {
            if (!roomData.connectedUsers) {
              roomData.connectedUsers = {};
              for (const user of roomData.users) {
                roomData.connectedUsers[user] = false;
              }
            }

            roomData.connectedUsers[userName] = false;

            await this.state.storage.put('roomData', roomData);

            this.broadcast({
              type: 'userConnectionStatus',
              user: userName,
              isConnected: false,
              roomData,
            });

            if (userName === roomData.moderator) {
              const connectedUsers = roomData.users.filter(
                (user) => roomData.connectedUsers[user]
              );

              if (connectedUsers.length > 0) {
                roomData.moderator = connectedUsers[0];
                await this.state.storage.put('roomData', roomData);

                this.broadcast({
                  type: 'newModerator',
                  name: roomData.moderator,
                  roomData,
                });
              }
            }
          }
        });
      }
    });
  }

  async handleUpdateSettings(
    userName: string,
    settings: Partial<RoomData['settings']>
  ) {
    await this.state.blockConcurrencyWhile(async () => {
      const roomData = await this.state.storage.get<RoomData>('roomData');
      if (!roomData) return;

      if (roomData.moderator !== userName) {
        return;
      }

      roomData.settings = {
        ...roomData.settings,
        ...settings,
      };
      await this.state.storage.put('roomData', roomData);

      this.broadcast({
        type: 'settingsUpdated',
        settings: roomData.settings,
        roomData,
      });
    });
  }

  async handleStartChallenge(
    userName: string,
    category?: string,
    difficulty?: number
  ) {
    await this.state.blockConcurrencyWhile(async () => {
      const roomData = await this.state.storage.get<RoomData>('roomData');
      if (!roomData) {
        return;
      }

      if (
        roomData.settings.gameMode === 'tournament' &&
        roomData.moderator !== userName
      ) {
        this.sendToUser(userName, {
          type: 'error',
          error: 'Only the moderator can start challenges in tournament mode',
        });
        return;
      }

      try {
        const challengeCategory =
          category ||
          this.selectRandomCategory(roomData.settings.challengeCategories);
        const challengeDifficulty =
          difficulty ||
          this.getDifficultyLevel(roomData.settings.difficultyLevel);

        const challenge = await this.AIChallengeEngine.generateChallenge({
          category: challengeCategory,
          difficulty: challengeDifficulty,
          previousChallenges: roomData.challengeHistory.map((c) => c.id),
          userLevel: this.getUserLevel(userName, roomData),
        });

        challenge.startTime = Date.now();
        roomData.currentChallenge = challenge;

        await this.state.storage.put('roomData', roomData);

        this.broadcast({
          type: 'challengeStarted',
          challenge,
          roomData,
        });
      } catch (error) {
        console.error('Error generating challenge:', error);
        this.sendToUser(userName, {
          type: 'error',
          error: 'Failed to generate challenge. Please try again.',
        });
      }
    });
  }

  async handleSubmitFlag(userName: string, flag: string) {
    await this.state.blockConcurrencyWhile(async () => {
      const roomData = await this.state.storage.get<RoomData>('roomData');
      if (!roomData || !roomData.currentChallenge) {
        this.sendToUser(userName, {
          type: 'error',
          error: 'No active challenge',
        });
        return;
      }

      const challenge = roomData.currentChallenge;
      challenge.attempts++;

      if (challenge.attempts > this.config.challenge.maxAttempts) {
        this.sendToUser(userName, {
          type: 'error',
          error: 'Maximum attempts exceeded',
        });
        return;
      }

      const isCorrect = this.validateFlag(flag, challenge.flag);

      if (isCorrect) {
        challenge.endTime = Date.now();
        const solveTime =
          challenge.endTime - (challenge.startTime || challenge.endTime);

        const score = this.scoringSystem.calculateScore({
          challenge,
          solveTime,
          hintsUsed: challenge.hintsUsed,
          isCollaboration: roomData.users.length > 1,
        });

        const userScore = roomData.scores[userName] || {
          userId: userName,
          totalScore: 0,
          challengesSolved: 0,
          totalTime: 0,
          hintsUsed: 0,
        };

        userScore.totalScore += score;
        userScore.challengesSolved++;
        userScore.totalTime += solveTime;
        userScore.hintsUsed += challenge.hintsUsed;
        userScore.lastSolveTime = Date.now();

        roomData.scores[userName] = userScore;
        roomData.challengeHistory.push({ ...challenge });
        roomData.currentChallenge = undefined;

        await this.state.storage.put('roomData', roomData);

        await this.scoringSystem.updateLeaderboard(roomData.key, userScore);
        await this.scoringSystem.updateGlobalLeaderboard(userScore);

        this.broadcast({
          type: 'challengeSolved',
          user: userName,
          score,
          userScore,
          roomData,
        });

        this.broadcast({
          type: 'scoreUpdated',
          user: userName,
          score: userScore,
          roomData,
        });
      } else {
        await this.state.storage.put('roomData', roomData);

        this.sendToUser(userName, {
          type: 'flagIncorrect',
          message: `Incorrect flag. ${
            this.config.challenge.maxAttempts - challenge.attempts
          } attempts remaining.`,
        });
      }
    });
  }

  async handleRequestHint(userName: string) {
    await this.state.blockConcurrencyWhile(async () => {
      const roomData = await this.state.storage.get<RoomData>('roomData');
      if (!roomData || !roomData.currentChallenge) {
        this.sendToUser(userName, {
          type: 'error',
          error: 'No active challenge',
        });
        return;
      }

      const challenge = roomData.currentChallenge;

      if (!roomData.settings.hintsEnabled) {
        this.sendToUser(userName, {
          type: 'error',
          error: 'Hints are disabled for this room',
        });
        return;
      }

      if (challenge.hintsUsed >= this.config.challenge.maxHints) {
        this.sendToUser(userName, {
          type: 'error',
          error: 'Maximum hints already used',
        });
        return;
      }

      try {
        const hint = await this.AIChallengeEngine.generateHint({
          challengeId: challenge.id,
          previousHints: challenge.hints.slice(0, challenge.hintsUsed),
          hintsUsed: challenge.hintsUsed,
        });

        challenge.hintsUsed++;
        challenge.hints[challenge.hintsUsed - 1] = hint;

        await this.state.storage.put('roomData', roomData);

        this.sendToUser(userName, {
          type: 'hintReceived',
          hint,
          hintsUsed: challenge.hintsUsed,
          maxHints: this.config.challenge.maxHints,
        });
      } catch (error) {
        console.error('Error generating hint:', error);
        this.sendToUser(userName, {
          type: 'error',
          error: 'Failed to generate hint. Please try again.',
        });
      }
    });
  }

  async handleGetLeaderboard(userName: string) {
    try {
      const roomData = await this.state.storage.get<RoomData>('roomData');
      if (!roomData) return;

      const roomLeaderboard = await this.scoringSystem.getLeaderboard(
        roomData.key
      );
      const globalLeaderboard = await this.scoringSystem.getGlobalLeaderboard();

      const MAX_LEADERBOARD_SIZE = 10;

      this.sendToUser(userName, {
        type: 'leaderboardUpdated',
        leaderboard: {
          room: roomLeaderboard,
          global: globalLeaderboard.slice(0, MAX_LEADERBOARD_SIZE),
        },
      });
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      this.sendToUser(userName, {
        type: 'error',
        error: 'Failed to fetch leaderboard',
      });
    }
  }

  private validateFlag(submitted: string, correct: string): boolean {
    return submitted.trim().toLowerCase() === correct.trim().toLowerCase();
  }

  private selectRandomCategory(categories?: string[]): string {
    const defaultCategories = [
      'web',
      'crypto',
      'pwn',
      'reverse',
      'forensics',
      'misc',
    ];
    const availableCategories =
      categories && categories.length > 0 ? categories : defaultCategories;
    return availableCategories[
      Math.floor(Math.random() * availableCategories.length)
    ];
  }

  private getDifficultyLevel(difficultyLevel?: string): number {
    const difficultyMap = {
      beginner: 1,
      intermediate: 2,
      advanced: 3,
      expert: 4,
    };
    return difficultyMap[difficultyLevel as keyof typeof difficultyMap] || 2;
  }

  private getUserLevel(userName: string, roomData: RoomData): number {
    const userScore = roomData.scores[userName];
    if (!userScore) return 1;

    const level = this.scoringSystem.getSkillLevel(userScore.totalScore);
    return level.level;
  }

  private sendToUser(userName: string, message: any) {
    for (const session of this.sessions.values()) {
      if (session.userName === userName) {
        try {
          session.webSocket.send(JSON.stringify(message));
        } catch (err) {
          // Ignore errors (the WebSocket might already be closed)
        }
      }
    }
  }

  broadcast(message: BroadcastMessage) {
    const json = JSON.stringify(message);
    for (const session of this.sessions.values()) {
      try {
        session.webSocket.send(json);
      } catch (err) {
        // Ignore errors (the WebSocket might already be closed)
      }
    }
  }
}
