import { StageProgressionConfig, StageSettings } from './types';

export const DEFAULT_STAGE_PROGRESSION: StageProgressionConfig = {
  catchesPerStage: 5,
  baseFallSpeed: 210,
  fallSpeedIncrease: 30,
  maximumFallSpeed: 420,
  baseSpawnInterval: 1.7,
  spawnIntervalDecrease: 0.05,
  minimumSpawnInterval: 0.4,
  baseHazardChance: 0,
  hazardChanceIncrease: 0.05,
  maximumHazardChance: 0.35,
  themeIds: ['midnight', 'sunset', 'aurora'],
};

export const getStageSettings: (
  stageNumber: number,
  config: StageProgressionConfig,
) => StageSettings = (
  stageNumber: number,
  config: StageProgressionConfig,
): StageSettings => {
  const safeStageNumber: number = Math.max(1, Math.floor(stageNumber));
  const difficultyStep: number = safeStageNumber - 1;
  const themeIndex: number = difficultyStep % config.themeIds.length;

  return {
    number: safeStageNumber,
    themeId: config.themeIds[themeIndex],
    fallSpeed: Math.min(
      config.maximumFallSpeed,
      config.baseFallSpeed + difficultyStep * config.fallSpeedIncrease,
    ),
    spawnInterval: Math.max(
      config.minimumSpawnInterval,
      config.baseSpawnInterval - difficultyStep * config.spawnIntervalDecrease,
    ),
    hazardChance: Math.min(
      config.maximumHazardChance,
      config.baseHazardChance + difficultyStep * config.hazardChanceIncrease,
    ),
  };
};

export const getStageNumber: (
  caughtFood: number,
  config: StageProgressionConfig,
) => number = (caughtFood: number, config: StageProgressionConfig): number =>
  Math.floor(caughtFood / config.catchesPerStage) + 1;
