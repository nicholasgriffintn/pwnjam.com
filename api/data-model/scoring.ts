import type { Achievement } from '../types';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Solve your first challenge',
    icon: '🩸',
    criteria: { type: 'challenges', value: 1 },
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Solve a challenge in under 5 minutes',
    icon: '⚡',
    criteria: { type: 'speed', value: 300 },
  },
  {
    id: 'crypto_master',
    name: 'Crypto Master',
    description: 'Solve 5 cryptography challenges',
    icon: '🔐',
    criteria: { type: 'category', value: 5, category: 'crypto' },
  },
  {
    id: 'web_warrior',
    name: 'Web Warrior',
    description: 'Solve 5 web challenges',
    icon: '🌐',
    criteria: { type: 'category', value: 5, category: 'web' },
  },
  {
    id: 'thousand_points',
    name: 'Point Collector',
    description: 'Reach 1000 total points',
    icon: '💯',
    criteria: { type: 'score', value: 1000 },
  },
];
