export interface BackgroundOpacity {
  crossfade: number;
  night: number;
}

export const BACKGROUND_TRANSITION_SECONDS: number = 20;

export function getBackgroundOpacity(
  elapsedSeconds: number,
  transitionSeconds: number = BACKGROUND_TRANSITION_SECONDS,
): BackgroundOpacity {
  const cycleDuration: number = transitionSeconds * 4;
  const cycleTime: number =
    ((elapsedSeconds % cycleDuration) + cycleDuration) % cycleDuration;
  const phase: number = Math.floor(cycleTime / transitionSeconds);
  const progress: number = (cycleTime % transitionSeconds) / transitionSeconds;

  switch (phase) {
    case 0:
      return { crossfade: progress, night: 0 };
    case 1:
      return { crossfade: 1, night: progress };
    case 2:
      return { crossfade: 1, night: 1 - progress };
    default:
      return { crossfade: 1 - progress, night: 0 };
  }
}
