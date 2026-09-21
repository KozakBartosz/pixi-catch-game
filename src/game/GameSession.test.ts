import { DEFAULT_GAME_CONFIG, GameSession } from './GameSession';
import {
  GameConfig,
  GameplayEvent,
  FallingItemState,
  InputState,
  SessionSnapshot,
} from './types';

const IDLE_INPUT: InputState = { left: false, right: false };
const RIGHT_INPUT: InputState = { left: false, right: true };

interface TestConfigOverrides extends Partial<Omit<GameConfig, 'stages'>> {
  itemFallSpeed?: number;
  spawnInterval?: number;
  stages?: Partial<GameConfig['stages']>;
}

const createConfig: (overrides?: TestConfigOverrides) => GameConfig = (
  overrides: TestConfigOverrides = {},
): GameConfig => {
  const { itemFallSpeed, spawnInterval, stages, ...gameOverrides } = overrides;
  return {
    ...DEFAULT_GAME_CONFIG,
    initialSpawnDelay: 100,
    maxFrameSeconds: 2,
    ...gameOverrides,
    stages: {
      ...DEFAULT_GAME_CONFIG.stages,
      baseFallSpeed: itemFallSpeed ?? DEFAULT_GAME_CONFIG.stages.baseFallSpeed,
      maximumFallSpeed:
        itemFallSpeed ?? DEFAULT_GAME_CONFIG.stages.maximumFallSpeed,
      baseSpawnInterval: spawnInterval ?? 100,
      minimumSpawnInterval: spawnInterval ?? 100,
      ...stages,
    },
  };
};

