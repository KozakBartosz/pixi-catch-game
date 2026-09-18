import { SessionSnapshot } from '../game/types';
import { FullscreenState } from '../rendering/GameViewport';

export class GameUI {
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
  private readonly handleStart: () => void;
  private readonly handleRestart: () => void;
  private readonly handleRetry: () => void;
  private readonly handleFullscreen: () => void;
  private readonly handlePause: () => void;
  private readonly handleResume: () => void;

  public constructor(
    onStart: () => void,
    onRestart: () => void,
    onRetry: () => void,
    onFullscreen: () => void,
    onPause: () => void,
    onResume: () => void,
  ) {
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
    this.startButton = this.requireElement<HTMLButtonElement>('#start-button');
    this.restartButton =
      this.requireElement<HTMLButtonElement>('#restart-button');
    this.fullscreenButton =
      this.requireElement<HTMLButtonElement>('#fullscreen-button');
    this.fullscreenStatus =
      this.requireElement<HTMLElement>('#fullscreen-status');
    this.handleStart = onStart;
    this.handleRestart = onRestart;
    this.handleRetry = onRetry;
    this.handleFullscreen = onFullscreen;
    this.handlePause = onPause;
    this.handleResume = onResume;
    this.startButton.addEventListener('click', this.handleStart);
    this.restartButton.addEventListener('click', this.handleRestart);
    this.retryButton.addEventListener('click', this.handleRetry);
    this.fullscreenButton.addEventListener('click', this.handleFullscreen);
    this.pauseButton.addEventListener('click', this.handlePause);
    this.resumeButton.addEventListener('click', this.handleResume);
  }

  public render(snapshot: SessionSnapshot): void {
    this.scoreElement.textContent = String(snapshot.score);
    this.livesElement.textContent = String(snapshot.lives);
    this.stageElement.textContent = String(snapshot.stage);
    this.startScreen.hidden = snapshot.state !== 'ready';
    this.gameOverScreen.hidden = snapshot.state !== 'gameOver';
    this.pauseScreen.hidden = snapshot.state !== 'paused';
    this.pauseButton.hidden = snapshot.state !== 'playing';
    this.finalScoreElement.textContent = String(snapshot.score);
  }

  public showLoading(progress: number): void {
    this.startScreen.hidden = true;
    this.startButton.disabled = true;
    this.loadingScreen.hidden = false;
    this.loadingStatus.hidden = false;
    this.loadError.hidden = true;
    this.retryButton.hidden = true;
    this.retryButton.disabled = true;
    this.loadingStatus.textContent = `Loading art… ${Math.round(
      progress * 100,
    )}%`;
  }

  public showReady(): void {
    this.loadingScreen.hidden = true;
    this.startButton.disabled = false;
  }

  public showLoadError(): void {
    this.loadingScreen.hidden = false;
    this.loadingStatus.hidden = true;
    this.loadError.hidden = false;
    this.retryButton.hidden = false;
    this.retryButton.disabled = false;
    this.retryButton.focus();
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

  public dispose(): void {
    this.startButton.removeEventListener('click', this.handleStart);
    this.restartButton.removeEventListener('click', this.handleRestart);
    this.retryButton.removeEventListener('click', this.handleRetry);
    this.fullscreenButton.removeEventListener('click', this.handleFullscreen);
    this.pauseButton.removeEventListener('click', this.handlePause);
    this.resumeButton.removeEventListener('click', this.handleResume);
  }

  private requireElement<TElement extends Element>(selector: string): TElement {
    const element: TElement | null = document.querySelector<TElement>(selector);

    if (!element) {
      throw new Error(`Missing ${selector} element`);
    }

    return element;
  }
}
