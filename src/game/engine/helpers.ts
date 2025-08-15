import type { Cell, Grid, SymbolKey } from "../types";

export function emptyMask(rows: number, cols: number): boolean[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(false));
}
export function mergeMasks(a: boolean[][], b: boolean[][]): boolean[][] {
  const rows = a.length,
    cols = a[0]?.length ?? 0;
  const out = emptyMask(rows, cols);
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) out[r][c] = !!(a[r][c] || b[r][c]);
  return out;
}
export function hasAny(mask: boolean[][]): boolean {
  for (let r = 0; r < mask.length; r++)
    for (let c = 0; c < mask[r].length; c++) if (mask[r][c]) return true;
  return false;
}

export function countBySymbol(
  grid: Grid,
  rows: number,
  cols: number,
  filter?: (s: SymbolKey) => boolean
): Partial<Record<SymbolKey, number>> {
  const counts: Partial<Record<SymbolKey, number>> = {};
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const s = grid[r][c]?.sym;
      if (!s) continue;
      if (filter && !filter(s)) continue;
      counts[s] = (counts[s] ?? 0) + 1;
    }
  return counts;
}

export function buildDropToYFromNulls(
  grid: Grid,
  rows: number,
  cols: number,
  cell: number
): number[][] {
  const toY: number[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(0)
  );
  for (let c = 0; c < cols; c++) {
    let gaps = 0;
    for (let r = rows - 1; r >= 0; r--) {
      toY[r][c] = (r + gaps) * cell;
      if (grid[r][c] === null) gaps++;
    }
  }
  return toY;
}

export function compactAndRefill(
  grid: Grid,
  rows: number,
  cols: number,
  pickSym: () => SymbolKey
): boolean[][] {
  const mask = emptyMask(rows, cols);
  for (let c = 0; c < cols; c++) {
    let write = rows - 1;
    for (let r = rows - 1; r >= 0; r--) {
      if (grid[r][c]) {
        if (write !== r) {
          grid[write][c] = grid[r][c];
          grid[r][c] = null as Cell;
        }
        write--;
      }
    }
    for (let r = write; r >= 0; r--) {
      grid[r][c] = { sym: pickSym() };
      mask[r][c] = true;
    }
  }
  return mask;
}

export function aboveForMask(
  base: number[][],
  mask: boolean[][],
  offsetPx: number,
  staggerPxPerCol = 0
) {
  const rows = base.length,
    cols = base[0]?.length ?? 0;
  const from = base.map((row) => row.slice());
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (mask[r][c]) from[r][c] = -offsetPx - c * staggerPxPerCol;
  return from;
}
