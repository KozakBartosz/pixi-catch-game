import { Application } from 'pixi.js';
import { GameAssets, LoadedGameAssets } from '../assets/GameAssets';
import { GameSession } from '../game/GameSession';
import { InputController } from '../input/InputController';
import { GameUI } from '../ui/GameUI';
import { GameApp } from './GameApp';

jest.mock('pixi.js', (): object => ({ Application: jest.fn() }));
jest.mock('../assets/GameAssets');
jest.mock('../input/InputController');
jest.mock('../rendering/GameView');
jest.mock('../rendering/GameViewport');
jest.mock('../ui/GameUI');

describe('GameApp pause integration', (): void => {
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
      actions[0]();
      tick();
      tick();
      expect(updateSpy).toHaveBeenLastCalledWith(0.016, {
        left: false,
        right: false,
      });
      page.hidden = true;
      page.dispatchEvent(new Event('visibilitychange'));
      expect(pauseSpy).toHaveBeenCalledTimes(1);
      actions[5]();
      expect(resumeSpy).not.toHaveBeenCalled();
      page.hidden = false;
      page.dispatchEvent(new Event('visibilitychange'));
      expect(resumeSpy).not.toHaveBeenCalled();
      clearSpy.mockClear();
      actions[5]();
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
});
