import { storage } from "./storage";
import type { ScanRecord } from "./types";

export function loadHistory(): ScanRecord[] {
  return storage.get<ScanRecord[]>("history", []);
}

export function saveHistory(history: ScanRecord[]): void {
  storage.set("history", history);
}

export function appendRecord(record: ScanRecord): ScanRecord[] {
  const history = [...loadHistory(), record];
  saveHistory(history);
  return history;
}

export function clearHistory(): void {
  saveHistory([]);
}
