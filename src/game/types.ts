export type SessionState = 'ready' | 'playing' | 'paused' | 'gameOver';

export interface InputState {
  left: boolean;
  right: boolean;
  /** Logical board x-coordinate requested by an active pointer. */
  targetX?: number;
}

export interface PlayerState {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FallingItemState {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fallSpeed: number;
}

export interface SessionSnapshot {
  state: SessionState;
  score: number;
  lives: number;
  caughtFood: number;
  stage: number;
  themeId: string;
  player: PlayerState;
  items: FallingItemState[];
}

export type GameplayEvent =
  | {
      type: 'itemCaught';
      itemId: number;
      score: number;
      x: number;
      y: number;
    }
  | {
      type: 'lifeLost';
      itemId: number;
      lives: number;
      x: number;
      y: number;
    }
  | { type: 'stageChanged'; stage: number; themeId: string }
  | { type: 'gameOver'; score: number };

export type RandomSource = () => number;

export interface GameConfig {
  boardWidth: number;
  boardHeight: number;
  playerWidth: number;
  playerHeight: number;
  playerBottomMargin: number;
  playerSpeed: number;
  playerAccelerationSeconds: number;
  playerDecelerationSeconds: number;
  itemSize: number;
  stages: StageProgressionConfig;
  initialSpawnDelay: number;
  startingLives: number;
  maxFrameSeconds: number;
  simulationStepSeconds: number;
}

export interface StageProgressionConfig {
  catchesPerStage: number;
  baseFallSpeed: number;
  fallSpeedIncrease: number;
  maximumFallSpeed: number;
  baseSpawnInterval: number;
  spawnIntervalDecrease: number;
  minimumSpawnInterval: number;
  themeIds: readonly string[];
}

export interface StageSettings {
  number: number;
  themeId: string;
  fallSpeed: number;
  spawnInterval: number;
}
