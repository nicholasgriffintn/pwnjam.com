import type { Env } from '../types';

interface ApiConfig {
  app: {
    name: string;
    environment: string;
    version: string;
  };
  room: {
    keyLength: number;
    maxUsersPerRoom: number;
    timeoutMinutes: number;
    maxRoomsPerIp: number;
  };
  security: {
    corsOrigins: string[];
    rateLimitMaxRequests: number;
    rateLimitWindowMs: number;
    jwtSecret?: string;
  };
  websocket: {
    heartbeatInterval: number;
    connectionTimeout: number;
    maxConnectionsPerRoom: number;
  };
  api: {
    dummyBaseUrl: string;
  };
  challenge: {
    timeoutMinutes: number;
    maxHints: number;
    basePoints: number;
    timeBonusMultiplier: number;
    hintPenalty: number;
    maxAttempts: number;
    collaborationBonusMultiplier: number;
    difficultyPointMultipliers: number[];
  };
  ai: {
    gateway: string;
    textModel: string;
    codeModel: string;
  };
}

function getEnvVarOptional(
  env: Env,
  key: keyof Env,
  defaultValue: string
): string {
  const value = env[key];
  return value !== undefined ? String(value) : defaultValue;
}

function parseNumber(value: string, defaultValue: number): number {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

function parseStringArray(value: string, defaultValue: string[]): string[] {
  if (!value) return defaultValue;
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function parseNumberArray(value: string, defaultValue: number[]): number[] {
  if (!value) return defaultValue;
  return value
    .split(',')
    .map((s) => parseNumber(s.trim(), 0))
    .filter((n) => !isNaN(n));
}

export function createApiConfig(env: Env): ApiConfig {
  return {
    app: {
      name: getEnvVarOptional(env, 'APP_NAME' as keyof Env, 'PwnJam API'),
      environment: getEnvVarOptional(
        env,
        'ENVIRONMENT' as keyof Env,
        'production'
      ),
      version: getEnvVarOptional(env, 'APP_VERSION' as keyof Env, '1.0.0'),
    },
    room: {
      keyLength: parseNumber(
        getEnvVarOptional(env, 'ROOM_KEY_LENGTH' as keyof Env, '6'),
        6
      ),
      maxUsersPerRoom: parseNumber(
        getEnvVarOptional(env, 'MAX_USERS_PER_ROOM' as keyof Env, '20'),
        20
      ),
      timeoutMinutes: parseNumber(
        getEnvVarOptional(env, 'ROOM_TIMEOUT_MINUTES' as keyof Env, '60'),
        60
      ),
      maxRoomsPerIp: parseNumber(
        getEnvVarOptional(env, 'MAX_ROOMS_PER_IP' as keyof Env, '5'),
        5
      ),
    },
    security: {
      corsOrigins: parseStringArray(
        getEnvVarOptional(env, 'CORS_ORIGINS' as keyof Env, '*'),
        ['*']
      ),
      rateLimitMaxRequests: parseNumber(
        getEnvVarOptional(env, 'RATE_LIMIT_MAX_REQUESTS' as keyof Env, '100'),
        100
      ),
      rateLimitWindowMs: parseNumber(
        getEnvVarOptional(env, 'RATE_LIMIT_WINDOW_MS' as keyof Env, '60000'),
        60000
      ),
      jwtSecret: getEnvVarOptional(env, 'JWT_SECRET' as keyof Env, ''),
    },
    websocket: {
      heartbeatInterval: parseNumber(
        getEnvVarOptional(env, 'WS_HEARTBEAT_INTERVAL' as keyof Env, '30000'),
        30000
      ),
      connectionTimeout: parseNumber(
        getEnvVarOptional(env, 'WS_CONNECTION_TIMEOUT' as keyof Env, '60000'),
        60000
      ),
      maxConnectionsPerRoom: parseNumber(
        getEnvVarOptional(env, 'MAX_CONNECTIONS_PER_ROOM' as keyof Env, '50'),
        50
      ),
    },
    api: {
      dummyBaseUrl: getEnvVarOptional(
        env,
        'API_DUMMY_BASE_URL' as keyof Env,
        'https://internal'
      ),
    },
    challenge: {
      timeoutMinutes: parseNumber(
        getEnvVarOptional(env, 'CHALLENGE_TIMEOUT_MINUTES' as keyof Env, '30'),
        30
      ),
      maxHints: parseNumber(
        getEnvVarOptional(env, 'MAX_HINTS_PER_CHALLENGE' as keyof Env, '3'),
        3
      ),
      basePoints: parseNumber(
        getEnvVarOptional(env, 'BASE_CHALLENGE_POINTS' as keyof Env, '100'),
        100
      ),
      timeBonusMultiplier: parseNumber(
        getEnvVarOptional(env, 'TIME_BONUS_MULTIPLIER' as keyof Env, '1.5'),
        1.5
      ),
      hintPenalty: parseNumber(
        getEnvVarOptional(env, 'HINT_PENALTY_POINTS' as keyof Env, '20'),
        20
      ),
      maxAttempts: parseNumber(
        getEnvVarOptional(env, 'MAX_CHALLENGE_ATTEMPTS' as keyof Env, '10'),
        10
      ),
      collaborationBonusMultiplier: parseNumber(
        getEnvVarOptional(
          env,
          'COLLABORATION_BONUS_MULTIPLIER' as keyof Env,
          '1.2'
        ),
        1.2
      ),
      difficultyPointMultipliers: parseNumberArray(
        getEnvVarOptional(
          env,
          'DIFFICULTY_POINT_MULTIPLIERS' as keyof Env,
          '1,1.5,2,3,5'
        ),
        [1, 1.5, 2, 3, 5]
      ),
    },
    ai: {
      gateway: getEnvVarOptional(env, 'AI_GATEWAY_ID' as keyof Env, 'pwnjam'),
      textModel: getEnvVarOptional(
        env,
        'AI_MODEL_TEXT' as keyof Env,
        '@cf/google/gemma-3-12b-it'
      ),
      codeModel: getEnvVarOptional(
        env,
        'AI_MODEL_CODE' as keyof Env,
        '@cf/qwen/qwen2.5-coder-32b-instruct'
      ),
    },
  };
}

export type { ApiConfig };
