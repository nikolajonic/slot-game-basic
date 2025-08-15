export type SymbolKey =
  | "apple"
  | "banana"
  | "grapes"
  | "lemon"
  | "orange"
  | "peach"
  | "watermelon"
  | "scatter"
  | "x2"
  | "x3"
  | "x4"
  | "x5";

export type Cell = { sym: SymbolKey } | null;

export type EngineConfig = {
  cols: number;
  rows: number;
  bet: number;
  basePayTable: Partial<Record<SymbolKey, number>>;
};

export type Grid = Cell[][];
