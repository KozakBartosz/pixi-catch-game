import {
  AnimatedSprite,
  Application,
  Container,
  Graphics,
  DisplayObject,
  Sprite,
  Texture,
} from 'pixi.js';
import { LoadedGameAssets } from '../assets/GameAssets';
import {
  FallingItemState,
  GameplayEvent,
  SessionSnapshot,
  SessionState,
} from '../game/types';
import { BackgroundOpacity, getBackgroundOpacity } from './backgroundCycle';
import { CatchBurst } from './CatchBurst';

const THEME_TINTS: Readonly<Record<string, number>> = {
  midnight: 0x334a8a,
  sunset: 0xd97745,
  aurora: 0x3aa889,
};
const THEME_BLEND_SECONDS: number = 1.5;

export class GameView {
  private readonly app: Application<HTMLCanvasElement>;
  private readonly world: Container;
  private readonly assets: LoadedGameAssets;
  private readonly effects: Container;
  private readonly themeOverlay: Graphics;
  private readonly reducedMotion: boolean;
  private readonly crossfadeBackground: Sprite;
  private readonly nightBackground: Sprite;
  private readonly playerSprite: AnimatedSprite;
  private readonly itemSprites: Map<number, DisplayObject> = new Map<
    number,
    DisplayObject
  >();
  private lastPlayerX: number | null = null;
  private lastSessionState: SessionState | null = null;
  private playerAnimation: 'idle' | 'left' | 'right' = 'idle';
  private lastFacing: 'left' | 'right' = 'right';
  private readonly catchBursts: CatchBurst[] = [];
  private backgroundElapsedSeconds: number = 0;
  private currentThemeTint: number = THEME_TINTS.midnight;
  private targetThemeTint: number = THEME_TINTS.midnight;

  public constructor(
    app: Application<HTMLCanvasElement>,
    assets: LoadedGameAssets,
    reducedMotion: boolean = false,
  ) {
    this.app = app;
    this.assets = assets;
    this.reducedMotion = reducedMotion;
    this.world = new Container();
    this.effects = new Container();
    this.themeOverlay = new Graphics();
    this.playerSprite = new AnimatedSprite([this.assets.playerIdleRight]);
    const dayBackground: Sprite = this.createBackground(
      this.assets.backgroundDay,
    );
    this.crossfadeBackground = this.createBackground(
      this.assets.backgroundCrossfade,
    );
    this.nightBackground = this.createBackground(this.assets.backgroundNight);
    this.crossfadeBackground.alpha = 0;
    this.nightBackground.alpha = 0;
    this.themeOverlay.beginFill(0xffffff);
    this.themeOverlay.drawRect(0, 0, 800, 600);
    this.themeOverlay.endFill();
    this.themeOverlay.tint = this.currentThemeTint;
    this.themeOverlay.alpha = 0.12;
    this.playerSprite.anchor.set(0.5, 1);
    this.playerSprite.scale.set(1.5);
    this.playerSprite.animationSpeed = 0.12;
    this.world.addChild(
      dayBackground,
      this.crossfadeBackground,
      this.nightBackground,
      this.themeOverlay,
      this.playerSprite,
      this.effects,
    );
    this.app.stage.addChild(this.world);
  }

  public advanceBackground(dtSeconds: number): void {
    const step: number = Math.min(Math.max(dtSeconds, 0), 0.1);
    this.backgroundElapsedSeconds += step;
    const opacity: BackgroundOpacity = getBackgroundOpacity(
      this.backgroundElapsedSeconds,
    );
    this.crossfadeBackground.alpha = opacity.crossfade;
    this.nightBackground.alpha = opacity.night;
    const blend: number = Math.min(1, step / THEME_BLEND_SECONDS);
    this.currentThemeTint = this.blendColor(
      this.currentThemeTint,
      this.targetThemeTint,
      blend,
    );
    this.themeOverlay.tint = this.currentThemeTint;
  }

  public resetBackground(): void {
    this.backgroundElapsedSeconds = 0;
    this.crossfadeBackground.alpha = 0;
    this.nightBackground.alpha = 0;
  }

  public handleEvents(events: readonly GameplayEvent[]): void {
    for (const event of events) {
      if (event.type === 'itemCaught') this.addCatchEffect(event.x, event.y);
    }
  }

  public advanceEffects(dtSeconds: number): void {
    const step: number = Math.min(Math.max(dtSeconds, 0), 0.1);
    for (
      let index: number = this.catchBursts.length - 1;
      index >= 0;
      index -= 1
    ) {
      const burst: CatchBurst = this.catchBursts[index];
      if (burst.advance(step)) {
        this.effects.removeChild(burst.container);
        burst.container.destroy({ children: true });
        this.catchBursts.splice(index, 1);
      }
    }
  }

