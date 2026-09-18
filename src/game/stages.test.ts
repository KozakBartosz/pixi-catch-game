import {
  DEFAULT_STAGE_PROGRESSION,
  getStageNumber,
  getStageSettings,
} from './stages';
import { StageSettings } from './types';

describe('stage progression', (): void => {
  it('advances exactly at each catch threshold', (): void => {
    expect(getStageNumber(0, DEFAULT_STAGE_PROGRESSION)).toBe(1);
    expect(getStageNumber(4, DEFAULT_STAGE_PROGRESSION)).toBe(1);
    expect(getStageNumber(5, DEFAULT_STAGE_PROGRESSION)).toBe(2);
    expect(getStageNumber(9, DEFAULT_STAGE_PROGRESSION)).toBe(2);
    expect(getStageNumber(10, DEFAULT_STAGE_PROGRESSION)).toBe(3);
  });

  it('caps every difficulty parameter while keeping food available', (): void => {
    const stage: StageSettings = getStageSettings(
      1000,
      DEFAULT_STAGE_PROGRESSION,
    );
    expect(stage).toMatchObject({
      number: 1000,
      fallSpeed: 420,
      spawnInterval: 0.4,
      hazardChance: 0.35,
    });
  });

  it('cycles themes without resetting difficulty', (): void => {
    const first: StageSettings = getStageSettings(1, DEFAULT_STAGE_PROGRESSION);
    const wrapped: StageSettings = getStageSettings(
      4,
      DEFAULT_STAGE_PROGRESSION,
    );
    expect(wrapped.themeId).toBe(first.themeId);
    expect(wrapped.fallSpeed).toBeGreaterThan(first.fallSpeed);
    expect(wrapped.spawnInterval).toBeLessThan(first.spawnInterval);
    expect(wrapped.hazardChance).toBeGreaterThan(first.hazardChance);
  });
});
