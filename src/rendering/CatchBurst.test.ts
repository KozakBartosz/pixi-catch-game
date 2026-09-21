import { Graphics } from 'pixi.js';
import { CatchBurst } from './CatchBurst';

jest.mock('pixi.js', (): object => {
  class MockContainer {
    public readonly children: unknown[] = [];
    public alpha: number = 1;
    public x: number = 0;
    public y: number = 0;
    public readonly position: { set: (x: number, y: number) => void } = {
      set: (x: number, y: number): void => {
        this.x = x;
        this.y = y;
      },
    };
    public addChild(child: unknown): void {
      this.children.push(child);
    }
  }
  class MockGraphics extends MockContainer {
    public beginFill(): MockGraphics {
      return this;
    }
    public drawRect(): MockGraphics {
      return this;
    }
    public endFill(): MockGraphics {
      return this;
    }
  }
  return { Container: MockContainer, Graphics: MockGraphics };
});

describe('CatchBurst', (): void => {
  it('emits pixel particles at the caught item and expires after a short burst', (): void => {
    const burst: CatchBurst = new CatchBurst(240, 360, false);
    expect(burst.container.position).toEqual({ set: expect.any(Function) });
    expect(burst.container.x).toBe(240);
    expect(burst.container.y).toBe(360);
    expect(burst.container.children).toHaveLength(10);
    const first: Graphics = burst.container.children[0] as Graphics;
    const startY: number = first.y;
    expect(burst.advance(0.1)).toBe(false);
    expect(first.y).toBeLessThan(startY);
    expect(burst.container.alpha).toBeLessThan(1);
    expect(burst.advance(0.1)).toBe(false);
    expect(burst.advance(0.1)).toBe(false);
    expect(burst.advance(0.1)).toBe(true);
    expect(burst.container.alpha).toBe(0);
  });

  it('uses a shorter static burst with reduced motion', (): void => {
    const burst: CatchBurst = new CatchBurst(10, 20, true);
    expect(burst.container.children).toHaveLength(4);
    const first: Graphics = burst.container.children[0] as Graphics;
    const startY: number = first.y;
    expect(burst.advance(0.1)).toBe(false);
    expect(first.y).toBe(startY);
    expect(burst.advance(0.1)).toBe(true);
  });
});
