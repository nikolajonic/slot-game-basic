import * as PIXI from "pixi.js";
import type { SymbolKey } from "../game/types";

const BASE = import.meta.env.BASE_URL || "/";

export const SYMBOL_URLS: Record<SymbolKey, string> = {
  apple: `${BASE}assets/symbols/apple.png`,
  banana: `${BASE}assets/symbols/banana.png`,
  grapes: `${BASE}assets/symbols/grapes.png`,
  lemon: `${BASE}assets/symbols/lemon.png`,
  orange: `${BASE}assets/symbols/orange.png`,
  peach: `${BASE}assets/symbols/peach.png`,
  watermelon: `${BASE}assets/symbols/watermelon.png`,
  scatter: `${BASE}assets/symbols/scatter.png`,
  x2: `${BASE}assets/symbols/multipliers/2x.png`,
  x3: `${BASE}assets/symbols/multipliers/3x.png`,
  x4: `${BASE}assets/symbols/multipliers/4x.png`,
  x5: `${BASE}assets/symbols/multipliers/5x.png`,
};

export async function loadSymbolTextures(): Promise<
  Record<SymbolKey, PIXI.Texture>
> {
  const textures: Record<SymbolKey, PIXI.Texture> = {} as any;
  await Promise.all(
    (Object.keys(SYMBOL_URLS) as SymbolKey[]).map(async (k) => {
      textures[k] = (await PIXI.Assets.load(SYMBOL_URLS[k])) as PIXI.Texture;
    })
  );
  return textures;
}

export const BASE_POOL: Array<[SymbolKey, number]> = [
  ["apple", 1],
  ["banana", 1],
  ["grapes", 1],
  ["lemon", 1],
  ["orange", 1],
  ["peach", 1],
  ["watermelon", 1],
  ["scatter", 0.25],
];

export const BONUS_POOL: Array<[SymbolKey, number]> = [
  ["apple", 1],
  ["banana", 1],
  ["grapes", 1],
  ["lemon", 1],
  ["orange", 1],
  ["peach", 1],
  ["watermelon", 1],
  ["x2", 0.2],
  ["x3", 0.15],
  ["x4", 0.1],
  ["x5", 0.05],
];

export function pickWeighted(pool: Array<[SymbolKey, number]>): SymbolKey {
  let total = 0;
  for (const [, w] of pool) total += w;
  let r = Math.random() * total;
  for (const [k, w] of pool) {
    r -= w;
    if (r <= 0) return k;
  }
  return pool[0][0];
}
