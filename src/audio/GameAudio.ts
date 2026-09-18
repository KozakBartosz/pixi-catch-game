import { GameplayEvent } from '../game/types';

type AudioContextConstructor = typeof AudioContext;

export class GameAudio {
  private context: AudioContext | null = null;
  private muted: boolean = false;

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
  }

  public async unlock(): Promise<void> {
    try {
      if (this.context === null) {
        const Context: AudioContextConstructor | undefined =
          window.AudioContext ??
          (
            window as typeof window & {
              webkitAudioContext?: AudioContextConstructor;
            }
          ).webkitAudioContext;
        if (!Context) return;
        this.context = new Context();
      }
      if (this.context.state === 'suspended') await this.context.resume();
    } catch {
      this.context = null;
    }
  }

  public handle(events: readonly GameplayEvent[]): void {
    if (
      this.muted ||
      this.context === null ||
      this.context.state !== 'running'
    ) {
      return;
    }
    for (const event of events) {
      try {
        if (event.type === 'itemCaught') this.tone(660, 0.07, 0.055, 'sine');
        else if (event.type === 'lifeLost')
          this.tone(130, 0.16, 0.08, 'square');
        else if (event.type === 'stageChanged')
          this.tone(880, 0.18, 0.06, 'triangle');
      } catch {
        // Audio is optional. A device failure must not interrupt gameplay.
      }
    }
  }

  public async dispose(): Promise<void> {
    const context: AudioContext | null = this.context;
    this.context = null;
    if (!context) return;

    try {
      await context.close();
    } catch {
      // Audio is optional. Cleanup failure must not become an unhandled rejection.
    }
  }

  private tone(
    frequency: number,
    duration: number,
    volume: number,
    type: OscillatorType,
  ): void {
    const context: AudioContext = this.context as AudioContext;
    const oscillator: OscillatorNode = context.createOscillator();
    const gain: GainNode = context.createGain();
    const now: number = context.currentTime;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }
}
