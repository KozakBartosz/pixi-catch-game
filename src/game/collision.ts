import { FallingItemState, PlayerState } from './types';

export const rectanglesOverlap: (
  first: PlayerState,
  second: FallingItemState,
) => boolean = (first: PlayerState, second: FallingItemState): boolean =>
  first.x < second.x + second.width &&
  first.x + first.width > second.x &&
  first.y < second.y + second.height &&
  first.y + first.height > second.y;
