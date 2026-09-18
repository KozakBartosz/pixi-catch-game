import { Application } from 'pixi.js';
import { BoardViewport, calculateBoardViewport } from './viewportLayout';

const MAX_RENDER_RESOLUTION: number = 2;

export interface FullscreenState {
  supported: boolean;
  active: boolean;
  errorMessage: string | null;
}

export class GameViewport {
  private readonly app: Application<HTMLCanvasElement>;
  private readonly root: HTMLElement;
  private readonly boardWidth: number;
  private readonly boardHeight: number;
  private readonly onFullscreenStateChange: (state: FullscreenState) => void;
  private readonly resizeObserver: ResizeObserver;
  private layout: BoardViewport;

  public constructor(
    app: Application<HTMLCanvasElement>,
    root: HTMLElement,
    boardWidth: number,
    boardHeight: number,
    onFullscreenStateChange: (state: FullscreenState) => void,
  ) {
    this.app = app;
    this.root = root;
    this.boardWidth = boardWidth;
    this.boardHeight = boardHeight;
    this.onFullscreenStateChange = onFullscreenStateChange;
    this.layout = calculateBoardViewport(0, 0, boardWidth, boardHeight);
    this.resizeObserver = new ResizeObserver((): void => this.resize());
    this.handleFullscreenChange = this.handleFullscreenChange.bind(this);
    this.resizeObserver.observe(this.root);
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
    this.resize();
    this.emitFullscreenState();
  }

  public getLayout(): BoardViewport {
    return { ...this.layout };
  }

  public async toggleFullscreen(): Promise<void> {
    if (!this.isFullscreenSupported()) {
      this.emitFullscreenState('Fullscreen is not supported in this browser.');
      return;
    }

    try {
      if (document.fullscreenElement === this.root) {
        await document.exitFullscreen();
      } else {
        await this.root.requestFullscreen();
      }
    } catch (error: unknown) {
      const reason: string = error instanceof Error ? ` ${error.message}` : '';
      this.emitFullscreenState(`Could not change fullscreen mode.${reason}`);
    }
  }

  public dispose(): void {
    this.resizeObserver.disconnect();
    document.removeEventListener(
      'fullscreenchange',
      this.handleFullscreenChange,
    );
  }

  private resize(): void {
    const width: number = this.root.clientWidth;
    const height: number = this.root.clientHeight;
    const resolution: number = Math.min(
      Math.max(window.devicePixelRatio || 1, 1),
      MAX_RENDER_RESOLUTION,
    );
    this.app.renderer.resolution = resolution;
    this.app.renderer.resize(width, height);
    this.layout = calculateBoardViewport(
      width,
      height,
      this.boardWidth,
      this.boardHeight,
    );
    this.app.stage.scale.set(this.layout.scale);
    this.app.stage.position.set(this.layout.offsetX, this.layout.offsetY);
  }

  private handleFullscreenChange(): void {
    this.resize();
    this.emitFullscreenState();
  }

  private isFullscreenSupported(): boolean {
    return (
      document.fullscreenEnabled &&
      typeof this.root.requestFullscreen === 'function'
    );
  }

  private emitFullscreenState(errorMessage: string | null = null): void {
    this.onFullscreenStateChange({
      supported: this.isFullscreenSupported(),
      active: document.fullscreenElement === this.root,
      errorMessage,
    });
  }
}
