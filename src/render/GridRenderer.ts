import * as PIXI from "pixi.js";
import type { Grid, SymbolKey } from "../game/types";
import { SYMBOL_COLORS } from "./colors";
import { CellView } from "./CellView";

type GridRendererOpts = {
  x: number;
  y: number;
  cell: number;
  cols: number;
  rows: number;
  textures: Record<SymbolKey, PIXI.Texture>;
};

export class GridRenderer extends PIXI.Container {
  readonly cols: number;
  readonly rows: number;
  cell: number; // <- allow updates

  private bg: PIXI.Graphics;
  private cells: CellView[][] = [];
  private textures: Record<SymbolKey, PIXI.Texture>;

  constructor(opts: GridRendererOpts) {
    super();
    this.x = opts.x;
    this.y = opts.y;
    this.cols = opts.cols;
    this.rows = opts.rows;
    this.cell = opts.cell;
    this.textures = opts.textures;

    this.bg = new PIXI.Graphics();
    this.addChild(this.bg);

    this.drawBackground();
    this.initCells();
  }

  /** Proportional background (no fixed px) */
  private drawBackground() {
    const w = this.cols * this.cell;
    const h = this.rows * this.cell;

    // proportions derived from your original 80px cell:
    // outer radius ~24px -> 24/80 = 0.30, inner radius ~12px -> 0.15
    const outerRadius = Math.round(this.cell * 0.3);
    const innerRadius = Math.round(this.cell * 0.15);
    const strokeW = Math.max(1, Math.round(this.cell * 0.025));

    this.bg.clear();
    // transparent fill
    this.bg.beginFill(0x000000, 0);
    this.bg.drawRoundedRect(0, 0, w, h, innerRadius);
    this.bg.endFill();

    this.bg.lineStyle(strokeW, 0x1b2640, 1);
    this.bg.drawRoundedRect(0, 0, w, h, outerRadius);
  }

  private initCells() {
    for (let r = 0; r < this.rows; r++) {
      this.cells[r] = [];
      for (let c = 0; c < this.cols; c++) {
        const view = new CellView(this.cell);
        view.position.set(c * this.cell, r * this.cell);
        this.addChild(view);
        this.cells[r][c] = view;
      }
    }
  }

  /** Call this if layout (x,y,cell) changes; keeps everything proportional */
  resizeLayout({ x, y, cell }: { x: number; y: number; cell: number }) {
    this.x = x;
    this.y = y;
    this.cell = cell;
    this.drawBackground();
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const view = this.cells[r][c];
        view.setSize(this.cell);
        view.position.set(c * this.cell, r * this.cell);
      }
    }
  }

  renderGrid(grid: Grid, highlights?: boolean[][]) {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const view = this.cells[r][c];
        const cell = grid[r][c];

        if (!cell) {
          view.drawEmpty(this.cell);
          continue;
        }

        const color = SYMBOL_COLORS[cell.sym];
        const isWin = highlights?.[r]?.[c] ?? false;
        view.draw(this.cell, color, isWin);
        view.setTexture(this.textures[cell.sym]);
      }
    }
  }

  async pulseMask(mask: boolean[][], scaleUp = 1.12, upMs = 120, downMs = 120) {
    const jobs: Promise<void>[] = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (mask[r][c])
          jobs.push(this.cells[r][c].pulse(scaleUp, upMs, downMs));
      }
    }
    await Promise.all(jobs);
  }

  getPositionsY(): number[][] {
    return Array.from({ length: this.rows }, (_, r) =>
      Array.from({ length: this.cols }, (_, c) => this.cells[r][c].y)
    );
  }

  baseYMatrix(): number[][] {
    return Array.from({ length: this.rows }, (_, r) =>
      Array.from({ length: this.cols }, () => r * this.cell)
    );
  }

  aboveYMatrix(
    offsetPx = this.rows * this.cell + 200,
    staggerPxPerCol = 40
  ): number[][] {
    return Array.from({ length: this.rows }, () =>
      Array.from(
        { length: this.cols },
        (_, c) => -offsetPx - c * staggerPxPerCol
      )
    );
  }

  setPositionsY(matrix: number[][]) {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.cells[r][c].y = matrix[r][c];
      }
    }
  }

  async animateMatrixY(
    fromY: number[][],
    toY: number[][],
    duration = 450,
    columnStaggerMs = 60
  ): Promise<void> {
    const start = performance.now();
    const easeOutBack = (t: number) => {
      const s = 1.70158;
      const p = t - 1;
      return p * p * ((s + 1) * p + s) + 1;
    };

    this.setPositionsY(fromY);

    return new Promise((resolve) => {
      const tick = (now: number) => {
        let done = true;
        for (let r = 0; r < this.rows; r++) {
          for (let c = 0; c < this.cols; c++) {
            const delay = c * columnStaggerMs;
            const rawT = (now - start - delay) / duration;
            const t = Math.max(0, Math.min(1, rawT));
            if (t < 1) done = false;
            const e = easeOutBack(t);
            const y = fromY[r][c] + (toY[r][c] - fromY[r][c]) * e;
            this.cells[r][c].y = y;
          }
        }
        if (!done) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
  }

  async animateDrop(
    fromY: number[][],
    toY: number[][],
    duration = 220
  ): Promise<void> {
    const start = performance.now();
    this.setPositionsY(fromY);

    return new Promise((res) => {
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const ease = 1 - Math.pow(1 - t, 3);
        for (let r = 0; r < this.rows; r++) {
          for (let c = 0; c < this.cols; c++) {
            const y = fromY[r][c] + (toY[r][c] - fromY[r][c]) * ease;
            this.cells[r][c].y = y;
          }
        }
        if (t < 1) requestAnimationFrame(tick);
        else {
          this.setPositionsY(toY);
          res();
        }
      };
      requestAnimationFrame(tick);
    });
  }

  resetCellPositions() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const view = this.cells[r][c];
        view.position.set(c * this.cell, r * this.cell);
      }
    }
  }
}
