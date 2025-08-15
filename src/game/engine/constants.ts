import type { SymbolKey } from "../types";

/** Global speed scaler: tweak only SPEED */
export const SPEED = 1.5;
export const ms = (n: number) => Math.round(n * SPEED);

export const TIMING = {
  entryDrop: 520,
  columnStagger: 70,
  highlightHold: 160,
  pulseUp: 110,
  pulseDown: 110,
  tumbleDrop: 240,
  newDrop: 240,
  bonusEntryDrop: 320,
};

export const BIG_WIN_FACTOR = 10; // 20x bet

export const isMultiplier = (s: SymbolKey) =>
  s === "x2" || s === "x3" || s === "x4" || s === "x5";

export const multValue = (s: SymbolKey) =>
  s === "x2" ? 2 : s === "x3" ? 3 : s === "x4" ? 4 : s === "x5" ? 5 : 0;

export const SCATTER_SYMBOL: SymbolKey = "scatter";
export const SCATTER_PAYOUT = 200;
