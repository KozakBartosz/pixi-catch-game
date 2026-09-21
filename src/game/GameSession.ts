import { rectanglesOverlap } from './collision';
import {
  DEFAULT_STAGE_PROGRESSION,
  getStageNumber,
  getStageSettings,
} from './stages';
import {
  FallingItemState,
  GameConfig,
  GameplayEvent,
  InputState,
  PlayerState,
  RandomSource,
  SessionSnapshot,
  SessionState,
  StageSettings,
} from './types';

export const DEFAULT_GAME_CONFIG: GameConfig = {
  boardWidth: 800,
  boardHeight: 600,
  // The 84 px character frames render at 1.5x. Their stable opaque body is
  // about 48-51 px wide and 120 px tall; cape, sword, and running strides
  // extend beyond this rectangle and do not catch items.
  playerWidth: 48,
  playerHeight: 120,
  playerBottomMargin: 24,
  playerSpeed: 420,
  playerAccelerationSeconds: 0.16,
  playerDecelerationSeconds: 0.08,
  itemSize: 32,
  stages: DEFAULT_STAGE_PROGRESSION,
  initialSpawnDelay: 0.35,
  startingLives: 10,
  maxFrameSeconds: 0.25,
  simulationStepSeconds: 1 / 120,
};

export class GameSession {
  private readonly config: GameConfig;
  private readonly random: RandomSource;
  private state: SessionState = 'ready';
  private score: number = 0;
  private lives: number;
  private caughtFood: number = 0;
  private stageSettings: StageSettings;
  private player: PlayerState;
  private items: FallingItemState[] = [];
  private spawnTimer: number;
  private nextItemId: number = 1;
  private elapsedSeconds: number = 0;
  private previousSpawn: { x: number; catchTime: number } | null = null;
  private playerVelocity: number = 0;

  public constructor(
    config: GameConfig = DEFAULT_GAME_CONFIG,
    random: RandomSource = Math.random,
  ) {
    this.config = { ...config };
    this.random = random;
    this.lives = this.config.startingLives;
    this.stageSettings = getStageSettings(1, this.config.stages);
    this.spawnTimer = this.config.initialSpawnDelay;
    this.player = this.createInitialPlayer();
  }

  public start(): void {
    if (this.state === 'ready') {
      this.state = 'playing';
    }
  }

  public restart(): void {
    this.score = 0;
    this.lives = this.config.startingLives;
    this.caughtFood = 0;
    this.stageSettings = getStageSettings(1, this.config.stages);
    this.player = this.createInitialPlayer();
    this.items = [];
    this.spawnTimer = this.config.initialSpawnDelay;
    this.nextItemId = 1;
    this.elapsedSeconds = 0;
    this.previousSpawn = null;
    this.playerVelocity = 0;
    this.state = 'playing';
  }

  public pause(): void {
    if (this.state === 'playing') {
      this.state = 'paused';
    }
  }

  public resume(): void {
    if (this.state === 'paused') {
      this.state = 'playing';
    }
  }

  public update(dtSeconds: number, input: InputState): GameplayEvent[] {
    const events: GameplayEvent[] = [];

    if (this.state !== 'playing' || dtSeconds <= 0) {
      return events;
    }

    let remainingSeconds: number = Math.min(
      dtSeconds,
      this.config.maxFrameSeconds,
    );

    while (remainingSeconds > 0 && this.state === 'playing') {
      const stepSeconds: number = Math.min(
        remainingSeconds,
        this.config.simulationStepSeconds,
      );
      this.updateStep(stepSeconds, input, events);
      remainingSeconds -= stepSeconds;
    }

    return events;
  }

  public getSnapshot(): SessionSnapshot {
    return {
      state: this.state,
      score: this.score,
      lives: this.lives,
      caughtFood: this.caughtFood,
      stage: this.stageSettings.number,
      themeId: this.stageSettings.themeId,
      player: { ...this.player },
      items: this.items.map(
        (item: FallingItemState): FallingItemState => ({ ...item }),
      ),
    };
  }

  private updateStep(
    dtSeconds: number,
    input: InputState,
    events: GameplayEvent[],
  ): void {
    this.elapsedSeconds += dtSeconds;
    this.movePlayer(dtSeconds, input);
    this.updateSpawner(dtSeconds);

    for (const item of this.items) {
      item.y += item.fallSpeed * dtSeconds;
    }

    const resolvedItemIds: Set<number> = new Set<number>();
    for (const item of this.items) {
      if (!rectanglesOverlap(this.player, item)) {
        continue;
      }

      resolvedItemIds.add(item.id);
      this.score += 1;
      this.caughtFood += 1;
      events.push({
        type: 'itemCaught',
        itemId: item.id,
        score: this.score,
        x: item.x + item.width / 2,
        y: item.y + item.height / 2,
      });
      this.advanceStage(events);
    }

    const unresolvedItems: FallingItemState[] = [];
    for (const item of this.items) {
      if (resolvedItemIds.has(item.id)) {
        continue;
      }

      if (item.y < this.config.boardHeight) {
        unresolvedItems.push(item);
      } else if (this.loseLife(item, events)) {
        this.items = [];
        return;
      }
    }

    this.items = unresolvedItems;
  }

