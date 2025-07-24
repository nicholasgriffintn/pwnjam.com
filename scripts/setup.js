#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.join(__dirname, '..');
const ENV_EXAMPLE = path.join(PROJECT_ROOT, '.env.example');
const ENV_LOCAL_EXAMPLE = path.join(PROJECT_ROOT, '.env.local.example');
const ENV_FILE = path.join(PROJECT_ROOT, '.env');
const ENV_LOCAL_FILE = path.join(PROJECT_ROOT, '.env.local');
const WRANGLER_CONFIG = path.join(PROJECT_ROOT, 'wrangler.jsonc');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function fileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function copyFile(source, destination) {
  try {
    fs.copyFileSync(source, destination);
    return true;
  } catch (error) {
    console.error(`Error copying ${source} to ${destination}:`, error.message);
    return false;
  }
}

function updateEnvFile(filePath, updates) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    for (const [key, value] of Object.entries(updates)) {
      if (value && value.trim()) {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (content.match(regex)) {
          content = content.replace(regex, `${key}=${value}`);
        } else {
          content += `\n${key}=${value}`;
        }
      }
    }

    fs.writeFileSync(filePath, content);
    return true;
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
    return false;
  }
}

function updateWranglerConfig(apiConfig) {
  try {
    const content = fs.readFileSync(WRANGLER_CONFIG, 'utf8');
    const config = JSON.parse(
      content.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
    );

    if (!config.vars) {
      config.vars = {};
    }

    const apiVars = {
      ROOM_KEY_LENGTH: apiConfig.ROOM_KEY_LENGTH,
      MAX_USERS_PER_ROOM: apiConfig.MAX_USERS_PER_ROOM,
      CORS_ORIGINS: apiConfig.CORS_ORIGINS,
      RATE_LIMIT_MAX_REQUESTS: apiConfig.RATE_LIMIT_MAX_REQUESTS,
    };

    for (const [key, value] of Object.entries(apiVars)) {
      if (value !== undefined) {
        config.vars[key] = value;
      }
    }

    fs.writeFileSync(WRANGLER_CONFIG, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error(`Error updating ${WRANGLER_CONFIG}:`, error.message);
    return false;
  }
}

function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

async function promptForConfig() {
  console.log("\n🔧 Let's configure your PwnJam application!\n");

  const config = {};

  config.VITE_APP_NAME =
    (await question('Application name (PwnJam): ')) || 'PwnJam';

  config.VITE_GITHUB_REPO =
    (await question(
      'GitHub repository URL (https://github.com/nicholasgriffintn/pwnjam.com): '
    )) || 'https://github.com/nicholasgriffintn/pwnjam.com';

  const environment =
    (await question(
      'Environment (development/staging/production) [production]: '
    )) || 'production';
  config.VITE_ENVIRONMENT = environment;

  if (environment === 'development') {
    config.VITE_API_BASE_URL =
      (await question('API base URL (http://localhost:5173/api): ')) ||
      'http://localhost:5173/api';
    config.VITE_WS_BASE_URL =
      (await question('WebSocket base URL (ws://localhost:5173/ws): ')) ||
      'ws://localhost:5173/ws';
  } else {
    const apiUrl = await question('API base URL: ');
    if (apiUrl && validateUrl(apiUrl)) {
      config.VITE_API_BASE_URL = apiUrl;
    } else if (apiUrl) {
      console.warn('⚠️  Invalid API URL provided, using default');
    }

    const wsUrl = await question('WebSocket base URL: ');
    if (wsUrl && validateUrl(wsUrl)) {
      config.VITE_WS_BASE_URL = wsUrl;
    } else if (wsUrl) {
      console.warn('⚠️  Invalid WebSocket URL provided, using default');
    }
  }

  const maxAttempts =
    (await question('Max reconnection attempts (5): ')) || '5';
  if (!isNaN(maxAttempts) && parseInt(maxAttempts) > 0) {
    config.VITE_MAX_RECONNECT_ATTEMPTS = maxAttempts;
  }

  const baseDelay =
    (await question('Reconnection base delay in ms (1000): ')) || '1000';
  if (!isNaN(baseDelay) && parseInt(baseDelay) > 0) {
    config.VITE_RECONNECT_BASE_DELAY = baseDelay;
  }

  const maxDelay =
    (await question('Max reconnection delay in ms (30000): ')) || '30000';
  if (!isNaN(maxDelay) && parseInt(maxDelay) > 0) {
    config.VITE_MAX_RECONNECT_DELAY = maxDelay;
  }

  // CTF Configuration
  const configureCTF = await question('\n🎯 Configure CTF settings? (Y/n): ');
  if (
    configureCTF.toLowerCase() !== 'n' &&
    configureCTF.toLowerCase() !== 'no'
  ) {
    console.log(
      '\n🎯 CTF Configuration (these will be set in wrangler.jsonc):'
    );

    const challengeTimeout =
      (await question('Challenge timeout in minutes (30): ')) || '30';
    if (!isNaN(challengeTimeout) && parseInt(challengeTimeout) > 0) {
      config.CHALLENGE_TIMEOUT_MINUTES = challengeTimeout;
    }

    const maxHints = (await question('Max hints per challenge (3): ')) || '3';
    if (!isNaN(maxHints) && parseInt(maxHints) >= 0) {
      config.MAX_HINTS_PER_CHALLENGE = maxHints;
    }

    const basePoints =
      (await question('Base challenge points (100): ')) || '100';
    if (!isNaN(basePoints) && parseInt(basePoints) > 0) {
      config.BASE_CHALLENGE_POINTS = basePoints;
    }

    const timeBonusMultiplier =
      (await question('Time bonus multiplier (1.5): ')) || '1.5';
    if (!isNaN(timeBonusMultiplier) && parseFloat(timeBonusMultiplier) > 0) {
      config.TIME_BONUS_MULTIPLIER = timeBonusMultiplier;
    }

    const hintPenalty = (await question('Hint penalty points (20): ')) || '20';
    if (!isNaN(hintPenalty) && parseInt(hintPenalty) >= 0) {
      config.HINT_PENALTY_POINTS = hintPenalty;
    }

    const maxAttempts =
      (await question('Max challenge attempts (10): ')) || '10';
    if (!isNaN(maxAttempts) && parseInt(maxAttempts) > 0) {
      config.MAX_CHALLENGE_ATTEMPTS = maxAttempts;
    }

    const collaborationBonus =
      (await question('Collaboration bonus multiplier (1.2): ')) || '1.2';
    if (!isNaN(collaborationBonus) && parseFloat(collaborationBonus) > 0) {
      config.COLLABORATION_BONUS_MULTIPLIER = collaborationBonus;
    }

    const difficultyMultipliers =
      (await question('Difficulty point multipliers (1,1.5,2,3,5): ')) ||
      '1,1.5,2,3,5';
    config.DIFFICULTY_POINT_MULTIPLIERS = difficultyMultipliers;

    // AI Model Configuration
    console.log('\n🤖 AI Model Configuration:');
    const aiTextModel =
      (await question('AI text model (@cf/google/gemma-3-12b-it): ')) ||
      '@cf/google/gemma-3-12b-it';
    config.AI_MODEL_TEXT = aiTextModel;

    const aiCodeModel =
      (await question(
        'AI code model (@cf/qwen/qwen2.5-coder-32b-instruct): '
      )) || '@cf/qwen/qwen2.5-coder-32b-instruct';
    config.AI_MODEL_CODE = aiCodeModel;
  }

  // API Configuration (optional advanced settings)
  const configureApi = await question(
    '\nConfigure advanced API settings? (y/N): '
  );
  if (
    configureApi.toLowerCase() === 'y' ||
    configureApi.toLowerCase() === 'yes'
  ) {
    console.log(
      '\n🔧 API Configuration (these will be set in wrangler.jsonc):'
    );

    const roomKeyLength = (await question('Room key length (6): ')) || '6';
    if (!isNaN(roomKeyLength) && parseInt(roomKeyLength) > 0) {
      config.ROOM_KEY_LENGTH = roomKeyLength;
    }

    const maxUsersPerRoom =
      (await question('Max users per room (20): ')) || '20';
    if (!isNaN(maxUsersPerRoom) && parseInt(maxUsersPerRoom) > 0) {
      config.MAX_USERS_PER_ROOM = maxUsersPerRoom;
    }

    const corsOrigins = (await question('CORS origins (*): ')) || '*';
    config.CORS_ORIGINS = corsOrigins;

    const rateLimitMax =
      (await question('Rate limit max requests (100): ')) || '100';
    if (!isNaN(rateLimitMax) && parseInt(rateLimitMax) > 0) {
      config.RATE_LIMIT_MAX_REQUESTS = rateLimitMax;
    }
  }

  return config;
}

async function main() {
  console.log('🚀 Starter Jam Setup Script\n');

  if (!fileExists(ENV_EXAMPLE)) {
    console.error(
      "❌ .env.example file not found. Please make sure you're in the project root."
    );
    process.exit(1);
  }

  if (!fileExists(ENV_LOCAL_EXAMPLE)) {
    console.error(
      "❌ .env.local.example file not found. Please make sure you're in the project root."
    );
    process.exit(1);
  }

  const envExists = fileExists(ENV_FILE);
  const envLocalExists = fileExists(ENV_LOCAL_FILE);

  if (envExists || envLocalExists) {
    console.log('📋 Existing environment files detected:');
    if (envExists) console.log('  ✓ .env');
    if (envLocalExists) console.log('  ✓ .env.local');

    const overwrite = await question(
      '\nDo you want to overwrite existing files? (y/N): '
    );
    if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
      console.log('⏭️  Setup cancelled. Your existing files remain unchanged.');
      rl.close();
      return;
    }
  }

  const config = await promptForConfig();

  console.log('\n📝 Creating environment files...');

  if (copyFile(ENV_EXAMPLE, ENV_FILE)) {
    console.log('✓ Created .env file');
    if (Object.keys(config).length > 0) {
      if (updateEnvFile(ENV_FILE, config)) {
        console.log('✓ Updated .env with your configuration');
      }
    }
  }

  if (config.VITE_ENVIRONMENT === 'development') {
    if (copyFile(ENV_LOCAL_EXAMPLE, ENV_LOCAL_FILE)) {
      console.log('✓ Created .env.local file for development');
      if (updateEnvFile(ENV_LOCAL_FILE, config)) {
        console.log('✓ Updated .env.local with your configuration');
      }
    }
  }

  const hasApiConfig =
    config.ROOM_KEY_LENGTH ||
    config.MAX_USERS_PER_ROOM ||
    config.CORS_ORIGINS ||
    config.RATE_LIMIT_MAX_REQUESTS;

  if (hasApiConfig && fileExists(WRANGLER_CONFIG)) {
    if (updateWranglerConfig(config)) {
      console.log('✓ Updated wrangler.jsonc with API configuration');
    }
  }

  console.log('\n🎉 Setup complete!');
  console.log('\nNext steps:');
  console.log('  1. Review your .env files and adjust settings as needed');
  console.log('  2. Run `npm run dev` or `pnpm dev` to start development');
  console.log(
    '  3. Run `npm run build` or `pnpm build` to build for production'
  );

  console.log('\n📖 Configuration files:');
  console.log('  • .env - Main environment configuration');
  if (config.VITE_ENVIRONMENT === 'development') {
    console.log('  • .env.local - Local development overrides');
  }
  console.log('  • .env.example - Template for production/staging');
  console.log('  • .env.local.example - Template for local development');
  if (hasApiConfig) {
    console.log('  • wrangler.jsonc - Updated with API configuration');
  }

  console.log(
    '\n⚠️  Remember to add .env and .env.local to your .gitignore file!'
  );

  if (hasApiConfig) {
    console.log('📡 API configuration has been updated in wrangler.jsonc');
    console.log(
      '   Run `npm run deploy` or `pnpm deploy` to deploy with new settings'
    );
  }

  rl.close();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  });
}
