import type {
  DurableObjectNamespace,
  Fetcher,
  D1Database,
  KVNamespace,
  Ai,
} from '@cloudflare/workers-types';

export interface BroadcastMessage {
  type: string;
  [key: string]: unknown;
}

export interface SessionInfo {
  webSocket: WebSocket;
  roomKey: string;
  userName: string;
}

export interface Env {
  // Cloudflare Workers bindings
  ROOM: DurableObjectNamespace;
  ASSETS: Fetcher;
  AI: Ai;
  DB: D1Database;
  KV: KVNamespace;

  // Application configuration
  APP_NAME?: string;
  ENVIRONMENT?: string;
  APP_VERSION?: string;

  // Room configuration
  ROOM_KEY_LENGTH?: string;
  MAX_USERS_PER_ROOM?: string;
  ROOM_TIMEOUT_MINUTES?: string;
  MAX_ROOMS_PER_IP?: string;

  // Security configuration
  CORS_ORIGINS?: string;
  RATE_LIMIT_MAX_REQUESTS?: string;
  RATE_LIMIT_WINDOW_MS?: string;
  JWT_SECRET?: string;

  // WebSocket configuration
  WS_HEARTBEAT_INTERVAL?: string;
  WS_CONNECTION_TIMEOUT?: string;
  MAX_CONNECTIONS_PER_ROOM?: string;

  // API configuration
  API_DUMMY_BASE_URL?: string;

  // CTF Challenge configuration
  CHALLENGE_TIMEOUT_MINUTES?: string;
  MAX_HINTS_PER_CHALLENGE?: string;
  BASE_CHALLENGE_POINTS?: string;
  TIME_BONUS_MULTIPLIER?: string;
  HINT_PENALTY_POINTS?: string;
  MAX_CHALLENGE_ATTEMPTS?: string;
  COLLABORATION_BONUS_MULTIPLIER?: string;
  DIFFICULTY_POINT_MULTIPLIERS?: string;

  // AI configuration
  AI_MODEL_TEXT?: string;
  AI_MODEL_CODE?: string;
}