describe('GameSession', (): void => {
  it('moves toward a pointer target at player speed without overshooting', (): void => {
    const session: GameSession = new GameSession();
    session.start();
    const initialX: number = session.getSnapshot().player.x;

    session.update(0.1, { left: false, right: false, targetX: 700 });
    expect(session.getSnapshot().player.x).toBeCloseTo(initialX + 42);

    const centerX: number =
      session.getSnapshot().player.x + session.getSnapshot().player.width / 2;
    session.update(0.1, {
      left: false,
      right: false,
      targetX: centerX + 2,
    });
    expect(session.getSnapshot().player.x).toBeCloseTo(initialX + 44);
  });

  it('gives explicit keyboard movement priority over an active pointer', (): void => {
    const session: GameSession = new GameSession();
    session.start();
    const initialX: number = session.getSnapshot().player.x;

    session.update(0.1, { left: true, right: false, targetX: 800 });
    expect(session.getSnapshot().player.x).toBeCloseTo(initialX - 42);
  });
  it('awards one point for a caught item and resolves it once', (): void => {
    const session: GameSession = new GameSession(
      createConfig({ initialSpawnDelay: 0, itemFallSpeed: 600 }),
      (): number => 0.5,
    );
    session.start();

    const events: GameplayEvent[] = session.update(1, IDLE_INPUT);
    const laterEvents: GameplayEvent[] = session.update(1, IDLE_INPUT);

    expect(
      events.filter(
        (event: GameplayEvent): boolean => event.type === 'itemCaught',
      ),
    ).toHaveLength(1);
    expect(session.getSnapshot().score).toBe(1);
    expect(session.getSnapshot().items).toHaveLength(0);
    expect(laterEvents).toHaveLength(0);
  });

  it('removes one life for a missed item and resolves it once', (): void => {
    const session: GameSession = new GameSession(
      createConfig({ initialSpawnDelay: 0, itemFallSpeed: 1000 }),
      (): number => 0,
    );
    session.start();

    const events: GameplayEvent[] = session.update(1, IDLE_INPUT);
    const laterEvents: GameplayEvent[] = session.update(1, IDLE_INPUT);

    expect(
      events.filter(
        (event: GameplayEvent): boolean => event.type === 'lifeLost',
      ),
    ).toHaveLength(1);
    expect(session.getSnapshot().lives).toBe(9);
    expect(session.getSnapshot().items).toHaveLength(0);
    expect(laterEvents).toHaveLength(0);
  });

  it('ends the run on the tenth miss and does not update afterward', (): void => {
    const session: GameSession = new GameSession(
      createConfig({
        initialSpawnDelay: 0,
        spawnInterval: 0.1,
        itemFallSpeed: 1000,
      }),
      (): number => 0,
    );
    session.start();

    const events: GameplayEvent[] = session.update(2, IDLE_INPUT);
    const gameOverSnapshot: SessionSnapshot = session.getSnapshot();
    const laterEvents: GameplayEvent[] = session.update(1, RIGHT_INPUT);

    expect(gameOverSnapshot.state).toBe('gameOver');
    expect(gameOverSnapshot.lives).toBe(0);
    expect(events.at(-1)).toEqual({ type: 'gameOver', score: 0 });
    expect(laterEvents).toHaveLength(0);
    expect(session.getSnapshot()).toEqual(gameOverSnapshot);
  });

  it('uses elapsed time consistently across different frame durations', (): void => {
    const oneFrameSession: GameSession = new GameSession(createConfig());
    const manyFramesSession: GameSession = new GameSession(createConfig());
    oneFrameSession.start();
    manyFramesSession.start();

    oneFrameSession.update(0.2, RIGHT_INPUT);
    for (let frameIndex: number = 0; frameIndex < 20; frameIndex += 1) {
      manyFramesSession.update(0.01, RIGHT_INPUT);
    }

    expect(oneFrameSession.getSnapshot().player.x).toBeCloseTo(
      manyFramesSession.getSnapshot().player.x,
      8,
    );
  });

  it('keeps player movement within both board edges', (): void => {
    const session: GameSession = new GameSession(createConfig());
    session.start();

    session.update(2, { left: true, right: false });
    expect(session.getSnapshot().player.x).toBe(0);

    session.update(2, RIGHT_INPUT);
    expect(session.getSnapshot().player.x).toBe(
      DEFAULT_GAME_CONFIG.boardWidth - DEFAULT_GAME_CONFIG.playerWidth,
    );
  });

  it('uses the visible character body instead of the old wide paddle hitbox', (): void => {
    const maximumItemX: number =
      DEFAULT_GAME_CONFIG.boardWidth - DEFAULT_GAME_CONFIG.itemSize;
    // The measured body ends at x=424. This item starts just outside it, but
    // would overlap the previous 104 px-wide paddle hitbox (x=348..452).
    const itemX: number = 425;
    const session: GameSession = new GameSession(
      createConfig({
        initialSpawnDelay: 0,
        itemFallSpeed: 600,
      }),
      (): number => itemX / maximumItemX,
    );
    session.start();

    const events: GameplayEvent[] = session.update(1.1, IDLE_INPUT);
    const snapshot: SessionSnapshot = session.getSnapshot();

    expect(snapshot.player).toMatchObject({ width: 48, height: 120 });
    expect(
      events.some(
        (event: GameplayEvent): boolean => event.type === 'itemCaught',
      ),
    ).toBe(false);
    expect(snapshot.score).toBe(0);
    expect(snapshot.lives).toBe(9);
  });

  it('catches food that reaches the visible upper body', (): void => {
    const session: GameSession = new GameSession(
      createConfig({
        initialSpawnDelay: 0,
        itemFallSpeed: 600,
      }),
      (): number => 0.5,
    );
    session.start();

    const events: GameplayEvent[] = session.update(0.8, IDLE_INPUT);

    expect(events).toContainEqual({
      type: 'itemCaught',
      itemId: 1,
      score: 1,
      x: 400,
      y: 444,
    });
    expect(session.getSnapshot().score).toBe(1);
    expect(session.getSnapshot().items).toHaveLength(0);
  });

  it('restores all run state on restart', (): void => {
    const config: GameConfig = createConfig({
      initialSpawnDelay: 0,
      itemFallSpeed: 600,
    });
    const session: GameSession = new GameSession(config, (): number => 0.5);
    const initialSnapshot: SessionSnapshot = session.getSnapshot();
    session.start();
    session.update(1, IDLE_INPUT);
    session.update(0.1, RIGHT_INPUT);
    expect(session.getSnapshot().score).toBe(1);

    session.restart();
    const restartedSnapshot: SessionSnapshot = session.getSnapshot();

    expect(restartedSnapshot).toEqual({
      ...initialSnapshot,
      state: 'playing',
    });
  });

  it('freezes movement and spawning while paused and resumes explicitly', (): void => {
    const session: GameSession = new GameSession(
      createConfig({ initialSpawnDelay: 0.5, spawnInterval: 1 }),
    );
    session.start();
    session.update(0.25, RIGHT_INPUT);
    session.pause();
    const pausedSnapshot: SessionSnapshot = session.getSnapshot();

    session.update(2, RIGHT_INPUT);
    expect(session.getSnapshot()).toEqual(pausedSnapshot);

    session.resume();
    session.update(0.24, IDLE_INPUT);
    expect(session.getSnapshot().items).toHaveLength(0);
    session.update(0.02, IDLE_INPUT);
    expect(session.getSnapshot().items).toHaveLength(1);
  });

  it('advances stages from catches, cycles themes, and caps difficulty', (): void => {
    const session: GameSession = new GameSession(
      createConfig({
        initialSpawnDelay: 0,
        itemFallSpeed: 600,
        spawnInterval: 0.8,
        stages: {
          catchesPerStage: 1,
          themeIds: ['a', 'b'],
          fallSpeedIncrease: 100,
          maximumFallSpeed: 700,
        },
      }),
      (): number => 0.5,
    );
    session.start();

    session.update(2.5, IDLE_INPUT);
    const snapshot: SessionSnapshot = session.getSnapshot();

    expect(snapshot.caughtFood).toBeGreaterThanOrEqual(2);
    expect(snapshot.stage).toBe(snapshot.caughtFood + 1);
    expect(snapshot.themeId).toBe(snapshot.stage % 2 === 0 ? 'b' : 'a');
    expect(
      snapshot.items.every(
        (item: FallingItemState): boolean => item.fallSpeed <= 700,
      ),
    ).toBe(true);
  });

  it('keeps each item fall speed from its spawn stage', (): void => {
    const randomValues: number[] = [0.5, 0.9, 0, 0.9, 0.5, 0.9];
    const session: GameSession = new GameSession(
      createConfig({
        initialSpawnDelay: 0,
        itemFallSpeed: 600,
        spawnInterval: 0.1,
        stages: {
          catchesPerStage: 1,
          fallSpeedIncrease: 200,
          maximumFallSpeed: 800,
        },
      }),
      (): number => randomValues.shift() ?? 0,
    );
    session.start();

    session.update(0.8, IDLE_INPUT);
    const snapshot: SessionSnapshot = session.getSnapshot();

    expect(snapshot.stage).toBe(2);
    expect(
      snapshot.items.some(
        (item: FallingItemState): boolean => item.fallSpeed === 600,
      ),
    ).toBe(true);
    session.update(0.11, IDLE_INPUT);
    expect(
      session
        .getSnapshot()
        .items.some(
          (item: FallingItemState): boolean => item.fallSpeed === 800,
        ),
    ).toBe(true);
  });

  it('restart resets caught food, stage, and theme', (): void => {
    const session: GameSession = new GameSession(
      createConfig({
        initialSpawnDelay: 0,
        itemFallSpeed: 600,
        stages: { catchesPerStage: 1 },
      }),
      (): number => 0.5,
    );
    session.start();
    session.update(0.8, IDLE_INPUT);
    expect(session.getSnapshot().stage).toBe(2);

    session.restart();
    expect(session.getSnapshot()).toMatchObject({
      state: 'playing',
      caughtFood: 0,
      stage: 1,
      themeId: DEFAULT_GAME_CONFIG.stages.themeIds[0],
    });
  });
});
