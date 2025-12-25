export enum BiomeType {
  DATA_WASTELAND = 'DATA_WASTELAND',
  NEON_FOREST = 'NEON_FOREST',
  SERVER_CITY = 'SERVER_CITY',
  QUANTUM_FLUX = 'QUANTUM_FLUX',
  REALITY_NODE = 'REALITY_NODE', // Special node requiring Search Grounding
}

export interface Coordinates {
  x: number;
  y: number;
}

export interface TileData {
  id: string; // "x,y"
  x: number;
  y: number;
  biome: BiomeType;
  description: string;
  explored: boolean;
  hasPuzzle: boolean;
  isSolved: boolean;
  item?: string;
  visualFeature: string; // e.g., 'tree', 'building', 'glitch'
}

export interface PlayerState {
  position: Coordinates;
  inventory: string[];
  xp: number;
  level: number;
}

export interface GameLog {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
}

export interface Puzzle {
  id: string;
  question: string;
  type: 'riddle' | 'logic' | 'reality_check';
  options?: string[]; // Multiple choice for reality checks
  answer: string; // The correct answer (or keyword)
  solved: boolean;
  groundingUrls?: Array<{title: string, uri: string}>; // If search was used
}

export type VisualEffectType = 'success' | 'interact' | 'level_up' | 'error';

export interface VisualEffect {
  id: string;
  x: number;
  y: number;
  type: VisualEffectType;
}

export interface GameState {
  player: PlayerState;
  world: Record<string, TileData>;
  logs: GameLog[];
  isGenerating: boolean;
  activePuzzle: Puzzle | null;
}