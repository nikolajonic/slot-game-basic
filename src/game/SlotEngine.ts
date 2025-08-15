import type { Cell, EngineConfig, Grid, SymbolKey } from "./types";
import { GridRenderer } from "../render/GridRenderer";
import { Emitter } from "../utils/Emitter";
import { BASE_POOL, BONUS_POOL, pickWeighted } from "../render/symbols";

import { BIG_WIN_FACTOR, TIMING, ms, SCATTER_PAYOUT } from "./engine/constants";
import { pulseAndCountScatters } from "./engine/scatter";
import { tumbleBase } from "./engine/tumbleBase";
import { tumbleBonus } from "./engine/tumbleBonus";

type EngineEvents = {
  spinStart: void;
  tumbleWin: number;
  spinEnd: void;

  bonusTrigger: { scatters: number };
  bonusStart: { spins: number };
  bonusProgress: { remaining: number };
  bonusEnd: { total: number };

  bigWin: { amount: number; factor: number; mode: "base" | "bonus" };
};

export class SlotEngine extends Emitter<EngineEvents> {
  private readonly cols: number;
  private readonly rows: number;
  private readonly bet: number;
  private readonly basePayTable: Partial<Record<SymbolKey, number>>;

  private grid: Grid;
  private renderer: GridRenderer;
  private spinning = false;

  private mode: "base" | "bonus" = "base";
  private bonusSpinsLeft = 0;
  private bonusTotal = 0;
  private bonusPending = false;

  constructor(renderer: GridRenderer, cfg: EngineConfig) {
    super();
    this.renderer = renderer;
    this.cols = cfg.cols;
    this.rows = cfg.rows;
    this.bet = cfg.bet;
    this.basePayTable = cfg.basePayTable;
    this.grid = this.emptyGrid();
  }

  isInBonus() {
    return this.mode === "bonus";
  }
  getBet() {
    return this.bet;
  }

  seed() {
    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++)
        this.grid[r][c] = { sym: pickWeighted(BASE_POOL) };

    this.renderer.resetCellPositions();
    this.renderer.setPositionsY(this.renderer.baseYMatrix());
    this.renderer.renderGrid(this.grid);
  }

  async spin() {
    if (this.spinning || this.mode === "bonus") return;
    this.spinning = true;
    this.emit("spinStart", undefined);

    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++)
        this.grid[r][c] = { sym: pickWeighted(BASE_POOL) };

    this.renderer.renderGrid(this.grid);
    this.renderer.resetCellPositions();
    this.renderer.setPositionsY(this.renderer.baseYMatrix());

    const fromY = this.renderer.aboveYMatrix(
      this.rows * this.renderer.cell + 240,
      ms(TIMING.columnStagger)
    );
    const toY = this.renderer.baseYMatrix();
    await this.renderer.animateMatrixY(
      fromY,
      toY,
      ms(TIMING.entryDrop),
      ms(TIMING.columnStagger)
    );

    this.renderer.resetCellPositions();
    this.renderer.setPositionsY(this.renderer.baseYMatrix());
    this.renderer.renderGrid(this.grid);

    const s1 = await pulseAndCountScatters(
      this.grid,
      this.rows,
      this.cols,
      this.renderer
    );
    if (s1 >= 3) this.payAndTriggerScatter(s1);

    const baseWin = await tumbleBase({
      rows: this.rows,
      cols: this.cols,
      bet: this.bet,
      basePayTable: this.basePayTable,
      grid: this.grid,
      renderer: this.renderer,
      pickBase: () => pickWeighted(BASE_POOL),
    });

    if (baseWin > 0) {
      this.emit("tumbleWin", Number(baseWin.toFixed(2)));
      this.maybeBigWin(baseWin, "base");
    }

    const s2 = await pulseAndCountScatters(
      this.grid,
      this.rows,
      this.cols,
      this.renderer
    );
    if (s2 >= 3) this.payAndTriggerScatter(s2);

    this.spinning = false;
    this.emit("spinEnd", undefined);
  }

  startBonus(spins = 10) {
    if (this.mode === "bonus") return;
    this.bonusPending = false;
    this.mode = "bonus";
    this.bonusSpinsLeft = spins;
    this.bonusTotal = 0;
    this.emit("bonusStart", { spins });
  }

  async spinBonusOnce() {
    if (this.spinning || this.mode !== "bonus" || this.bonusSpinsLeft <= 0)
      return;

    this.spinning = true;
    this.emit("spinStart", undefined);

    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++)
        this.grid[r][c] = { sym: pickWeighted(BONUS_POOL) };

    this.renderer.renderGrid(this.grid);
    this.renderer.resetCellPositions();
    this.renderer.setPositionsY(this.renderer.baseYMatrix());

    const fromY = this.renderer.aboveYMatrix(
      this.rows * this.renderer.cell + 200,
      40
    );
    const toY = this.renderer.baseYMatrix();
    await this.renderer.animateDrop(fromY, toY, ms(TIMING.bonusEntryDrop));

    this.renderer.resetCellPositions();
    this.renderer.setPositionsY(this.renderer.baseYMatrix());
    this.renderer.renderGrid(this.grid);

    const spinWin = await tumbleBonus({
      rows: this.rows,
      cols: this.cols,
      bet: this.bet,
      basePayTable: this.basePayTable,
      grid: this.grid,
      renderer: this.renderer,
      pickBonus: () => pickWeighted(BONUS_POOL),
    });

    this.bonusTotal += spinWin;
    if (spinWin > 0) {
      this.emit("tumbleWin", Number(spinWin.toFixed(2)));
      this.maybeBigWin(spinWin, "bonus");
    }

    this.spinning = false;
    this.emit("spinEnd", undefined);

    this.bonusSpinsLeft--;
    this.emit("bonusProgress", { remaining: this.bonusSpinsLeft });

    if (this.bonusSpinsLeft <= 0) {
      this.emit("bonusEnd", { total: Number(this.bonusTotal.toFixed(2)) });
      this.mode = "base";
    }
  }

  private payAndTriggerScatter(count: number) {
    if (!this.bonusPending) {
      this.emit("tumbleWin", SCATTER_PAYOUT);
      this.bonusPending = true;
      this.emit("bonusTrigger", { scatters: count });
    }
  }

  private maybeBigWin(amount: number, mode: "base" | "bonus") {
    const factor = amount / this.bet;
    if (factor >= BIG_WIN_FACTOR) {
      this.emit("bigWin", {
        amount: Number(amount.toFixed(2)),
        factor: Number(factor.toFixed(1)),
        mode,
      });
    }
  }

  private emptyGrid(): Grid {
    return Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => null as Cell)
    );
  }
}
