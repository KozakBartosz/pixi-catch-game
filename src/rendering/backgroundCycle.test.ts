import {
  BACKGROUND_TRANSITION_SECONDS,
  BackgroundOpacity,
  getBackgroundOpacity,
} from './backgroundCycle';

describe('background cycle', (): void => {
  it.each([
    [0, { crossfade: 0, night: 0 }],
    [20, { crossfade: 1, night: 0 }],
    [40, { crossfade: 1, night: 1 }],
    [60, { crossfade: 1, night: 0 }],
    [80, { crossfade: 0, night: 0 }],
  ])(
    'uses the expected layers at %s seconds',
    (elapsedSeconds: number, expected: BackgroundOpacity): void => {
      expect(
        getBackgroundOpacity(elapsedSeconds, BACKGROUND_TRANSITION_SECONDS),
      ).toEqual(expected);
    },
  );

  it('crossfades halfway through every transition', (): void => {
    expect(getBackgroundOpacity(10)).toEqual({ crossfade: 0.5, night: 0 });
    expect(getBackgroundOpacity(30)).toEqual({ crossfade: 1, night: 0.5 });
    expect(getBackgroundOpacity(50)).toEqual({ crossfade: 1, night: 0.5 });
    expect(getBackgroundOpacity(70)).toEqual({ crossfade: 0.5, night: 0 });
  });
});
