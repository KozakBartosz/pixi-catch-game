import { SessionSnapshot } from '../game/types';
import { FullscreenState } from '../rendering/GameViewport';

export interface GameUIActions {
  start: () => void;
  restart: () => void;
  retry: () => void;
  fullscreen: () => void;
  pause: () => void;
  resume: () => void;
  mute: () => void;
}

type ScreenState =
  | 'loading'
  | 'loadError'
  | 'ready'
  | 'playing'
  | 'paused'
  | 'gameOver';

export class GameUI {
  private screenState: ScreenState = 'loading';
  private readonly root: HTMLElement;
  private readonly resultAnnouncement: HTMLElement;
  private readonly scoreElement: HTMLElement;
  private readonly livesElement: HTMLElement;
  private readonly stageElement: HTMLElement;
  private readonly startScreen: HTMLElement;
  private readonly loadingScreen: HTMLElement;
  private readonly loadingStatus: HTMLElement;
  private readonly loadError: HTMLElement;
  private readonly retryButton: HTMLButtonElement;
  private readonly gameOverScreen: HTMLElement;
  private readonly pauseScreen: HTMLElement;
  private readonly pauseButton: HTMLButtonElement;
  private readonly resumeButton: HTMLButtonElement;
  private readonly finalScoreElement: HTMLElement;
  private readonly startButton: HTMLButtonElement;
  private readonly restartButton: HTMLButtonElement;
  private readonly fullscreenButton: HTMLButtonElement;
  private readonly fullscreenStatus: HTMLElement;
  private readonly muteButton: HTMLButtonElement;
  private readonly damageFlash: HTMLElement;
  private damageFlashSeconds: number = 0;
  private readonly handleStart: () => void;
  private readonly handleRestart: () => void;
  private readonly handleRetry: () => void;
  private readonly handleFullscreen: () => void;
  private readonly handlePause: () => void;
  private readonly handleResume: () => void;
  private readonly handleMute: () => void;

  public constructor(root: HTMLElement, actions: GameUIActions) {
    this.root = root;
    this.scoreElement = this.requireElement<HTMLElement>('#score');
    this.livesElement = this.requireElement<HTMLElement>('#lives');
    this.stageElement = this.requireElement<HTMLElement>('#stage');
    this.startScreen = this.requireElement<HTMLElement>('#start-screen');
    this.loadingScreen = this.requireElement<HTMLElement>('#loading-screen');
    this.loadingStatus = this.requireElement<HTMLElement>('#loading-status');
    this.loadError = this.requireElement<HTMLElement>('#load-error');
    this.retryButton = this.requireElement<HTMLButtonElement>('#retry-button');
    this.gameOverScreen = this.requireElement<HTMLElement>('#game-over-screen');
    this.pauseScreen = this.requireElement<HTMLElement>('#pause-screen');
    this.pauseButton = this.requireElement<HTMLButtonElement>('#pause-button');
    this.resumeButton =
      this.requireElement<HTMLButtonElement>('#resume-button');
    this.finalScoreElement = this.requireElement<HTMLElement>('#final-score');
    this.resultAnnouncement = this.requireElement<HTMLElement>(
      '#result-announcement',
    );
    this.startButton = this.requireElement<HTMLButtonElement>('#start-button');
    this.restartButton =
      this.requireElement<HTMLButtonElement>('#restart-button');
    this.fullscreenButton =
      this.requireElement<HTMLButtonElement>('#fullscreen-button');
    this.fullscreenStatus =
      this.requireElement<HTMLElement>('#fullscreen-status');
    this.muteButton = this.requireElement<HTMLButtonElement>('#mute-button');
    this.damageFlash = this.requireElement<HTMLElement>('#damage-flash');
    this.handleStart = actions.start;
    this.handleRestart = actions.restart;
    this.handleRetry = actions.retry;
    this.handleFullscreen = actions.fullscreen;
    this.handlePause = actions.pause;
    this.handleResume = actions.resume;
    this.handleMute = actions.mute;
    this.startButton.addEventListener('click', this.handleStart);
    this.restartButton.addEventListener('click', this.handleRestart);
    this.retryButton.addEventListener('click', this.handleRetry);
    this.fullscreenButton.addEventListener('click', this.handleFullscreen);
    this.pauseButton.addEventListener('click', this.handlePause);
    this.resumeButton.addEventListener('click', this.handleResume);
    this.muteButton.addEventListener('click', this.handleMute);
  }

