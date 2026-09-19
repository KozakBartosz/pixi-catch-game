import { Assets } from 'pixi.js';
import { GameAssets } from './GameAssets';
import { REQUIRED_ASSET_URLS } from './assetManifest';

jest.mock('pixi.js', (): object => ({
  Assets: { load: jest.fn(), unload: jest.fn(), get: jest.fn() },
  SCALE_MODES: { NEAREST: 0 },
}));

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: Error) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise: Promise<T> = new Promise<T>(
    (yes: (value: T) => void, no: (reason: Error) => void): void => {
      resolve = yes;
      reject = no;
    },
  );
  return { promise, resolve, reject };
}

describe('GameAssets cleanup', (): void => {
  afterEach((): void => {
    jest.resetAllMocks();
  });

  it('retries only the URL whose unload rejected', async (): Promise<void> => {
    (Assets.load as jest.Mock).mockResolvedValue({});
    (Assets.get as jest.Mock).mockImplementation((): object => ({
      baseTexture: { scaleMode: 0 },
    }));
    const failedUrl: string = REQUIRED_ASSET_URLS[0];
    const failure: Error = new Error('unload failed');
    const pending: ReturnType<typeof deferred<void>> = deferred<void>();
    (Assets.unload as jest.Mock).mockImplementation(
      (url: string): Promise<void> =>
        url === failedUrl ? pending.promise : Promise.resolve(),
    );
    const assets: GameAssets = new GameAssets();
    await assets.load(jest.fn());
    const cleanup: Promise<void> = assets.unload();
    expect(Assets.unload).toHaveBeenCalledTimes(REQUIRED_ASSET_URLS.length);
    pending.reject(failure);
    await expect(cleanup).rejects.toBe(failure);
    for (const url of REQUIRED_ASSET_URLS) {
      expect(Assets.unload).toHaveBeenCalledWith(url);
    }
    (Assets.unload as jest.Mock).mockResolvedValue(undefined);
    await assets.unload();
    expect(Assets.unload).toHaveBeenCalledTimes(REQUIRED_ASSET_URLS.length + 1);
    expect(Assets.unload).toHaveBeenLastCalledWith(failedUrl);
  });

  it('unloads successes after a partial failure, including a late success', async (): Promise<void> => {
    const pending: ReturnType<typeof deferred<never>>[] =
      REQUIRED_ASSET_URLS.map(() => deferred<never>());
    (Assets.load as jest.Mock).mockImplementation(
      (url: string): Promise<never> =>
        pending[REQUIRED_ASSET_URLS.indexOf(url)].promise,
    );
    (Assets.unload as jest.Mock).mockResolvedValue(undefined);
    const assets: GameAssets = new GameAssets();
    const loading: Promise<unknown> = assets
      .load(jest.fn())
      .catch((error: unknown): unknown => error);
    pending[0].resolve({} as never);
    pending[1].reject(new Error('failed'));
    await assets.unload();
    for (let index: number = 2; index < pending.length; index++)
      pending[index].resolve({} as never);
    expect(await loading).toBeInstanceOf(Error);
    expect(Assets.unload).toHaveBeenCalledWith(REQUIRED_ASSET_URLS[0]);
    expect(Assets.unload).toHaveBeenCalledWith(REQUIRED_ASSET_URLS[2]);
    expect(Assets.unload).toHaveBeenCalledTimes(REQUIRED_ASSET_URLS.length - 1);
  });
});
