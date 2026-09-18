import { Application } from 'pixi.js';
import { GameAssets, LoadedGameAssets } from '../assets/GameAssets';
import { DEFAULT_GAME_CONFIG, GameSession } from '../game/GameSession';
import { GameplayEvent, SessionSnapshot } from '../game/types';
import { InputController } from '../input/InputController';
import { GameView } from '../rendering/GameView';
import { FullscreenState, GameViewport } from '../rendering/GameViewport';
import { GameUI } from '../ui/GameUI';
import { GameAudio } from '../audio/GameAudio';

export class GameApp {
  private readonly pixiApp: Application<HTMLCanvasElement>;
  private readonly session: GameSession;
  private readonly input: InputController;
  private readonly assets: GameAssets;
  private view: GameView | null = null;
  private readonly ui: GameUI;
  private readonly viewport: GameViewport;
  private readonly audio: GameAudio;
  private readonly tick: () => void;
  private readonly handleVisibilityChange: () => void;
  private started: boolean = false;
  private assetsReady: boolean = false;
  private loadAttempt: number = 0;
  private skipNextUpdate: boolean = true;

  public constructor(root: HTMLElement) {
    this.pixiApp = new Application<HTMLCanvasElement>({
      background: '#172554',
      width: DEFAULT_GAME_CONFIG.boardWidth,
      height: DEFAULT_GAME_CONFIG.boardHeight,
      antialias: false,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
    });
    this.session = new GameSession();
    this.assets = new GameAssets();
    this.audio = new GameAudio();
    this.ui = new GameUI(
      (): void => this.handleStart(),
      (): void => this.handleRestart(),
      (): void => void this.loadAssets(),
      (): void => void this.viewport.toggleFullscreen(),
      (): void => this.handlePause(),
      (): void => this.handleResume(),
      (): void => this.handleMute(),
    );
    this.viewport = new GameViewport(
      this.pixiApp,
      root,
      DEFAULT_GAME_CONFIG.boardWidth,
      DEFAULT_GAME_CONFIG.boardHeight,
      (state: FullscreenState): void => this.ui.setFullscreenState(state),
    );
    this.input = new InputController(
      this.pixiApp.view,
      (): ReturnType<GameViewport['getLayout']> => this.viewport.getLayout(),
    );
    this.tick = (): void => this.update(this.pixiApp.ticker.deltaMS / 1000);
    this.handleVisibilityChange = (): void => {
      if (document.hidden) {
        this.handlePause();
      }
    };
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    root.prepend(this.pixiApp.view);
    this.ui.showLoading(0);
  }

  public start(): void {
    if (this.started) {
      return;
    }

    this.started = true;
    this.pixiApp.ticker.add(this.tick);
    void this.loadAssets();
  }

  public dispose(): void {
    if (!this.started) {
      return;
    }

    this.started = false;
    this.pixiApp.ticker.remove(this.tick);
    this.input.dispose();
    this.ui.dispose();
    this.viewport.dispose();
    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange,
    );
    this.view?.dispose();
    this.view = null;
    void this.assets.unload();
    void this.audio.dispose();
    this.pixiApp.destroy(true);
  }

  private handlePause(): void {
    if (this.session.getSnapshot().state !== 'playing') {
      return;
    }

    this.session.pause();
    this.input.clear();
    this.render();
  }

  private handleResume(): void {
    if (document.hidden || this.session.getSnapshot().state !== 'paused') {
      return;
    }

    this.skipNextUpdate = true;
    this.input.clear();
    this.session.resume();
    this.render();
  }

  private handleStart(): void {
    if (!this.assetsReady || !this.view) {
      return;
    }

    this.skipNextUpdate = true;
    this.session.start();
    void this.audio.unlock();
    this.input.clear();
    this.view.resetFeedback();
    this.view.resetBackground();
    this.render();
  }

  private handleRestart(): void {
    if (!this.assetsReady || !this.view) {
      return;
    }

    this.skipNextUpdate = true;
    this.session.restart();
    void this.audio.unlock();
    this.input.clear();
    this.view.resetFeedback();
    this.view.resetBackground();
    this.render();
  }

  private handleMute(): void {
    this.audio.setMuted(!this.audio.isMuted());
    this.ui.setMuted(this.audio.isMuted());
  }

  private update(dtSeconds: number): void {
    // A resumed RAF may include time spent in a hidden/throttled tab.
    if (this.skipNextUpdate) {
      this.skipNextUpdate = false;
      return;
    }

    const events: GameplayEvent[] = this.session.update(
      dtSeconds,
      this.input.getState(),
    );
    const snapshot: SessionSnapshot = this.session.getSnapshot();

    this.audio.handle(events);
    this.view?.handleEvents(events);
    if (snapshot.state === 'playing') {
      this.view?.advanceBackground(dtSeconds);
      this.view?.advanceEffects(dtSeconds);
    }

    if (events.length > 0 || snapshot.state === 'playing') {
      this.render(snapshot);
    }
  }

  private render(snapshot: SessionSnapshot = this.session.getSnapshot()): void {
    this.view?.render(snapshot);
    this.ui.render(snapshot);
  }

  private async loadAssets(): Promise<void> {
    const attempt: number = ++this.loadAttempt;
    this.assetsReady = false;
    this.ui.showLoading(0);

    try {
      const assets: LoadedGameAssets = await this.assets.load(
        (progress: number): void => {
          if (attempt === this.loadAttempt) {
            this.ui.showLoading(progress);
          }
        },
      );

      if (!this.started || attempt !== this.loadAttempt) {
        return;
      }

      this.view?.dispose();
      this.view = new GameView(
        this.pixiApp,
        assets,
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ??
          false,
      );
      this.assetsReady = true;
      this.render();
      this.ui.showReady();
    } catch (error: unknown) {
      if (attempt === this.loadAttempt) {
        this.assetsReady = false;
        console.error('Required game assets failed to load.', error);
        this.ui.showLoadError();
      }
    }
  }
}
