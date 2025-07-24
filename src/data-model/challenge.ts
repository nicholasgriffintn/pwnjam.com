export const DIFFICULTY_COLORS = {
  1: '#4CAF50', // Easy - Green
  2: '#FFC107', // Medium - Yellow
  3: '#FF9800', // Hard - Orange
  4: '#F44336', // Expert - Red
  5: '#9C27B0', // Master - Purple
};

export const DIFFICULTY_LABELS = {
  1: 'Beginner',
  2: 'Intermediate',
  3: 'Advanced',
  4: 'Expert',
  5: 'Master',
};

export const CATEGORY_ICONS = {
  web: '🌐',
  crypto: '🔐',
  pwn: '💥',
  reverse: '🔄',
  forensics: '🔍',
  misc: '🎲',
  steganography: '🖼️',
  osint: '🔍',
};

export const ALL_CATEGORIES = [
  { id: 'web', label: '🌐 Web Security' },
  { id: 'crypto', label: '🔐 Cryptography' },
  { id: 'pwn', label: '💥 Binary Exploitation' },
  { id: 'reverse', label: '🔄 Reverse Engineering' },
  { id: 'forensics', label: '🔍 Digital Forensics' },
  { id: 'misc', label: '🎲 Miscellaneous' },
  { id: 'steganography', label: '🖼️ Steganography' },
  { id: 'osint', label: '🔍 OSINT' },
];
