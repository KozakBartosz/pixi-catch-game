import { GameAudio } from './GameAudio';

describe('GameAudio', (): void => {
  it('tracks mute state without requiring an audio device', (): void => {
    const audio: GameAudio = new GameAudio();
    expect(audio.isMuted()).toBe(false);
    audio.setMuted(true);
    expect(audio.isMuted()).toBe(true);
  });

  it('treats unavailable audio as an optional feature', async (): Promise<void> => {
    const audio: GameAudio = new GameAudio();
    await expect(audio.unlock()).resolves.toBeUndefined();
    expect((): void => audio.handle([])).not.toThrow();
    await expect(audio.dispose()).resolves.toBeUndefined();
  });

  it('isolates a rejected audio context close during disposal', async (): Promise<void> => {
    class RejectingAudioContext {
      public readonly state: AudioContextState = 'running';

      public close(): Promise<void> {
        return Promise.reject(new Error('Audio device close failed'));
      }
    }

    const originalWindowDescriptor: PropertyDescriptor | undefined =
      Object.getOwnPropertyDescriptor(globalThis, 'window');
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        AudioContext: RejectingAudioContext as unknown as typeof AudioContext,
      },
    });

    try {
      const audio: GameAudio = new GameAudio();
      await audio.unlock();
      await expect(audio.dispose()).resolves.toBeUndefined();
    } finally {
      if (originalWindowDescriptor) {
        Object.defineProperty(globalThis, 'window', originalWindowDescriptor);
      } else {
        Reflect.deleteProperty(globalThis, 'window');
      }
    }
  });
});
