import {
  BoardViewport,
  calculateBoardViewport,
  mapViewportXToBoard,
} from './viewportLayout';

describe('calculateBoardViewport', (): void => {
  it('contain-fits and horizontally centers the board in a wide viewport', (): void => {
    const layout: BoardViewport = calculateBoardViewport(1920, 1080, 800, 600);

    expect(layout.scale).toBe(1.8);
    expect(layout.offsetX).toBe(240);
    expect(layout.offsetY).toBe(0);
    expect(layout.boardWidth * layout.scale).toBe(1440);
    expect(layout.boardHeight * layout.scale).toBe(1080);
  });

  it('contain-fits and vertically centers the board in a tall viewport', (): void => {
    const layout: BoardViewport = calculateBoardViewport(390, 844, 800, 600);

    expect(layout.scale).toBe(0.4875);
    expect(layout.offsetX).toBe(0);
    expect(layout.offsetY).toBe(275.75);
  });

  it('does not invent drawable space for a collapsed viewport', (): void => {
    const layout: BoardViewport = calculateBoardViewport(-20, 0, 800, 600);

    expect(layout.scale).toBe(0);
    expect(layout.viewportWidth).toBe(0);
    expect(layout.viewportHeight).toBe(0);
    expect(layout.offsetX).toBe(0);
    expect(layout.offsetY).toBe(0);
  });

  it('maps contained viewport coordinates and rejects decorative margins', (): void => {
    const layout: BoardViewport = calculateBoardViewport(1920, 1080, 800, 600);

    expect(mapViewportXToBoard(240, layout)).toBe(0);
    expect(mapViewportXToBoard(960, layout)).toBe(400);
    expect(mapViewportXToBoard(239, layout)).toBeNull();
    expect(mapViewportXToBoard(1681, layout)).toBeNull();
  });

  it('clamps a captured drag to the logical board after resize', (): void => {
    const portrait: BoardViewport = calculateBoardViewport(390, 844, 800, 600);

    expect(mapViewportXToBoard(-20, portrait, true)).toBe(0);
    expect(mapViewportXToBoard(410, portrait, true)).toBe(800);
    expect(mapViewportXToBoard(195, portrait, true)).toBe(400);
  });
});
