import type {
  DurableObjectNamespace,
  Fetcher,
} from '@cloudflare/workers-types';

export interface Env {
  // Cloudflare Workers bindings
  ROOM: DurableObjectNamespace;
  ASSETS: Fetcher;

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
}
