import type { Grid, SymbolKey } from "../types";
import { ms, TIMING } from "./constants";
import {
  countBySymbol,
  emptyMask,
  buildDropToYFromNulls,
  compactAndRefill,
  aboveForMask,
} from "./helpers";
import { GridRenderer } from "../../render/GridRenderer";

export type BaseCtx = {
  rows: number;
  cols: number;
  bet: number;
  basePayTable: Partial<Record<SymbolKey, number>>;
  grid: Grid;
  renderer: GridRenderer;
  pickBase: () => SymbolKey;
};

export async function tumbleBase(ctx: BaseCtx): Promise<number> {
  const { rows, cols, bet, basePayTable, grid, renderer, pickBase } = ctx;
  let totalWin = 0;

  while (true) {
    const counts = countBySymbol(grid, rows, cols);
    const winners = Object.entries(counts)
      .filter(([, cnt]) => (cnt ?? 0) >= 8)
      .map(([s]) => s as SymbolKey);

    if (winners.length === 0) break;

    const winMask = emptyMask(rows, cols);
    let cascadeWin = 0;

    for (const w of winners) {
      const cnt = counts[w]!;
      const base = basePayTable[w] ?? 1;
      cascadeWin += (cnt - 7) * base * (bet / 10);
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          if (grid[r][c]?.sym === w) winMask[r][c] = true;
    }
    totalWin += cascadeWin;

    renderer.renderGrid(grid, winMask);
    await renderer.pulseMask(
      winMask,
      1.12,
      ms(TIMING.pulseUp),
      ms(TIMING.pulseDown)
    );

    // remove winners
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) if (winMask[r][c]) grid[r][c] = null;

    renderer.renderGrid(grid);

    // fall
    const fromY1 = renderer.getPositionsY();
    const toY1 = buildDropToYFromNulls(grid, rows, cols, renderer.cell);
    await renderer.animateDrop(fromY1, toY1, ms(TIMING.tumbleDrop));

    // refill
    const newMask = compactAndRefill(grid, rows, cols, pickBase);
    renderer.renderGrid(grid);

    const baseY = renderer.baseYMatrix();
    const fromY2 = aboveForMask(baseY, newMask, rows * renderer.cell + 220, 0);
    await renderer.animateDrop(fromY2, baseY, ms(TIMING.newDrop));
  }

  return totalWin;
}
