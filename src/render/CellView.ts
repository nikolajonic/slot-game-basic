import * as PIXI from "pixi.js";

export class CellView extends PIXI.Container {
  g: PIXI.Graphics;
  sprite: PIXI.Sprite;

  private size: number;
  private baseScale = 1;

  constructor(size: number) {
    super();
    this.size = size;

    this.g = new PIXI.Graphics();
    this.addChild(this.g);

    this.sprite = new PIXI.Sprite();
    this.sprite.anchor.set(0.5);
    this.sprite.position.set(size / 2, size / 2);
    this.addChild(this.sprite);
  }

  /** allow dynamic cell size */
  setSize(size: number) {
    if (size === this.size) return;
    this.size = size;
    this.sprite.position.set(size / 2, size / 2);
    // re-scale current texture to fit new box
    if (this.sprite.texture && this.sprite.texture.baseTexture) {
      this._fitTexture(this.sprite.texture);
    }
  }

  setTexture(tex: PIXI.Texture | null) {
    if (!tex) {
      this.sprite.visible = false;
      this.sprite.texture = PIXI.Texture.EMPTY;
      return;
    }
    this.visible = true;
    this.sprite.visible = true;
    this.sprite.texture = tex;
    this._fitTexture(tex);
  }

  private _fitTexture(tex: PIXI.Texture) {
    // padding proportional to cell (10px @ 80px -> 0.125)
    const pad = Math.round(this.size * 0.125);
    const maxW = this.size - pad * 2;
    const maxH = this.size - pad * 2;
    const w = tex.width || 1;
    const h = tex.height || 1;
    const s = Math.min(maxW / w, maxH / h);
    this.baseScale = s;
    this.sprite.scale.set(s);
  }

  draw(size: number, color: number, isWin: boolean) {
    this.visible = true;
    // 3px @ 80px -> 0.04 ; radius 14 @ 80px -> 0.175
    const pad = Math.max(1, Math.round(size * 0.04));
    const radius = Math.round(size * 0.175);
    const strokeW = Math.max(1, Math.round(size * 0.02));

    this.g.clear();
    this.g.beginFill(color);
    this.g.drawRoundedRect(pad, pad, size - pad * 2, size - pad * 2, radius);
    this.g.endFill();

    this.g.lineStyle(strokeW, isWin ? 0xffffff : 0x0c0f17, 1);
    this.g.drawRoundedRect(pad, pad, size - pad * 2, size - pad * 2, radius);
  }

  drawEmpty(_size: number) {
    this.g.clear();
    this.sprite.visible = false;
    this.visible = false;
  }

  async pulse(scaleUp = 1.12, upMs = 2000, downMs = 2000): Promise<void> {
    if (!this.sprite.visible) return;
    const targetUp = this.baseScale * scaleUp;
    await this.tweenScale(this.sprite.scale.x, targetUp, upMs, easeOutCubic);
    await this.tweenScale(
      this.sprite.scale.x,
      this.baseScale,
      downMs,
      easeInCubic
    );
  }

  private tweenScale(
    from: number,
    to: number,
    duration: number,
    ease: (t: number) => number
  ) {
    const start = performance.now();
    return new Promise<void>((res) => {
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const s = from + (to - from) * ease(t);
        this.sprite.scale.set(s);
        if (t < 1) requestAnimationFrame(tick);
        else res();
      };
      requestAnimationFrame(tick);
    });
  }
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInCubic = (t: number) => t * t * t;
