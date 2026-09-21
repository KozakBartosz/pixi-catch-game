import { Application } from 'pixi.js';
import { GameAssets, LoadedGameAssets } from '../assets/GameAssets';
import { GameSession } from '../game/GameSession';
import { InputController } from '../input/InputController';
import { GameUI } from '../ui/GameUI';
import { GameViewport } from '../rendering/GameViewport';
import { GameAudio } from '../audio/GameAudio';
import { GameApp } from './GameApp';

jest.mock('pixi.js', (): object => ({ Application: jest.fn() }));
jest.mock('../assets/GameAssets');
jest.mock('../input/InputController');
jest.mock('../rendering/GameView');
jest.mock('../rendering/GameViewport');
jest.mock('../ui/GameUI');

describe('GameApp pause integration', (): void => {
  const shortcut: (code: string, repeat?: boolean) => Event = (
    code: string,
    repeat: boolean = false,
  ): Event => {
    const event: Event = new Event('keydown', { cancelable: true });
    Object.defineProperties(event, {
      code: { value: code },
      repeat: { value: repeat },
    });
    return event;
  };

  it('requires resume after hiding and discards the stale ticker delta', async (): Promise<void> => {
    const previousDocument: PropertyDescriptor | undefined =
      Object.getOwnPropertyDescriptor(globalThis, 'document');
    const previousWindow: PropertyDescriptor | undefined =
      Object.getOwnPropertyDescriptor(globalThis, 'window');
    const page: EventTarget & { hidden: boolean } = Object.assign(
      new EventTarget(),
      { hidden: false },
    );
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: page,
    });
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { devicePixelRatio: 1 },
    });
    const ticker: { deltaMS: number; add: jest.Mock; remove: jest.Mock } = {
      deltaMS: 16,
      add: jest.fn(),
      remove: jest.fn(),
    };
    (Application as jest.MockedClass<typeof Application>).mockImplementation(
      (): Application =>
        ({ ticker, view: {}, destroy: jest.fn() } as unknown as Application),
    );
    jest
      .spyOn(GameAssets.prototype, 'load')
      .mockResolvedValue({} as LoadedGameAssets);
    jest
      .spyOn(InputController.prototype, 'getState')
      .mockReturnValue({ left: false, right: false });
    const clearSpy: jest.SpyInstance = jest.spyOn(
      InputController.prototype,
      'clear',
    );
    const pauseSpy: jest.SpyInstance = jest.spyOn(
      GameSession.prototype,
      'pause',
    );
    const resumeSpy: jest.SpyInstance = jest.spyOn(
      GameSession.prototype,
      'resume',
    );
    const updateSpy: jest.SpyInstance = jest
      .spyOn(GameSession.prototype, 'update')
      .mockReturnValue([]);
    const app: GameApp = new GameApp({
      prepend: jest.fn(),
    } as unknown as HTMLElement);
    try {
      app.start();
      await Promise.resolve();
      const actions: ConstructorParameters<typeof GameUI> = (
        GameUI as jest.MockedClass<typeof GameUI>
      ).mock.calls[0];
      const tick: () => void = ticker.add.mock.calls[0][0] as () => void;
      actions[1].start();
      tick();
      tick();
      expect(updateSpy).toHaveBeenLastCalledWith(0.016, {
        left: false,
        right: false,
      });
      page.hidden = true;
      page.dispatchEvent(new Event('visibilitychange'));
      expect(pauseSpy).toHaveBeenCalledTimes(1);
      actions[1].resume();
      expect(resumeSpy).not.toHaveBeenCalled();
      page.hidden = false;
      page.dispatchEvent(new Event('visibilitychange'));
      expect(resumeSpy).not.toHaveBeenCalled();
      clearSpy.mockClear();
      actions[1].resume();
      expect(resumeSpy).toHaveBeenCalledTimes(1);
      expect(clearSpy).toHaveBeenCalledTimes(1);
      updateSpy.mockClear();
      ticker.deltaMS = 30000;
      tick();
      expect(updateSpy).not.toHaveBeenCalled();
      ticker.deltaMS = 16;
      tick();
      expect(updateSpy).toHaveBeenCalledWith(0.016, {
        left: false,
        right: false,
      });
      app.dispose();
      page.hidden = true;
      page.dispatchEvent(new Event('visibilitychange'));
      expect(pauseSpy).toHaveBeenCalledTimes(1);
    } finally {
      jest.restoreAllMocks();
      for (const [name, descriptor] of [
        ['document', previousDocument],
        ['window', previousWindow],
      ] as const) {
        if (descriptor) Object.defineProperty(globalThis, name, descriptor);
        else Reflect.deleteProperty(globalThis, name);
      }
    }
  });

  it('toggles pause with P and Escape without acting on repeats or after disposal', async (): Promise<void> => {
    jest.clearAllMocks();
    const previousDocument: PropertyDescriptor | undefined =
      Object.getOwnPropertyDescriptor(globalThis, 'document');
    const previousWindow: PropertyDescriptor | undefined =
      Object.getOwnPropertyDescriptor(globalThis, 'window');
    const page: EventTarget & { hidden: boolean } = Object.assign(
      new EventTarget(),
      { hidden: false },
    );
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: page,
    });
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { devicePixelRatio: 1 },
    });
    (Application as jest.MockedClass<typeof Application>).mockImplementation(
      (): Application =>
        ({
          ticker: { add: jest.fn(), remove: jest.fn() },
          view: {},
          destroy: jest.fn(),
        } as unknown as Application),
    );
    jest
      .spyOn(GameAssets.prototype, 'load')
      .mockResolvedValue({} as LoadedGameAssets);
    const pauseSpy: jest.SpyInstance = jest.spyOn(
      GameSession.prototype,
      'pause',
    );
    const resumeSpy: jest.SpyInstance = jest.spyOn(
      GameSession.prototype,
      'resume',
    );
    const app: GameApp = new GameApp({
      prepend: jest.fn(),
    } as unknown as HTMLElement);
    try {
      page.dispatchEvent(shortcut('KeyP'));
      expect(pauseSpy).not.toHaveBeenCalled();
      app.start();
      await Promise.resolve();
      const actions: ConstructorParameters<typeof GameUI> = (
        GameUI as jest.MockedClass<typeof GameUI>
      ).mock.calls[0];
      actions[1].start();
      page.dispatchEvent(shortcut('KeyP'));
      expect(pauseSpy).toHaveBeenCalledTimes(1);
      page.dispatchEvent(shortcut('KeyP', true));
      expect(resumeSpy).not.toHaveBeenCalled();
      page.dispatchEvent(shortcut('Escape'));
      expect(resumeSpy).toHaveBeenCalledTimes(1);
      page.dispatchEvent(shortcut('Escape'));
      expect(pauseSpy).toHaveBeenCalledTimes(2);
      app.dispose();
      page.dispatchEvent(shortcut('KeyP'));
      expect(resumeSpy).toHaveBeenCalledTimes(1);
    } finally {
      jest.restoreAllMocks();
      for (const [name, descriptor] of [
        ['document', previousDocument],
        ['window', previousWindow],
      ] as const) {
        if (descriptor) Object.defineProperty(globalThis, name, descriptor);
        else Reflect.deleteProperty(globalThis, name);
      }
    }
  });
});

