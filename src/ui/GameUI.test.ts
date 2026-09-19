import { SessionSnapshot } from '../game/types';
import { GameUI, GameUIActions } from './GameUI';

class FakeElement {
  public hidden: boolean = false;
  public disabled: boolean = false;
  private text: string = '';
  public textWrites: number = 0;
  public get textContent(): string {
    return this.text;
  }
  public set textContent(value: string) {
    this.textWrites++;
    this.text = value;
  }
  public focusCount: number = 0;
  public readonly listeners: Map<string, () => void> = new Map();
  public focus(): void {
    this.focusCount++;
  }
  public addEventListener(type: string, listener: () => void): void {
    this.listeners.set(type, listener);
  }
  public removeEventListener(type: string): void {
    this.listeners.delete(type);
  }
  public setAttribute(): void {
    /* observable text and focus are enough here */
  }
  public click(): void {
    this.listeners.get('click')?.();
  }
}

const ids: string[] = [
  'score',
  'lives',
  'stage',
  'start-screen',
  'loading-screen',
  'loading-status',
  'load-error',
  'retry-button',
  'game-over-screen',
  'pause-screen',
  'pause-button',
  'resume-button',
  'final-score',
  'result-announcement',
  'start-button',
  'restart-button',
  'fullscreen-button',
  'fullscreen-status',
  'mute-button',
];

function setup(): {
  ui: GameUI;
  elements: Map<string, FakeElement>;
  actions: jest.Mocked<GameUIActions>;
  query: jest.Mock;
} {
  const elements: Map<string, FakeElement> = new Map(
    ids.map((id: string): [string, FakeElement] => [id, new FakeElement()]),
  );
  const query: jest.Mock = jest.fn(
    (selector: string): FakeElement | null =>
      elements.get(selector.slice(1)) ?? null,
  );
  const root: HTMLElement = { querySelector: query } as unknown as HTMLElement;
  const actions: jest.Mocked<GameUIActions> = {
    start: jest.fn(),
    restart: jest.fn(),
    retry: jest.fn(),
    fullscreen: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    mute: jest.fn(),
  };
  return { ui: new GameUI(root, actions), elements, actions, query };
}

function snapshot(
  state: SessionSnapshot['state'],
  score: number = 0,
): SessionSnapshot {
  return { state, score, lives: 10, stage: 1 } as SessionSnapshot;
}

describe('GameUI', (): void => {
  it('writes HUD text only for changed values', (): void => {
    const { ui, elements } = setup();
    const get: (id: string) => FakeElement = (id: string): FakeElement =>
      elements.get(id) as FakeElement;
    ui.render(snapshot('playing'));
    ui.render(snapshot('playing'));
    for (const id of ['score', 'lives', 'stage', 'final-score']) {
      expect(get(id).textWrites).toBe(1);
    }
    ui.render({ ...snapshot('playing'), lives: 9 });
    expect(get('lives').textWrites).toBe(2);
    for (const id of ['score', 'stage', 'final-score']) {
      expect(get(id).textWrites).toBe(1);
    }
  });

  it('resolves every element within the supplied root and dispatches named actions', (): void => {
    const { ui, elements, actions, query } = setup();
    expect(query).toHaveBeenCalledTimes(ids.length);
    for (const [id, action] of [
      ['start-button', 'start'],
      ['restart-button', 'restart'],
      ['retry-button', 'retry'],
      ['fullscreen-button', 'fullscreen'],
      ['pause-button', 'pause'],
      ['resume-button', 'resume'],
      ['mute-button', 'mute'],
    ] as const) {
      elements.get(id)?.click();
      expect(actions[action]).toHaveBeenCalledTimes(1);
    }
    ui.dispose();
    elements.get('start-button')?.click();
    expect(actions.start).toHaveBeenCalledTimes(1);
  });

  it('focuses once per transition and announces the final score once', (): void => {
    const { ui, elements } = setup();
    const get: (id: string) => FakeElement = (id: string): FakeElement =>
      elements.get(id) as FakeElement;
    ui.showLoading(0);
    ui.showLoadError();
    expect(get('retry-button').focusCount).toBe(1);
    ui.showLoadError();
    expect(get('retry-button').focusCount).toBe(1);
    ui.showLoading(0.5);
    expect(get('loading-status').focusCount).toBe(1);
    ui.showReady();
    ui.render(snapshot('ready'));
    expect(get('start-button').focusCount).toBe(1);
    ui.render(snapshot('playing'));
    ui.render(snapshot('playing'));
    expect(get('pause-button').focusCount).toBe(1);
    expect(get('start-screen').hidden).toBe(true);
    ui.render(snapshot('paused'));
    ui.render(snapshot('paused'));
    expect(get('resume-button').focusCount).toBe(1);
    ui.render(snapshot('playing'));
    expect(get('pause-button').focusCount).toBe(2);
    ui.render(snapshot('gameOver', 12));
    ui.render(snapshot('gameOver', 12));
    expect(get('restart-button').focusCount).toBe(1);
    expect(get('result-announcement').textContent).toBe(
      'Game over. Final score: 12.',
    );
    expect(get('final-score').textContent).toBe('12');
    ui.render(snapshot('playing'));
    expect(get('result-announcement').textContent).toBe('');
    expect(get('pause-button').focusCount).toBe(3);
  });
});
