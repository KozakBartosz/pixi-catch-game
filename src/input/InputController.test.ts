import { InputController } from './InputController';
import { BoardViewport } from '../rendering/viewportLayout';

class PointerSurface extends EventTarget {
  public readonly captured: number[] = [];

  public getBoundingClientRect(): DOMRect {
    return { left: 10, top: 20 } as DOMRect;
  }

  public setPointerCapture(pointerId: number): void {
    this.captured.push(pointerId);
  }
}

const pointerEvent: (
  type: string,
  pointerId: number,
  clientX: number,
  clientY?: number,
) => Event = (
  type: string,
  pointerId: number,
  clientX: number,
  clientY: number = 320,
): Event => {
  const event: Event = new Event(type, { cancelable: true });
  Object.defineProperties(event, {
    pointerId: { value: pointerId },
    clientX: { value: clientX },
    clientY: { value: clientY },
  });
  return event;
};

describe('InputController pointer lifecycle', (): void => {
  const layout: BoardViewport = {
    viewportWidth: 1000,
    viewportHeight: 600,
    boardWidth: 800,
    boardHeight: 600,
    scale: 1,
    offsetX: 100,
    offsetY: 0,
  };
  let originalWindow: PropertyDescriptor | undefined;
  let browserWindow: EventTarget;

  beforeEach((): void => {
    originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
    browserWindow = new EventTarget();
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: browserWindow,
    });
  });

  afterEach((): void => {
    if (originalWindow) {
      Object.defineProperty(globalThis, 'window', originalWindow);
    } else {
      Reflect.deleteProperty(globalThis, 'window');
    }
  });

  it('tracks one captured pointer, clamps drags, and clears on cancellation', (): void => {
    const surface: PointerSurface = new PointerSurface();
    const controller: InputController = new InputController(
      surface as unknown as HTMLElement,
      (): BoardViewport => layout,
    );

    surface.dispatchEvent(pointerEvent('pointerdown', 7, 510));
    expect(surface.captured).toEqual([7]);
    expect(controller.getState().targetX).toBe(400);

    surface.dispatchEvent(pointerEvent('pointermove', 7, 1200));
    expect(controller.getState().targetX).toBe(800);
    surface.dispatchEvent(pointerEvent('pointercancel', 7, 1200));
    expect(controller.getState().targetX).toBeUndefined();
    controller.dispose();
  });

  it('ignores margin starts and clears pointer input on capture or focus loss', (): void => {
    const surface: PointerSurface = new PointerSurface();
    const controller: InputController = new InputController(
      surface as unknown as HTMLElement,
      (): BoardViewport => layout,
    );

    surface.dispatchEvent(pointerEvent('pointerdown', 3, 50));
    expect(controller.getState().targetX).toBeUndefined();
    surface.dispatchEvent(pointerEvent('pointerdown', 3, 310, 10));
    expect(controller.getState().targetX).toBeUndefined();
    surface.dispatchEvent(pointerEvent('pointerdown', 4, 310));
    surface.dispatchEvent(pointerEvent('lostpointercapture', 4, 310));
    expect(controller.getState().targetX).toBeUndefined();
    surface.dispatchEvent(pointerEvent('pointerdown', 5, 310));
    browserWindow.dispatchEvent(new Event('blur'));
    expect(controller.getState().targetX).toBeUndefined();
    controller.dispose();
  });

  it('uses the current layout for movement after a resize', (): void => {
    const surface: PointerSurface = new PointerSurface();
    let currentLayout: BoardViewport = layout;
    const controller: InputController = new InputController(
      surface as unknown as HTMLElement,
      (): BoardViewport => currentLayout,
    );

    surface.dispatchEvent(pointerEvent('pointerdown', 9, 510));
    currentLayout = { ...layout, scale: 0.5, offsetX: 300 };
    surface.dispatchEvent(pointerEvent('pointermove', 9, 510));
    expect(controller.getState().targetX).toBe(400);
    controller.dispose();
  });
});
