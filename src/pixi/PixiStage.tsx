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

    const APP_W = host.clientWidth || 560;
    const APP_H = host.clientHeight || 424;

    const COLS = 6;
    const ROWS = 5;

    const MARGIN_X_RATIO = 40 / 560;
    const TOP_MARGIN_RATIO = 24 / 424;

    const marginX = Math.round(APP_W * MARGIN_X_RATIO);
    const topMargin = Math.round(APP_H * TOP_MARGIN_RATIO);

    const usableW = APP_W - marginX * 2;
    const usableH = APP_H - topMargin;

    const cell = Math.floor(Math.min(usableW / COLS, usableH / ROWS));
    const GA_W = cell * COLS;
    const GA_H = cell * ROWS;

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

    const textures = await loadSymbolTextures();

    this.grid = new GridRenderer({
      x: GRID_X,
      y: GRID_Y,
      cell,
      cols: COLS,
      rows: ROWS,
      textures,
    });

    const branchTex = await PIXI.Assets.load(
      "/basic-slot-game/assets/backgrounds/branch.png"
    );
    branchTex.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;

    const FRAME_THICKNESS = Math.max(12, Math.min(32, Math.round(cell * 0.3)));
    const tileScale = FRAME_THICKNESS / (branchTex.height || FRAME_THICKNESS);

    const topEdge = new PIXI.TilingSprite(branchTex, GA_W, FRAME_THICKNESS);
    topEdge.x = GRID_X;
    topEdge.y = GRID_Y - FRAME_THICKNESS;
    topEdge.tileScale.set(tileScale, tileScale);

    const bottomEdge = new PIXI.TilingSprite(branchTex, GA_W, FRAME_THICKNESS);
    bottomEdge.x = GRID_X;
    bottomEdge.y = GRID_Y + GA_H;
    bottomEdge.tileScale.set(tileScale, tileScale);

    const leftEdge = new PIXI.TilingSprite(branchTex, GA_H, FRAME_THICKNESS);
    leftEdge.rotation = -Math.PI / 2;
    leftEdge.x = GRID_X - FRAME_THICKNESS;
    leftEdge.y = GRID_Y + GA_H;
    leftEdge.tileScale.set(tileScale, tileScale);

    const rightEdge = new PIXI.TilingSprite(branchTex, GA_H, FRAME_THICKNESS);
    rightEdge.rotation = -Math.PI / 2;
    rightEdge.x = GRID_X + GA_W;
    rightEdge.y = GRID_Y + GA_H;
    rightEdge.tileScale.set(tileScale, tileScale);

    app.stage.addChild(topEdge, bottomEdge, leftEdge, rightEdge);
    app.stage.addChild(this.grid);

    this.grid.resetCellPositions();
    this.grid.setPositionsY(this.grid.baseYMatrix());

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
    const isMobile = window.innerWidth < 768;
    return (
      <div
        ref={this.containerRef}
        style={{
          width: isMobile ? "50%" : "100%",
          height: isMobile ? "45%" : "100%",
        }}
      />
    );
  }
}
