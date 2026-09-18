export interface BoardViewport {
  viewportWidth: number;
  viewportHeight: number;
  boardWidth: number;
  boardHeight: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}

export const calculateBoardViewport: (
  viewportWidth: number,
  viewportHeight: number,
  boardWidth: number,
  boardHeight: number,
) => BoardViewport = (
  viewportWidth: number,
  viewportHeight: number,
  boardWidth: number,
  boardHeight: number,
): BoardViewport => {
  const safeViewportWidth: number = Math.max(0, viewportWidth);
  const safeViewportHeight: number = Math.max(0, viewportHeight);
  const scale: number =
    boardWidth > 0 && boardHeight > 0
      ? Math.min(
          safeViewportWidth / boardWidth,
          safeViewportHeight / boardHeight,
        )
      : 0;

  return {
    viewportWidth: safeViewportWidth,
    viewportHeight: safeViewportHeight,
    boardWidth,
    boardHeight,
    scale,
    offsetX: (safeViewportWidth - boardWidth * scale) / 2,
    offsetY: (safeViewportHeight - boardHeight * scale) / 2,
  };
};

export const mapViewportXToBoard: (
  viewportX: number,
  layout: BoardViewport,
  clampToBoard?: boolean,
) => number | null = (
  viewportX: number,
  layout: BoardViewport,
  clampToBoard: boolean = false,
): number | null => {
  if (layout.scale <= 0) {
    return null;
  }

  const boardX: number = (viewportX - layout.offsetX) / layout.scale;
  if (clampToBoard) {
    return Math.min(layout.boardWidth, Math.max(0, boardX));
  }

  return boardX >= 0 && boardX <= layout.boardWidth ? boardX : null;
};