describe('GameApp lifecycle', (): void => {
  let page: EventTarget & { hidden: boolean };
  let ticker: { deltaMS: number; add: jest.Mock; remove: jest.Mock };
  let destroy: jest.Mock;
  let load: jest.SpyInstance;
  let unload: jest.SpyInstance;
  let previousDocument: PropertyDescriptor | undefined;
  let previousWindow: PropertyDescriptor | undefined;

  beforeEach((): void => {
    jest.clearAllMocks();
    previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
    previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
    page = Object.assign(new EventTarget(), { hidden: false });
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: page,
    });
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { devicePixelRatio: 1 },
    });
    ticker = { deltaMS: 16, add: jest.fn(), remove: jest.fn() };
    destroy = jest.fn();
    (Application as jest.MockedClass<typeof Application>).mockImplementation(
      (): Application =>
        ({ ticker, view: {}, destroy } as unknown as Application),
    );
    load = jest.spyOn(GameAssets.prototype, 'load');
    unload = jest
      .spyOn(GameAssets.prototype, 'unload')
      .mockResolvedValue(undefined);
  });

  afterEach((): void => {
    jest.restoreAllMocks();
    for (const [name, descriptor] of [
      ['document', previousDocument],
      ['window', previousWindow],
    ] as const) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  });

  function createApp(): GameApp {
    return new GameApp({ prepend: jest.fn() } as unknown as HTMLElement);
  }

  it('disposes from construction and ignores later start', (): void => {
    const inputDispose: jest.SpyInstance = jest.spyOn(
      InputController.prototype,
      'dispose',
    );
    const uiDispose: jest.SpyInstance = jest.spyOn(GameUI.prototype, 'dispose');
    const viewportDispose: jest.SpyInstance = jest.spyOn(
      GameViewport.prototype,
      'dispose',
    );
    const audioDispose: jest.SpyInstance = jest.spyOn(
      GameAudio.prototype,
      'dispose',
    );
    const removeListener: jest.SpyInstance = jest.spyOn(
      page,
      'removeEventListener',
    );
    const app: GameApp = createApp();
    app.dispose();
    app.dispose();
    app.start();
    expect(ticker.remove).toHaveBeenCalledTimes(1);
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(load).not.toHaveBeenCalled();
    expect(ticker.add).not.toHaveBeenCalled();
    expect(unload).toHaveBeenCalledTimes(1);
    expect(inputDispose).toHaveBeenCalledTimes(1);
    expect(uiDispose).toHaveBeenCalledTimes(1);
    expect(viewportDispose).toHaveBeenCalledTimes(1);
    expect(audioDispose).toHaveBeenCalledTimes(1);
    expect(removeListener).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function),
    );
  });

  it('ignores late progress and success, then unloads acquired assets', async (): Promise<void> => {
    let resolve!: (value: LoadedGameAssets) => void;
    const pending: Promise<LoadedGameAssets> = new Promise(
      (yes: (value: LoadedGameAssets) => void): void => {
        resolve = yes;
      },
    );
    let progress!: (value: number) => void;
    load.mockImplementation(
      (callback: (value: number) => void): Promise<LoadedGameAssets> => {
        progress = callback;
        return pending;
      },
    );
    const app: GameApp = createApp();
    app.start();
    const actions: ConstructorParameters<typeof GameUI> = (
      GameUI as jest.MockedClass<typeof GameUI>
    ).mock.calls.slice(-1)[0];
    actions[1].retry();
    expect(load).toHaveBeenCalledTimes(1);
    app.dispose();
    app.dispose();
    app.start();
    const ui: GameUI = (
      GameUI as jest.MockedClass<typeof GameUI>
    ).mock.instances.slice(-1)[0];
    (ui.showLoading as jest.Mock).mockClear();
    progress(0.5);
    expect(ui.showLoading).not.toHaveBeenCalled();
    resolve({} as LoadedGameAssets);
    await pending;
    await Promise.resolve();
    await Promise.resolve();
    expect(ui.showReady).not.toHaveBeenCalled();
    expect(unload).toHaveBeenCalledTimes(1);
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(ticker.add).toHaveBeenCalledTimes(1);
    expect(ticker.remove).toHaveBeenCalledTimes(1);
  });

  it('ignores a rejection after disposal', async (): Promise<void> => {
    let reject!: (reason: Error) => void;
    const pending: Promise<LoadedGameAssets> = new Promise(
      (
        _yes: (value: LoadedGameAssets) => void,
        no: (reason: Error) => void,
      ): void => {
        reject = no;
      },
    );
    load.mockReturnValue(pending);
    const app: GameApp = createApp();
    app.start();
    app.dispose();
    reject(new Error('late failure'));
    await Promise.resolve();
    await Promise.resolve();
    const ui: GameUI = (
      GameUI as jest.MockedClass<typeof GameUI>
    ).mock.instances.slice(-1)[0];
    expect(ui.showLoadError).not.toHaveBeenCalled();
    expect(unload).toHaveBeenCalledTimes(1);
  });

  it('logs cleanup rejection after dispose without an unhandled rejection', async (): Promise<void> => {
    const failure: Error = new Error('unload failed');
    const pending: Promise<void> = Promise.reject(failure);
    unload.mockReturnValue(pending);
    const errorLog: jest.SpyInstance = jest
      .spyOn(console, 'error')
      .mockImplementation();
    const app: GameApp = createApp();
    app.dispose();
    await Promise.resolve();
    await Promise.resolve();
    expect(errorLog).toHaveBeenCalledWith(
      'Game asset cleanup failed.',
      failure,
    );
    expect(unload).toHaveBeenCalledTimes(1);
  });

  it('logs cleanup rejection after a load completes following dispose', async (): Promise<void> => {
    let resolveLoad!: (value: LoadedGameAssets) => void;
    const pendingLoad: Promise<LoadedGameAssets> = new Promise(
      (resolve: (value: LoadedGameAssets) => void): void => {
        resolveLoad = resolve;
      },
    );
    const failure: Error = new Error('late unload failed');
    let rejectUnload!: (reason: Error) => void;
    const pendingUnload: Promise<void> = new Promise(
      (_resolve: () => void, reject: (reason: Error) => void): void => {
        rejectUnload = reject;
      },
    );
    load.mockReturnValue(pendingLoad);
    unload.mockReturnValue(pendingUnload);
    const errorLog: jest.SpyInstance = jest
      .spyOn(console, 'error')
      .mockImplementation();
    const app: GameApp = createApp();
    app.start();
    app.dispose();
    expect(unload).not.toHaveBeenCalled();
    resolveLoad({} as LoadedGameAssets);
    await pendingLoad;
    await Promise.resolve();
    expect(unload).toHaveBeenCalledTimes(1);
    rejectUnload(failure);
    await Promise.resolve();
    await Promise.resolve();
    expect(errorLog).toHaveBeenCalledWith(
      'Game asset cleanup failed.',
      failure,
    );
  });

  it('ignores late failure and allows an alive retry', async (): Promise<void> => {
    const failure: Error = new Error('load failed');
    load
      .mockRejectedValueOnce(failure)
      .mockResolvedValue({} as LoadedGameAssets);
    const errorLog: jest.SpyInstance = jest
      .spyOn(console, 'error')
      .mockImplementation();
    const app: GameApp = createApp();
    app.start();
    await Promise.resolve();
    await Promise.resolve();
    const actions: ConstructorParameters<typeof GameUI> = (
      GameUI as jest.MockedClass<typeof GameUI>
    ).mock.calls.slice(-1)[0];
    actions[1].retry();
    await Promise.resolve();
    await Promise.resolve();
    const ui: GameUI = (
      GameUI as jest.MockedClass<typeof GameUI>
    ).mock.instances.slice(-1)[0];
    expect(ui.showLoadError).toHaveBeenCalledTimes(1);
    expect(ui.showReady).toHaveBeenCalledTimes(1);
    expect(ticker.add).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledTimes(2);
    app.dispose();
    expect(errorLog).toHaveBeenCalledTimes(1);
  });
});
