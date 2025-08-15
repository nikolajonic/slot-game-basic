import type { Grid, SymbolKey } from "../types";
import {
  ms,
  TIMING,
  isMultiplier,
  multValue,
  SCATTER_SYMBOL,
} from "./constants";
import {
  countBySymbol,
  emptyMask,
  buildDropToYFromNulls,
  compactAndRefill,
  aboveForMask,
  hasAny,
} from "./helpers";
import { GridRenderer } from "../../render/GridRenderer";

export type BonusCtx = {
  rows: number;
  cols: number;
  bet: number;
  basePayTable: Partial<Record<SymbolKey, number>>;
  grid: Grid;
  renderer: GridRenderer;
  pickBonus: () => SymbolKey;
};

export async function tumbleBonus(ctx: BonusCtx): Promise<number> {
  const { rows, cols, bet, basePayTable, grid, renderer, pickBonus } = ctx;
  let collectedBase = 0;

  while (true) {
    const counts = countBySymbol(
      grid,
      rows,
      cols,
      (s) => !isMultiplier(s) && s !== SCATTER_SYMBOL
    );
    const winners = Object.entries(counts)
      .filter(([, cnt]) => (cnt ?? 0) >= 8)
      .map(([s]) => s as SymbolKey);

    if (winners.length === 0) break;

    const winMask = emptyMask(rows, cols);

    let cascadeBase = 0;
    for (const w of winners) {
      const cnt = counts[w]!;
      const base = basePayTable[w] ?? 1;
      cascadeBase += (cnt - 7) * base * (bet / 10);
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          if (grid[r][c]?.sym === w) winMask[r][c] = true;
    }
    collectedBase += cascadeBase;

    renderer.renderGrid(grid, winMask);
    await renderer.pulseMask(
      winMask,
      1.12,
      ms(TIMING.pulseUp),
      ms(TIMING.pulseDown)
    );

    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) if (winMask[r][c]) grid[r][c] = null;

    renderer.renderGrid(grid);

    const fromY1 = renderer.getPositionsY();
    const toY1 = buildDropToYFromNulls(grid, rows, cols, renderer.cell);
    await renderer.animateDrop(fromY1, toY1, ms(TIMING.tumbleDrop));

    const newMask = compactAndRefill(grid, rows, cols, pickBonus);
    renderer.renderGrid(grid);

    const baseY = renderer.baseYMatrix();
    const fromY2 = aboveForMask(baseY, newMask, rows * renderer.cell + 200, 0);
    await renderer.animateDrop(fromY2, baseY, ms(TIMING.newDrop));
  }

  const multMaskEnd = emptyMask(rows, cols);
  let sumMultipliers = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const s = grid[r][c]?.sym;
      if (s && isMultiplier(s)) {
        multMaskEnd[r][c] = true;
        sumMultipliers += multValue(s);
      }
    }

  if (hasAny(multMaskEnd)) {
    renderer.renderGrid(grid, multMaskEnd);
    await renderer.pulseMask(
      multMaskEnd,
      1.2,
      ms(TIMING.pulseUp),
      ms(TIMING.pulseDown)
    );
    renderer.renderGrid(grid);
  }

  const factor = sumMultipliers > 0 ? sumMultipliers : 1;
  return collectedBase * factor;
}