  private movePlayer(dtSeconds: number, input: InputState): void {
    const keyboardDirection: number = Number(input.right) - Number(input.left);
    const previousX: number = this.player.x;
    const playerCenterX: number = this.player.x + this.player.width / 2;
    const pointerDirection: number =
      input.targetX === undefined
        ? 0
        : Math.sign(input.targetX - playerCenterX);
    const direction: number =
      keyboardDirection === 0 ? pointerDirection : keyboardDirection;
    const targetVelocity: number = direction * this.config.playerSpeed;
    const acceleration: number =
      this.config.playerSpeed / this.config.playerAccelerationSeconds;
    const braking: number =
      this.config.playerSpeed / this.config.playerDecelerationSeconds;
    let remainingSeconds: number = dtSeconds;
    let travel: number = 0;
    if (
      this.playerVelocity !== 0 &&
      Math.sign(this.playerVelocity) !== Math.sign(targetVelocity)
    ) {
      const brakeSeconds: number = Math.min(
        remainingSeconds,
        Math.abs(this.playerVelocity) / braking,
      );
      const previousVelocity: number = this.playerVelocity;
      this.playerVelocity -=
        Math.sign(previousVelocity) * braking * brakeSeconds;
      if (Math.abs(this.playerVelocity) < 1e-9) {
        this.playerVelocity = 0;
      }
      travel += ((previousVelocity + this.playerVelocity) / 2) * brakeSeconds;
      remainingSeconds -= brakeSeconds;
    }
    if (remainingSeconds > 0) {
      const rate: number = targetVelocity === 0 ? braking : acceleration;
      const changeSeconds: number = Math.min(
        remainingSeconds,
        Math.abs(targetVelocity - this.playerVelocity) / rate,
      );
      const previousVelocity: number = this.playerVelocity;
      this.playerVelocity +=
        Math.sign(targetVelocity - previousVelocity) * rate * changeSeconds;
      travel +=
        ((previousVelocity + this.playerVelocity) / 2) * changeSeconds +
        this.playerVelocity * (remainingSeconds - changeSeconds);
    }
    const requestedX: number = this.player.x + travel;
    const maximumX: number = this.config.boardWidth - this.player.width;
    this.player.x = Math.min(maximumX, Math.max(0, requestedX));
    if (this.player.x !== requestedX) {
      this.playerVelocity = 0;
    }
    if (keyboardDirection === 0 && input.targetX !== undefined) {
      const targetPlayerX: number = input.targetX - this.player.width / 2;
      if ((targetPlayerX - previousX) * (targetPlayerX - this.player.x) <= 0) {
        this.player.x = Math.min(maximumX, Math.max(0, targetPlayerX));
        this.playerVelocity = 0;
      }
    }
  }

  private updateSpawner(dtSeconds: number): void {
    this.spawnTimer -= dtSeconds;

    while (this.spawnTimer <= 0) {
      this.spawnItem();
      this.spawnTimer += this.stageSettings.spawnInterval;
    }
  }

  private spawnItem(): void {
    const maximumX: number = this.config.boardWidth - this.config.itemSize;
    const spawnTime: number = this.elapsedSeconds + this.spawnTimer;
    const catchTime: number =
      spawnTime + this.player.y / this.stageSettings.fallSpeed;
    const sampledX: number = this.random() * maximumX;
    const availableTravel: number = this.previousSpawn
      ? this.config.playerSpeed *
        Math.max(0, catchTime - this.previousSpawn.catchTime)
      : maximumX;
    const overlapAllowance: number =
      (this.config.playerWidth + this.config.itemSize) / 2;
    const maximumDistance: number = Math.max(
      0,
      availableTravel + overlapAllowance - 8,
    );
    const x: number = this.previousSpawn
      ? Math.min(
          this.previousSpawn.x + maximumDistance,
          Math.max(this.previousSpawn.x - maximumDistance, sampledX),
        )
      : sampledX;
    const item: FallingItemState = {
      id: this.nextItemId,
      x: Math.min(maximumX, Math.max(0, x)),
      y: -this.config.itemSize,
      width: this.config.itemSize,
      height: this.config.itemSize,
      fallSpeed: this.stageSettings.fallSpeed,
    };

    this.nextItemId += 1;
    this.previousSpawn = { x: item.x, catchTime };
    this.items.push(item);
  }

  private advanceStage(events: GameplayEvent[]): void {
    const stageNumber: number = getStageNumber(
      this.caughtFood,
      this.config.stages,
    );
    if (stageNumber === this.stageSettings.number) {
      return;
    }

    this.stageSettings = getStageSettings(stageNumber, this.config.stages);
    events.push({
      type: 'stageChanged',
      stage: this.stageSettings.number,
      themeId: this.stageSettings.themeId,
    });
  }

  private loseLife(item: FallingItemState, events: GameplayEvent[]): boolean {
    this.lives = Math.max(0, this.lives - 1);
    events.push({
      type: 'lifeLost',
      itemId: item.id,
      lives: this.lives,
      x: item.x + item.width / 2,
      y: Math.min(this.config.boardHeight, item.y + item.height / 2),
    });
    if (this.lives > 0) {
      return false;
    }

    this.state = 'gameOver';
    events.push({ type: 'gameOver', score: this.score });
    return true;
  }

  private createInitialPlayer(): PlayerState {
    return {
      x: (this.config.boardWidth - this.config.playerWidth) / 2,
      y:
        this.config.boardHeight -
        this.config.playerBottomMargin -
        this.config.playerHeight,
      width: this.config.playerWidth,
      height: this.config.playerHeight,
    };
  }
}
