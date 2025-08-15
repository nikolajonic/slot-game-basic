import React from "react";
import * as PIXI from "pixi.js";
import { GridRenderer } from "../render/GridRenderer";
import { loadSymbolTextures } from "../render/symbols";

type ReadyCb = (app: PIXI.Application, grid: GridRenderer) => void;

let __prevApp: PIXI.Application | null = null;
let __prevHost: HTMLElement | null = null;
function killPrev() {
  try {
    if (__prevApp) {
      __prevApp.ticker.stop();
      __prevApp.destroy(true);
    }
  } catch {}
  __prevApp = null;
  try {
    if (__prevHost)
      while (__prevHost.firstChild)
        __prevHost.removeChild(__prevHost.firstChild);
  } catch {}
  __prevHost = null;
}

export default class PixiStage extends React.Component {
  private containerRef = React.createRef<HTMLDivElement>();
  private app: PIXI.Application | null = null;
  private grid: GridRenderer | null = null;
  private readyCbs: ReadyCb[] = [];
  private resolveReady!: (v: {
    app: PIXI.Application;
    grid: GridRenderer;
  }) => void;
  private readyPromise = new Promise<{
    app: PIXI.Application;
    grid: GridRenderer;
  }>((r) => (this.resolveReady = r));

  ready() {
    return this.readyPromise;
  }
  onReady(cb: ReadyCb) {
    this.app && this.grid ? cb(this.app, this.grid) : this.readyCbs.push(cb);
  }

  async componentDidMount() {
    killPrev();

    const host = this.containerRef.current!;
    // Use the actual container size (your style below sets 560×424)
    const APP_W = host.clientWidth || 560;
    const APP_H = host.clientHeight || 424;

    // Keep your logical grid structure, but derive numbers from container size
    const COLS = 6;
    const ROWS = 5;

    // Preserve the same visual ratios you used before:
    // left/right margin was 40 of 560  →  40/560
    // top margin was 24 of 424        →  24/424
    const MARGIN_X_RATIO = 40 / 560;
    const TOP_MARGIN_RATIO = 24 / 424;

    const marginX = Math.round(APP_W * MARGIN_X_RATIO);
    const topMargin = Math.round(APP_H * TOP_MARGIN_RATIO);

    const usableW = APP_W - marginX * 2;
    const usableH = APP_H - topMargin;

    // Cell fits inside both directions
    const cell = Math.floor(Math.min(usableW / COLS, usableH / ROWS));
    const GA_W = cell * COLS;
    const GA_H = cell * ROWS;

    // Center horizontally, keep your original top offset
    const GRID_X = Math.round((APP_W - GA_W) / 2);
    const GRID_Y = topMargin;

    const app = new PIXI.Application();
    await app.init({
      width: APP_W,
      height: APP_H,
      backgroundAlpha: 0,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
    });
    this.app = app;

    host.replaceChildren(app.canvas);
    __prevApp = app;
    __prevHost = host;

    // Load symbol textures
    const textures = await loadSymbolTextures();

    // Create the grid from derived values (no fixed pixel constants)
    this.grid = new GridRenderer({
      x: GRID_X,
      y: GRID_Y,
      cell,
      cols: COLS,
      rows: ROWS,
      textures,
    });

    // --- Branch frame (tiled around the grid area) ---
    const branchTex = await PIXI.Assets.load("/assets/backgrounds/branch.png");
    branchTex.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;

    // Frame thickness relative to a cell (≈ previous 24px @ cell=80 → 0.3)
    const FRAME_THICKNESS = Math.max(12, Math.min(32, Math.round(cell * 0.3)));
    const tileScale = FRAME_THICKNESS / (branchTex.height || FRAME_THICKNESS);

    // TOP
    const topEdge = new PIXI.TilingSprite(branchTex, GA_W, FRAME_THICKNESS);
    topEdge.x = GRID_X;
    topEdge.y = GRID_Y - FRAME_THICKNESS;
    topEdge.tileScale.set(tileScale, tileScale);

    // BOTTOM
    const bottomEdge = new PIXI.TilingSprite(branchTex, GA_W, FRAME_THICKNESS);
    bottomEdge.x = GRID_X;
    bottomEdge.y = GRID_Y + GA_H;
    bottomEdge.tileScale.set(tileScale, tileScale);
    // Optional mirror:
    // bottomEdge.tileScale.x *= -1; bottomEdge.tilePosition.x = -GA_W;

    // LEFT (rotate -90°)
    const leftEdge = new PIXI.TilingSprite(branchTex, GA_H, FRAME_THICKNESS);
    leftEdge.rotation = -Math.PI / 2;
    leftEdge.x = GRID_X - FRAME_THICKNESS;
    leftEdge.y = GRID_Y + GA_H;
    leftEdge.tileScale.set(tileScale, tileScale);

    // RIGHT (rotate -90°)
    const rightEdge = new PIXI.TilingSprite(branchTex, GA_H, FRAME_THICKNESS);
    rightEdge.rotation = -Math.PI / 2;
    rightEdge.x = GRID_X + GA_W;
    rightEdge.y = GRID_Y + GA_H;
    rightEdge.tileScale.set(tileScale, tileScale);
    // Optional mirror:
    // rightEdge.tileScale.x *= -1; rightEdge.tilePosition.x = -GA_H;

    // Add behind grid
    app.stage.addChild(topEdge, bottomEdge, leftEdge, rightEdge);
    app.stage.addChild(this.grid);

    // Baseline
    this.grid.resetCellPositions();
    this.grid.setPositionsY(this.grid.baseYMatrix());

    // Ready callbacks
    this.resolveReady({ app, grid: this.grid });
    const cbs = this.readyCbs.slice();
    this.readyCbs.length = 0;
    cbs.forEach((cb) => cb(app, this.grid!));
  }

  componentWillUnmount() {
    try {
      if (this.app) {
        this.app.ticker.stop();
        this.app.destroy(true);
      }
    } finally {
      this.app = null;
      this.grid = null;
      const host = this.containerRef.current;
      if (host) while (host.firstChild) host.removeChild(host.firstChild);
      __prevApp = null;
      __prevHost = null;
    }
  }

  render() {
    // You said it's OK to keep fixed style here; this defines the container box.
    // Internals now derive from the container size instead of hard-coded numbers.
    return (
      <div
        ref={this.containerRef}
        style={{
          width: 560,
          height: 424,
          overflow: "hidden",
        }}
      />
    );
  }
}