  public resetFeedback(): void {
    for (const burst of this.catchBursts) {
      this.effects.removeChild(burst.container);
      burst.container.destroy({ children: true });
    }
    this.catchBursts.length = 0;
  }

  public render(snapshot: SessionSnapshot): void {
    this.renderTheme(snapshot.themeId);
    this.renderPlayer(snapshot);
    const visibleIds: Set<number> = new Set<number>();

    for (const item of snapshot.items) {
      visibleIds.add(item.id);
      this.renderItem(item);
    }

    for (const [itemId, sprite] of this.itemSprites) {
      if (!visibleIds.has(itemId)) {
        this.world.removeChild(sprite);
        sprite.destroy();
        this.itemSprites.delete(itemId);
      }
    }
  }

  public dispose(): void {
    this.resetFeedback();
    this.itemSprites.clear();
    this.world.destroy({ children: true });
  }

  private renderTheme(themeId: string): void {
    this.targetThemeTint = THEME_TINTS[themeId] ?? THEME_TINTS.midnight;
  }

  private blendColor(from: number, to: number, amount: number): number {
    const channel: (shift: number) => number = (shift: number): number =>
      Math.round(
        ((from >> shift) & 0xff) * (1 - amount) +
          ((to >> shift) & 0xff) * amount,
      );
    return (channel(16) << 16) | (channel(8) << 8) | channel(0);
  }

  private addCatchEffect(x: number, y: number): void {
    const burst: CatchBurst = new CatchBurst(x, y, this.reducedMotion);
    this.effects.addChild(burst.container);
    this.catchBursts.push(burst);
  }

  private createBackground(texture: Texture): Sprite {
    const sprite: Sprite = new Sprite(texture);
    const scale: number = Math.max(800 / texture.width, 600 / texture.height);
    sprite.scale.set(scale);
    sprite.anchor.set(0.5);
    sprite.position.set(400, 300);
    return sprite;
  }

  private renderItem(item: FallingItemState): void {
    let sprite: DisplayObject | undefined = this.itemSprites.get(item.id);

    if (!sprite) {
      sprite = this.createFood(item);
      this.itemSprites.set(item.id, sprite);
      this.world.addChild(sprite);
    }

    sprite.position.set(item.x, item.y);
  }

  private createFood(item: FallingItemState): Sprite {
    const texture: Texture =
      this.assets.food[(item.id - 1) % this.assets.food.length];
    const sprite: Sprite = new Sprite(texture);
    sprite.width = item.width;
    sprite.height = item.height;
    return sprite;
  }

  private renderPlayer(snapshot: SessionSnapshot): void {
    const currentX: number = snapshot.player.x;
    if (snapshot.state === 'paused') {
      this.playerSprite.stop();
      this.playerSprite.position.set(
        snapshot.player.x + snapshot.player.width / 2,
        snapshot.player.y + snapshot.player.height,
      );
      this.lastPlayerX = currentX;
      this.lastSessionState = snapshot.state;
      return;
    }

    if (this.lastSessionState !== snapshot.state) {
      this.lastPlayerX = currentX;
    }
    const movement: number =
      this.lastPlayerX === null ? 0 : currentX - this.lastPlayerX;
    const nextAnimation: 'idle' | 'left' | 'right' =
      movement < 0 ? 'left' : movement > 0 ? 'right' : 'idle';

    if (nextAnimation !== this.playerAnimation) {
      if (nextAnimation !== 'idle') {
        this.lastFacing = nextAnimation;
      }

      const textures: Texture[] =
        nextAnimation === 'left'
          ? this.assets.playerRunLeft
          : nextAnimation === 'right'
          ? this.assets.playerRunRight
          : [
              this.lastFacing === 'left'
                ? this.assets.playerIdleLeft
                : this.assets.playerIdleRight,
            ];
      this.playerSprite.textures = textures;
      if (nextAnimation === 'idle') {
        this.playerSprite.gotoAndStop(0);
      } else {
        this.playerSprite.gotoAndPlay(0);
      }
      this.playerAnimation = nextAnimation;
    }

    this.playerSprite.position.set(
      snapshot.player.x + snapshot.player.width / 2,
      snapshot.player.y + snapshot.player.height,
    );
    this.lastPlayerX = currentX;
    this.lastSessionState = snapshot.state;
  }
}
