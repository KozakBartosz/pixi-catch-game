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
