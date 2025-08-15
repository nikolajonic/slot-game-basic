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

    // 🔒 Layout constants that fit 800×600 app
    const GRID = { x: 40, y: 24, cell: 80, cols: 6, rows: 5 };
    const APP_W = GRID.x * 2 + GRID.cols * GRID.cell; // 40*2 + 6*80 = 560
    const APP_H = GRID.y + GRID.rows * GRID.cell; // 24 + 5*80 = 424

    // Grid area (the reels rectangle we want to frame)
    const GA_X = GRID.x;
    const GA_Y = GRID.y;
    const GA_W = GRID.cols * GRID.cell; // 480
    const GA_H = GRID.rows * GRID.cell; // 400

    const app = new PIXI.Application();
    await app.init({
      width: APP_W,
      height: APP_H,
      backgroundAlpha: 0, // transparent canvas
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
    });
    this.app = app;

    const host = this.containerRef.current!;
    host.replaceChildren(app.canvas);
    __prevApp = app;
    __prevHost = host;

    // Load textures for symbols
    const textures = await loadSymbolTextures();

    // Create the grid
    this.grid = new GridRenderer({
      x: GRID.x,
      y: GRID.y,
      cell: GRID.cell,
      cols: GRID.cols,
      rows: GRID.rows,
      textures,
    });

    // --- Branch frame (tiled on all 4 sides of the grid area) ---
    const branchTex = await PIXI.Assets.load("/assets/backgrounds/branch.png");
    // Allow repeating; helpful for seamless tiling
    branchTex.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;

    // Frame thickness (px). Tune to your art (e.g., 18–28).
    const FRAME_THICKNESS = Math.min(branchTex.height || 24, 24);
    const tileScale = FRAME_THICKNESS / (branchTex.height || FRAME_THICKNESS);

    // TOP edge: tiles left→right above the grid
    const topEdge = new PIXI.TilingSprite(branchTex, GA_W, FRAME_THICKNESS);
    topEdge.x = GA_X;
    topEdge.y = GA_Y - FRAME_THICKNESS;
    topEdge.tileScale.set(tileScale, tileScale);

    // BOTTOM edge: tiles left→right below the grid
    const bottomEdge = new PIXI.TilingSprite(branchTex, GA_W, FRAME_THICKNESS);
    bottomEdge.x = GA_X;
    bottomEdge.y = GA_Y + GA_H;
    bottomEdge.tileScale.set(tileScale, tileScale);
    // Optional mirror for visual symmetry:
    // bottomEdge.tileScale.x *= -1; bottomEdge.tilePosition.x = -GA_W;

    // LEFT edge: tile along vertical side (rotate -90°)
    const leftEdge = new PIXI.TilingSprite(branchTex, GA_H, FRAME_THICKNESS);
    leftEdge.rotation = -Math.PI / 2;
    // After rotation around (0,0), position using bottom-left math:
    leftEdge.x = GA_X - FRAME_THICKNESS;
    leftEdge.y = GA_Y + GA_H;
    leftEdge.tileScale.set(tileScale, tileScale);

    // RIGHT edge: tile along vertical side (rotate -90°)
    const rightEdge = new PIXI.TilingSprite(branchTex, GA_H, FRAME_THICKNESS);
    rightEdge.rotation = -Math.PI / 2;
    rightEdge.x = GA_X + GA_W;
    rightEdge.y = GA_Y + GA_H;
    rightEdge.tileScale.set(tileScale, tileScale);
    // Optional mirror:
    // rightEdge.tileScale.x *= -1; rightEdge.tilePosition.x = -GA_H;

    // Add frame BEHIND the grid
    app.stage.addChild(topEdge, bottomEdge, leftEdge, rightEdge);
    app.stage.addChild(this.grid);

    // Snap baseline positions
    this.grid.resetCellPositions();
    this.grid.setPositionsY(this.grid.baseYMatrix());

    // Ready -> parent
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
    return (
      <div
        ref={this.containerRef}
        style={{
          width: 560, // match APP_W
          height: 424, // match APP_H
          overflow: "hidden",
        }}
      />
    );
  }
}