  public render(snapshot: SessionSnapshot): void {
    this.setTextIfChanged(this.scoreElement, String(snapshot.score));
    this.setTextIfChanged(this.livesElement, String(snapshot.lives));
    this.setTextIfChanged(this.stageElement, String(snapshot.stage));
    this.setTextIfChanged(this.finalScoreElement, String(snapshot.score));
    this.transition(snapshot.state, snapshot.score);
  }

  private setTextIfChanged(element: HTMLElement, value: string): void {
    if (element.textContent !== value) element.textContent = value;
  }

  public showLoading(progress: number): void {
    this.startButton.disabled = true;
    this.loadingStatus.hidden = false;
    this.loadError.hidden = true;
    this.retryButton.hidden = true;
    this.retryButton.disabled = true;
    this.loadingStatus.textContent = `Loading art… ${Math.round(
      progress * 100,
    )}%`;
    this.transition('loading');
  }

  public showReady(): void {
    this.startButton.disabled = false;
    this.transition('ready');
  }

  public showLoadError(): void {
    this.loadingStatus.hidden = true;
    this.loadError.hidden = false;
    this.retryButton.hidden = false;
    this.retryButton.disabled = false;
    this.transition('loadError');
  }

  private transition(next: ScreenState, score: number = 0): void {
    if (next === this.screenState) return;
    this.screenState = next;
    this.loadingScreen.hidden = next !== 'loading' && next !== 'loadError';
    this.startScreen.hidden = next !== 'ready';
    this.pauseScreen.hidden = next !== 'paused';
    this.gameOverScreen.hidden = next !== 'gameOver';
    this.pauseButton.hidden = next !== 'playing';
    if (next === 'gameOver') {
      this.resultAnnouncement.textContent = `Game over. Final score: ${score}.`;
    } else if (this.resultAnnouncement.textContent) {
      this.resultAnnouncement.textContent = '';
    }
    const destination: HTMLElement | null = {
      loading: this.loadingStatus,
      loadError: this.retryButton,
      ready: this.startButton,
      playing: this.pauseButton,
      paused: this.resumeButton,
      gameOver: this.restartButton,
    }[next];
    destination?.focus();
  }

  public setFullscreenState(state: FullscreenState): void {
    this.fullscreenButton.hidden = !state.supported;
    this.fullscreenButton.textContent = state.active
      ? 'Exit fullscreen'
      : 'Fullscreen';
    this.fullscreenButton.setAttribute('aria-pressed', String(state.active));
    this.fullscreenStatus.textContent = state.errorMessage ?? '';
    this.fullscreenStatus.hidden = !state.errorMessage;
  }

  public setMuted(muted: boolean): void {
    this.muteButton.textContent = muted ? 'Sound off' : 'Sound on';
    this.muteButton.setAttribute('aria-pressed', String(muted));
  }

  public showDamageFlash(): void {
    this.damageFlashSeconds = 0.18;
    this.damageFlash.hidden = false;
  }

  public advanceDamageFlash(dtSeconds: number): void {
    this.damageFlashSeconds = Math.max(
      0,
      this.damageFlashSeconds - Math.min(Math.max(dtSeconds, 0), 0.1),
    );
    if (this.damageFlashSeconds === 0) this.damageFlash.hidden = true;
  }

  public clearDamageFlash(): void {
    this.damageFlashSeconds = 0;
    this.damageFlash.hidden = true;
  }

  public dispose(): void {
    this.startButton.removeEventListener('click', this.handleStart);
    this.restartButton.removeEventListener('click', this.handleRestart);
    this.retryButton.removeEventListener('click', this.handleRetry);
    this.fullscreenButton.removeEventListener('click', this.handleFullscreen);
    this.pauseButton.removeEventListener('click', this.handlePause);
    this.resumeButton.removeEventListener('click', this.handleResume);
    this.muteButton.removeEventListener('click', this.handleMute);
  }

  private requireElement<TElement extends Element>(selector: string): TElement {
    const element: TElement | null =
      this.root.querySelector<TElement>(selector);

    if (!element) {
      throw new Error(`Missing ${selector} element`);
    }

    return element;
  }
}
