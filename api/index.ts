import type {
  ExportedHandler,
  Request as CfRequest,
  Response as CfResponse,
} from '@cloudflare/workers-types';

import { Room } from './room';
import type { Env } from './types';
import { createApiConfig } from './config';
import { ScoringSystem } from './scoring-system';

async function handleRequest(
  request: CfRequest,
  env: Env
): Promise<CfResponse> {
  const url = new URL(request.url);

  if (url.pathname.startsWith('/api/')) {
    return handleApiRequest(url, request, env);
  }

  if (url.pathname === '/ws') {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', {
        status: 400,
      }) as unknown as CfResponse;
    }

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

    const roomId = getRoomId(roomKey);

    if (!env.ROOM) {
      return new Response('Durable Object namespace not found', {
        status: 500,
      }) as unknown as CfResponse;
    }

    return env.ROOM.get(env.ROOM.idFromName(roomId)).fetch(request);
  }

  return env.ASSETS.fetch(request);
}

async function handleApiRequest(
  url: URL,
  request: CfRequest,
  env: Env
): Promise<CfResponse> {
  const config = createApiConfig(env);
  const pathWithoutPrefix = url.pathname.substring(5);

  // Create a new room
  if (pathWithoutPrefix === 'rooms' && request.method === 'POST') {
    const body = await request.json<{ name?: string }>();
    const name = body?.name;

    if (!name) {
      return new Response(JSON.stringify({ error: 'Name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }) as unknown as CfResponse;
    }

    const roomKey = generateRoomKey(config.room.keyLength);
    const roomId = getRoomId(roomKey);

    if (!env.ROOM) {
      return new Response('Durable Object namespace not found', {
        status: 500,
      }) as unknown as CfResponse;
    }

    const roomObject = env.ROOM.get(env.ROOM.idFromName(roomId));

    const response = await roomObject.fetch(
      new Request(`${config.api.dummyBaseUrl}/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomKey, moderator: name }),
      }) as unknown as CfRequest
    );

    return response;
  }

  if (pathWithoutPrefix === 'rooms/join' && request.method === 'POST') {
    const body = await request.json<{ name?: string; roomKey?: string }>();
    const name = body?.name;
    const roomKey = body?.roomKey;

    if (!name || !roomKey) {
      return new Response(
        JSON.stringify({ error: 'Name and room key are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      ) as unknown as CfResponse;
    }

    const roomId = getRoomId(roomKey);

    if (!env.ROOM) {
      return new Response('Durable Object namespace not found', {
        status: 500,
      }) as unknown as CfResponse;
    }

    const roomObject = env.ROOM.get(env.ROOM.idFromName(roomId));

    const response = await roomObject.fetch(
      new Request(`${config.api.dummyBaseUrl}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      }) as unknown as CfRequest
    );

    return response;
  }

  if (pathWithoutPrefix === 'rooms/settings' && request.method === 'GET') {
    if (!url.searchParams.has('roomKey')) {
      return new Response(JSON.stringify({ error: 'Room key is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }) as unknown as CfResponse;
    }

    const roomKey = url.searchParams.get('roomKey');

    if (!roomKey) {
      return new Response(JSON.stringify({ error: 'Room key is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }) as unknown as CfResponse;
    }

    const roomId = getRoomId(roomKey);

    if (!env.ROOM) {
      return new Response('Durable Object namespace not found', {
        status: 500,
      }) as unknown as CfResponse;
    }

    const roomObject = env.ROOM.get(env.ROOM.idFromName(roomId));

    return roomObject.fetch(
      new Request(`${config.api.dummyBaseUrl}/settings`, {
        method: 'GET',
      }) as unknown as CfRequest
    );
  }

  if (pathWithoutPrefix === 'rooms/settings' && request.method === 'PUT') {
    const body = await request.json<{
      name?: string;
      roomKey?: string;
      settings?: Record<string, unknown>;
    }>();

    const name = body?.name;
    const roomKey = body?.roomKey;
    const settings = body?.settings;

    if (!name || !roomKey || !settings) {
      return new Response(
        JSON.stringify({ error: 'Name, room key, and settings are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      ) as unknown as CfResponse;
    }

    const roomId = getRoomId(roomKey);

    if (!env.ROOM) {
      return new Response('Durable Object namespace not found', {
        status: 500,
      }) as unknown as CfResponse;
    }

    const roomObject = env.ROOM.get(env.ROOM.idFromName(roomId));

    return roomObject.fetch(
      new Request(`${config.api.dummyBaseUrl}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, settings }),
      }) as unknown as CfRequest
    );
  }

  // Global leaderboard endpoint
  if (pathWithoutPrefix === 'leaderboard' && request.method === 'GET') {
    try {
      const scoringSystem = new ScoringSystem(config, env.DB, env.KV);
      const globalLeaderboard = await scoringSystem.getGlobalLeaderboard();

      return new Response(
        JSON.stringify({
          success: true,
          leaderboard: globalLeaderboard,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      ) as unknown as CfResponse;
    } catch (error) {
      console.error('Error fetching global leaderboard:', error);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch leaderboard',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      ) as unknown as CfResponse;
    }
  }

  // User profile endpoint
  if (
    pathWithoutPrefix.startsWith('user/profile/') &&
    request.method === 'GET'
  ) {
    const userId = path.split('/')[2];

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }) as unknown as CfResponse;
    }

    try {
      const scoringSystem = new ScoringSystem(config, env.DB, env.KV);
      const userStats = await scoringSystem.getUserStats(userId);

      if (!userStats) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }) as unknown as CfResponse;
      }

      const skillLevel = scoringSystem.getSkillLevel(userStats.totalScore);

      return new Response(
        JSON.stringify({
          success: true,
          profile: {
            ...userStats,
            skillLevel,
          },
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      ) as unknown as CfResponse;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch user profile',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      ) as unknown as CfResponse;
    }
  }

  // Challenge categories endpoint
  if (
    pathWithoutPrefix === 'challenges/categories' &&
    request.method === 'GET'
  ) {
    const categories = [
      {
        id: 'web',
        name: 'Web Application Security',
        description: 'Web vulnerabilities and exploits',
      },
      {
        id: 'crypto',
        name: 'Cryptography',
        description: 'Encryption, hashing, and cryptanalysis',
      },
      {
        id: 'pwn',
        name: 'Binary Exploitation',
        description: 'Buffer overflows and binary exploits',
      },
      {
        id: 'reverse',
        name: 'Reverse Engineering',
        description: 'Analyzing and understanding binaries',
      },
      {
        id: 'forensics',
        name: 'Digital Forensics',
        description: 'Investigating digital evidence',
      },
      {
        id: 'misc',
        name: 'Miscellaneous',
        description: 'Programming, logic, and other challenges',
      },
      {
        id: 'steganography',
        name: 'Steganography',
        description: 'Hidden information in files',
      },
      {
        id: 'osint',
        name: 'Open Source Intelligence',
        description: 'Information gathering from public sources',
      },
    ];

    return new Response(
      JSON.stringify({
        success: true,
        categories,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    ) as unknown as CfResponse;
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  }) as unknown as CfResponse;
}

function generateRoomKey(keyLength: number = 6) {
  return Math.random().toString(36).substring(2, 2 + keyLength).toUpperCase();
}

function getRoomId(roomKey: string) {
  return `room-${roomKey.toLowerCase()}`;
}

export default {
  async fetch(request: CfRequest, env: Env): Promise<CfResponse> {
    return handleRequest(request, env);
  },
} satisfies ExportedHandler<Env>;

export { Room };
