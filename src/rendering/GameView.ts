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
import { FallingItemState, SessionSnapshot, SessionState } from '../game/types';

export class GameView {
  private readonly app: Application<HTMLCanvasElement>;
  private readonly world: Container;
  private readonly assets: LoadedGameAssets;
  private readonly playerSprite: AnimatedSprite;
  private readonly itemSprites: Map<number, DisplayObject> = new Map<
    number,
    DisplayObject
  >();
  private lastPlayerX: number | null = null;
  private lastSessionState: SessionState | null = null;
  private playerAnimation: 'idle' | 'left' | 'right' = 'idle';
  private lastFacing: 'left' | 'right' = 'right';

  public constructor(
    app: Application<HTMLCanvasElement>,
    assets: LoadedGameAssets,
  ) {
    this.app = app;
    this.assets = assets;
    this.world = new Container();
    this.playerSprite = new AnimatedSprite([this.assets.playerIdleRight]);
    const background: Graphics = new Graphics();
    background.beginFill(0x172554);
    background.drawRect(0, 0, 800, 600);
    background.endFill();
    this.playerSprite.anchor.set(0.5, 1);
    this.playerSprite.scale.set(1.5);
    this.playerSprite.animationSpeed = 0.12;
    this.world.addChild(background, this.playerSprite);
    this.app.stage.addChild(this.world);
  }

  public render(snapshot: SessionSnapshot): void {
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
    this.itemSprites.clear();
    this.world.destroy({ children: true });
  }

  private renderItem(item: FallingItemState): void {
    let sprite: DisplayObject | undefined = this.itemSprites.get(item.id);

    if (!sprite) {
      sprite =
        item.kind === 'hazard'
          ? this.createHazard(item)
          : this.createFood(item);
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

  private createHazard(item: FallingItemState): Graphics {
    const hazard: Graphics = new Graphics();
    const center: number = item.width / 2;
    hazard.lineStyle(3, 0xfef2f2);
    hazard.beginFill(0xdc2626);
    hazard.drawPolygon([
      center,
      0,
      item.width * 0.64,
      item.height * 0.3,
      item.width,
      center,
      item.width * 0.64,
      item.height * 0.7,
      center,
      item.height,
      item.width * 0.36,
      item.height * 0.7,
      0,
      center,
      item.width * 0.36,
      item.height * 0.3,
    ]);
    hazard.endFill();
    hazard.lineStyle(4, 0xfef2f2);
    hazard.moveTo(item.width * 0.32, item.height * 0.32);
    hazard.lineTo(item.width * 0.68, item.height * 0.68);
    hazard.moveTo(item.width * 0.68, item.height * 0.32);
    hazard.lineTo(item.width * 0.32, item.height * 0.68);
    return hazard;
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
