/**
 * localStorage wrapper — every call is try/catch guarded so the app keeps
 * working when storage is blocked (private browsing, disabled, quota full).
 */

const PREFIX = "avaran_";

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function set<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // storage unavailable — the app must degrade gracefully, not throw
  }
}

function remove(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
}

export const storage = { get, set, remove };
