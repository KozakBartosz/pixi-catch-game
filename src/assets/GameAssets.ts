import { Assets, SCALE_MODES, Texture } from 'pixi.js';
import { ASSET_MANIFEST, REQUIRED_ASSET_URLS } from './assetManifest';

export interface LoadedGameAssets {
  playerIdleLeft: Texture;
  playerIdleRight: Texture;
  playerRunLeft: Texture[];
  playerRunRight: Texture[];
  food: Texture[];
}

export class GameAssets {
  private readonly loadedUrls: Set<string> = new Set<string>();

  public async load(
    onProgress: (progress: number) => void,
  ): Promise<LoadedGameAssets> {
    const loadResults: PromiseSettledResult<Texture>[] =
      await Promise.allSettled(
        REQUIRED_ASSET_URLS.map(async (url: string): Promise<Texture> => {
          const texture: Texture = await Assets.load<Texture>(url);
          this.loadedUrls.add(url);
          onProgress(this.loadedUrls.size / REQUIRED_ASSET_URLS.length);
          return texture;
        }),
      );
    const failedLoad: PromiseRejectedResult | undefined = loadResults.find(
      (
        result: PromiseSettledResult<Texture>,
      ): result is PromiseRejectedResult => result.status === 'rejected',
    );

    if (failedLoad) {
      await this.unload();
      throw failedLoad.reason;
    }

    try {
      const assets: LoadedGameAssets = {
        playerIdleLeft: this.getTexture(ASSET_MANIFEST.player.idleLeft),
        playerIdleRight: this.getTexture(ASSET_MANIFEST.player.idleRight),
        playerRunLeft: this.getTextures(ASSET_MANIFEST.player.runLeft),
        playerRunRight: this.getTextures(ASSET_MANIFEST.player.runRight),
        food: this.getTextures(ASSET_MANIFEST.food),
      };
      this.setNearestScaleMode(assets);
      return assets;
    } catch (error: unknown) {
      await this.unload();
      throw error;
    }
  }

  public async unload(): Promise<void> {
    if (this.loadedUrls.size === 0) {
      return;
    }

    const urls: string[] = [...this.loadedUrls];
    this.loadedUrls.clear();
    await Promise.all(
      urls.map(async (url: string): Promise<void> => Assets.unload(url)),
    );
  }

  private getTextures(urls: readonly string[]): Texture[] {
    return urls.map((url: string): Texture => this.getTexture(url));
  }

  private getTexture(url: string): Texture {
    return Assets.get<Texture>(url);
  }

  private setNearestScaleMode(assets: LoadedGameAssets): void {
    const textures: Texture[] = [
      assets.playerIdleLeft,
      assets.playerIdleRight,
      ...assets.playerRunLeft,
      ...assets.playerRunRight,
      ...assets.food,
    ];

    for (const texture of textures) {
      texture.baseTexture.scaleMode = SCALE_MODES.NEAREST;
    }
  }
}
