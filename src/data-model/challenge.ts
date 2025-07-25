export const DIFFICULTY_COLORS = {
  1: '#4CAF50', // Beginner - Green
  2: '#2196F3', // Intermediate - Blue
  3: '#FF9800', // Advanced - Orange
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

export const FALLBACK_CATEGORY_ICONS = {
  web: '🌐',
  crypto: '🔐',
  pwn: '💥',
  reverse: '🔄',
  forensics: '🔍',
  misc: '🎲',
  binary: '⚙️',
  steganography: '🖼️',
  osint: '🔍',
};

export const FALLBACK_CATEGORIES = [
  { id: 'web', label: '🌐 Web Security' },
  { id: 'crypto', label: '🔐 Cryptography' },
  { id: 'pwn', label: '💥 Binary Exploitation' },
  { id: 'reverse', label: '🔄 Reverse Engineering' },
  { id: 'forensics', label: '🔍 Digital Forensics' },
  { id: 'misc', label: '🎲 Miscellaneous' },
  { id: 'binary', label: '⚙️ Binary Analysis' },
  { id: 'osint', label: '🔍 OSINT' },
];

export function getCategoryIcon(categoryId: string): string {
  return (
    FALLBACK_CATEGORY_ICONS[
      categoryId as keyof typeof FALLBACK_CATEGORY_ICONS
    ] || '❓'
  );
}

export function getCategoryLabel(categoryId: string): string {
  const fallback = FALLBACK_CATEGORIES.find((cat) => cat.id === categoryId);
  return fallback?.label || categoryId;
}
