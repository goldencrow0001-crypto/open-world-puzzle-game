import { BiomeType } from './types';

export const TILE_SIZE = 64; // pixels
export const VIEWPORT_RADIUS = 4; // How many tiles to show around player

export const BIOME_COLORS: Record<BiomeType, string> = {
  [BiomeType.DATA_WASTELAND]: 'bg-slate-800 border-slate-700',
  [BiomeType.NEON_FOREST]: 'bg-emerald-900/40 border-emerald-500/30',
  [BiomeType.SERVER_CITY]: 'bg-indigo-900/40 border-indigo-500/30',
  [BiomeType.QUANTUM_FLUX]: 'bg-fuchsia-900/40 border-fuchsia-500/30',
  [BiomeType.REALITY_NODE]: 'bg-amber-900/40 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]',
};

export const BIOME_ICONS: Record<BiomeType, string> = {
  [BiomeType.DATA_WASTELAND]: '🕸️',
  [BiomeType.NEON_FOREST]: '🎋',
  [BiomeType.SERVER_CITY]: '🏙️',
  [BiomeType.QUANTUM_FLUX]: '⚛️',
  [BiomeType.REALITY_NODE]: '👁️',
};

export const INITIAL_LOG = {
  id: 'init',
  timestamp: Date.now(),
  message: 'System Initialized. Welcome to the Cortex. Use Arrow Keys to navigate.',
  type: 'info' as const,
};

export const XP_PER_PUZZLE = 100;
export const XP_PER_LEVEL = 500;