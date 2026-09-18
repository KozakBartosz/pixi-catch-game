import { InputState } from '../game/types';
import {
  BoardViewport,
  mapViewportXToBoard,
} from '../rendering/viewportLayout';

export class InputController {
  private readonly pressedKeys: Set<string> = new Set<string>();
  private readonly handleKeyDown: (event: KeyboardEvent) => void;
  private readonly handleKeyUp: (event: KeyboardEvent) => void;
  private readonly handleBlur: () => void;
  private readonly pointerSurface: HTMLElement;
  private readonly getViewportLayout: () => BoardViewport;
  private readonly handlePointerDown: (event: PointerEvent) => void;
  private readonly handlePointerMove: (event: PointerEvent) => void;
  private readonly handlePointerEnd: (event: PointerEvent) => void;
  private activePointerId: number | null = null;
  private pointerTargetX: number | undefined;

  public constructor(
    pointerSurface: HTMLElement,
    getViewportLayout: () => BoardViewport,
  ) {
    this.pointerSurface = pointerSurface;
    this.getViewportLayout = getViewportLayout;
    this.handleKeyDown = (event: KeyboardEvent): void => {
      if (this.isMovementKey(event.code)) {
        event.preventDefault();
        this.pressedKeys.add(event.code);
      }
    };
    this.handleKeyUp = (event: KeyboardEvent): void => {
      if (this.isMovementKey(event.code)) {
        event.preventDefault();
        this.pressedKeys.delete(event.code);
      }
    };
    this.handleBlur = (): void => this.clear();
    this.handlePointerDown = (event: PointerEvent): void => {
      if (this.activePointerId !== null || !this.updatePointer(event, false)) {
        return;
      }

      this.activePointerId = event.pointerId;
      this.pointerSurface.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    };
    this.handlePointerMove = (event: PointerEvent): void => {
      if (event.pointerId === this.activePointerId) {
        this.updatePointer(event, true);
        event.preventDefault();
      }
    };
    this.handlePointerEnd = (event: PointerEvent): void => {
      if (event.pointerId === this.activePointerId) {
        this.clearPointer();
      }
    };
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    this.pointerSurface.addEventListener('pointerdown', this.handlePointerDown);
    this.pointerSurface.addEventListener('pointermove', this.handlePointerMove);
    this.pointerSurface.addEventListener('pointerup', this.handlePointerEnd);
    this.pointerSurface.addEventListener(
      'pointercancel',
      this.handlePointerEnd,
    );
    this.pointerSurface.addEventListener(
      'lostpointercapture',
      this.handlePointerEnd,
    );
  }

  public getState(): InputState {
    return {
      left: this.pressedKeys.has('ArrowLeft') || this.pressedKeys.has('KeyA'),
      right: this.pressedKeys.has('ArrowRight') || this.pressedKeys.has('KeyD'),
      targetX: this.pointerTargetX,
    };
  }

  public clear(): void {
    this.pressedKeys.clear();
    this.clearPointer();
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    this.pointerSurface.removeEventListener(
      'pointerdown',
      this.handlePointerDown,
    );
    this.pointerSurface.removeEventListener(
      'pointermove',
      this.handlePointerMove,
    );
    this.pointerSurface.removeEventListener('pointerup', this.handlePointerEnd);
    this.pointerSurface.removeEventListener(
      'pointercancel',
      this.handlePointerEnd,
    );
    this.pointerSurface.removeEventListener(
      'lostpointercapture',
      this.handlePointerEnd,
    );
    this.clear();
  }

  private isMovementKey(code: string): boolean {
    return ['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(code);
  }

  private updatePointer(event: PointerEvent, clampToBoard: boolean): boolean {
    const bounds: DOMRect = this.pointerSurface.getBoundingClientRect();
    const layout: BoardViewport = this.getViewportLayout();
    if (layout.scale <= 0) {
      return false;
    }
    const viewportY: number = event.clientY - bounds.top;
    const boardY: number = (viewportY - layout.offsetY) / layout.scale;
    if (!clampToBoard && (boardY < 0 || boardY > layout.boardHeight)) {
      return false;
    }
    const targetX: number | null = mapViewportXToBoard(
      event.clientX - bounds.left,
      layout,
      clampToBoard,
    );
    if (targetX === null) {
      return false;
    }

    this.pointerTargetX = targetX;
    return true;
  }

  private clearPointer(): void {
    this.activePointerId = null;
    this.pointerTargetX = undefined;
  }
}
