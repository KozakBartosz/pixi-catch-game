import { InputState } from '../game/types';

export class InputController {
  private readonly pressedKeys: Set<string> = new Set<string>();
  private readonly handleKeyDown: (event: KeyboardEvent) => void;
  private readonly handleKeyUp: (event: KeyboardEvent) => void;
  private readonly handleBlur: () => void;

  public constructor() {
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
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
  }

  public getState(): InputState {
    return {
      left: this.pressedKeys.has('ArrowLeft') || this.pressedKeys.has('KeyA'),
      right: this.pressedKeys.has('ArrowRight') || this.pressedKeys.has('KeyD'),
    };
  }

  public clear(): void {
    this.pressedKeys.clear();
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    this.clear();
  }

  private isMovementKey(code: string): boolean {
    return ['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(code);
  }
}
