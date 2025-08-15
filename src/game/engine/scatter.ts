import type { Grid } from "../types";
import { ms, TIMING, SCATTER_SYMBOL } from "./constants";
import { emptyMask } from "./helpers";
import { GridRenderer } from "../../render/GridRenderer";

export async function pulseAndCountScatters(
  grid: Grid,
  rows: number,
  cols: number,
  renderer: GridRenderer
): Promise<number> {
  let count = 0;
  const mask = emptyMask(rows, cols);

  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (grid[r][c]?.sym === SCATTER_SYMBOL) {
        mask[r][c] = true;
        count++;
      }

  if (count >= 3) {
    renderer.renderGrid(grid, mask);
    await renderer.pulseMask(
      mask,
      1.15,
      ms(TIMING.pulseUp),
      ms(TIMING.pulseDown)
    );
    renderer.renderGrid(grid);
  }

  return count;
}
