import { storage } from "./storage";
import type { StandardKey } from "./dose";

const DEFAULT_STANDARD: StandardKey = "acgih";
const DEFAULT_BOX_PCT = 5;

export function loadStandard(): StandardKey {
  return storage.get<StandardKey>("std", DEFAULT_STANDARD);
}

export function saveStandard(std: StandardKey): void {
  storage.set("std", std);
}

export function loadBoxPct(): number {
  return storage.get<number>("box", DEFAULT_BOX_PCT);
}

export function saveBoxPct(boxPct: number): void {
  storage.set("box", boxPct);
}
