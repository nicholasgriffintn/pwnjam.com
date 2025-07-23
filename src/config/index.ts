interface Config {
  api: {
    baseUrl: string;
    wsBaseUrl: string;
  };
  app: {
    name: string;
    key: string;
    githubRepo?: string;
    environment: string;
  };
  websocket: {
    maxReconnectAttempts: number;
    reconnectBaseDelay: number;
    maxReconnectDelay: number;
  };
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = import.meta.env[key];
  if (value !== undefined) {
    return value;
  }
  if (defaultValue !== undefined) {
    return defaultValue;
  }
  throw new Error(`Environment variable ${key} is required but not defined`);
}

function createConfig(): Config {
  const isDev = import.meta.env.DEV;

  return {
    api: {
      baseUrl: getEnvVar(
        'VITE_API_BASE_URL',
        isDev ? 'http://localhost:5173/api' : 'https://pwnjam.com/api'
      ),
      wsBaseUrl: getEnvVar(
        'VITE_WS_BASE_URL',
        isDev ? 'ws://localhost:5173/ws' : 'wss://pwnjam.com/ws'
      ),
    },
    app: {
      name: getEnvVar('VITE_APP_NAME', 'PwnJam'),
      key: getEnvVar('VITE_APP_NAME', 'PwnJam')
        .toLowerCase()
        .replaceAll(' ', '_'),
      githubRepo: getEnvVar(
        'VITE_GITHUB_REPO',
        'https://github.com/nicholasgriffintn/pwnjam.com'
      ),
      environment: getEnvVar(
        'VITE_ENVIRONMENT',
        isDev ? 'development' : 'production'
      ),
    },
    websocket: {
      maxReconnectAttempts: parseInt(
        getEnvVar('VITE_MAX_RECONNECT_ATTEMPTS', '5'),
        10
      ),
      reconnectBaseDelay: parseInt(
        getEnvVar('VITE_RECONNECT_BASE_DELAY', '1000'),
        10
      ),
      maxReconnectDelay: parseInt(
        getEnvVar('VITE_MAX_RECONNECT_DELAY', '30000'),
        10
      ),
    },
  };
}

export const config = createConfig();
export default config;
