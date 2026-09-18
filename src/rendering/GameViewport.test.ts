import { Application } from 'pixi.js';
import { FullscreenState, GameViewport } from './GameViewport';

// Exercise the real controller against browser API boundaries without WebGL.
describe('GameViewport fullscreen lifecycle', (): void => {
  let viewport: GameViewport;
  let fullscreenElement: HTMLElement | null;
  let supported: boolean;
  let request: jest.Mock<Promise<void>, []>;
  let changeListener: () => void;
  let states: FullscreenState[];
  let root: HTMLElement;
  const originals: Map<string, PropertyDescriptor | undefined> = new Map();
  const disconnect: jest.Mock = jest.fn();
  const removeListener: jest.Mock = jest.fn();

  beforeEach((): void => {
    for (const name of ['window', 'document', 'ResizeObserver']) {
      originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    }
    fullscreenElement = null;
    supported = true;
    states = [];
    request = jest.fn(async (): Promise<void> => {
      fullscreenElement = root;
      changeListener();
    });
    root = {
      clientWidth: 1440,
      clientHeight: 900,
      requestFullscreen: request,
    } as unknown as HTMLElement;
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { devicePixelRatio: 1 },
    });
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: {
        get fullscreenEnabled(): boolean {
          return supported;
        },
        get fullscreenElement(): HTMLElement | null {
          return fullscreenElement;
        },
        exitFullscreen: async (): Promise<void> => {
          fullscreenElement = null;
          changeListener();
        },
        addEventListener: (_name: string, listener: () => void): void => {
          changeListener = listener;
        },
        removeEventListener: removeListener,
      },
    });
    Object.defineProperty(globalThis, 'ResizeObserver', {
      configurable: true,
      value: class {
        public observe(): void {
          /* Browser observation boundary. */
        }
        public disconnect(): void {
          disconnect();
        }
      },
    });
    const app: Application<HTMLCanvasElement> = {
      renderer: { resolution: 1, resize: jest.fn() },
      stage: { scale: { set: jest.fn() }, position: { set: jest.fn() } },
    } as unknown as Application<HTMLCanvasElement>;
    viewport = new GameViewport(
      app,
      root,
      800,
      600,
      (state: FullscreenState): void => {
        states.push(state);
      },
    );
  });

  afterEach((): void => {
    viewport.dispose();
    for (const [name, descriptor] of originals) {
      if (descriptor) {
        Object.defineProperty(globalThis, name, descriptor);
      } else {
        Reflect.deleteProperty(globalThis, name);
      }
    }
    jest.clearAllMocks();
  });

  it('reflects browser-initiated exit, including Escape, through fullscreenchange', async (): Promise<void> => {
    await viewport.toggleFullscreen();
    expect(states.at(-1)?.active).toBe(true);
    fullscreenElement = null;
    changeListener();
    expect(states.at(-1)?.active).toBe(false);
  });

  it('reports a rejected request while leaving the board usable', async (): Promise<void> => {
    request.mockRejectedValueOnce(new Error('Permission denied'));
    await viewport.toggleFullscreen();
    expect(states.at(-1)).toMatchObject({
      active: false,
      errorMessage: expect.stringContaining('Permission denied'),
    });
    expect(viewport.getLayout().scale).toBe(1.5);
  });

  it('does not request unsupported fullscreen', async (): Promise<void> => {
    supported = false;
    await viewport.toggleFullscreen();
    expect(request).not.toHaveBeenCalled();
    expect(states.at(-1)?.supported).toBe(false);
  });
});
