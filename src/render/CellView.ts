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

  setTexture(tex: PIXI.Texture | null) {
    if (!tex) {
      this.sprite.visible = false;
      this.sprite.texture = PIXI.Texture.EMPTY;

      return;
    }
    this.visible = true; // ⬅️ ensure the whole cell shows again
    this.sprite.visible = true;
    this.sprite.texture = tex;

    const pad = 10;
    const maxW = this.size - pad * 2;
    const maxH = this.size - pad * 2;
    const w = tex.width || 1;
    const h = tex.height || 1;
    const s = Math.min(maxW / w, maxH / h);
    this.baseScale = s;
    this.sprite.scale.set(s);
  }

  draw(size: number, color: number, isWin: boolean) {
    this.visible = true; // ⬅️ make sure visible when drawing a symbol
    const pad = 3;
    const radius = 14;
    this.g.clear();
    this.g.beginFill(color);
    this.g.drawRoundedRect(pad, pad, size - pad * 2, size - pad * 2, radius);
    this.g.endFill();
    this.g.lineStyle(0, isWin ? 0xffffff : 0x0c0f17);
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
