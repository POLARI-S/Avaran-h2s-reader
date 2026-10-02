import { storage } from "./storage";
import type { StandardKey } from "./dose";

const DEFAULT_STANDARD: StandardKey = "india";

export function loadStandard(): StandardKey {
  return storage.get<StandardKey>("std", DEFAULT_STANDARD);
}

export function saveStandard(std: StandardKey): void {
  storage.set("std", std);
}
