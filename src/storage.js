import {
  STORAGE_KEY,
  CHECKPOINT_KEY,
  LAST_SCAN_KEY,
  ACTIVITY_KEY,
  ACTIVITY_SCAN_KEY,
  ACTIVITY_TTL,
  STATE_TTL,
} from "./config.js";
import { safeJsonParse } from "./utils.js";

export const TTL = STATE_TTL;

function defaultStorage() {
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
}

function readJson(storage, key) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed = safeJsonParse(raw, null);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeJson(storage, key, value) {
  if (!storage) return false;
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function stripSets(value) {
  if (!value || typeof value !== "object") return value;
  const out = { ...value };
  for (const [key, item] of Object.entries(out)) {
    if (item instanceof Set) out[key] = [...item];
  }
  return out;
}

export function loadState(storage = defaultStorage()) {
  const parsed = readJson(storage, STORAGE_KEY);
  if (!parsed) return {};
  return parsed;
}

export function persistState(storage = defaultStorage(), partial = {}) {
  if (!storage) return false;
  const current = loadState(storage);
  const next = {
    ...current,
    ...stripSets(partial),
  };
  if (partial.timings && typeof partial.timings === "object") {
    next.timings = {
      ...(current.timings || {}),
      ...partial.timings,
    };
  }
  return writeJson(storage, STORAGE_KEY, next);
}

function isFresh(savedAt, ttl = TTL) {
  const stamp = Number(savedAt);
  return Number.isFinite(stamp) && Date.now() - stamp < ttl && stamp <= Date.now() + 60_000;
}

function sameViewer(expected, actual) {
  if (!actual) return true;
  return String(expected || "").toLowerCase() === String(actual).toLowerCase();
}

export function loadCheckpoint(storage = defaultStorage(), viewerHandle = "") {
  const cp = readJson(storage, CHECKPOINT_KEY);
  if (!cp) return null;
  if (!Array.isArray(cp.users)) return null;
  if (!isFresh(cp.savedAt)) return null;
  if (!sameViewer(viewerHandle, cp.viewerHandle)) return null;
  return cp;
}

export function saveCheckpoint(storage = defaultStorage(), checkpoint = {}) {
  if (!storage) return false;
  const next = { ...checkpoint };
  if (!Number.isFinite(Number(next.savedAt))) next.savedAt = Date.now();
  return writeJson(storage, CHECKPOINT_KEY, next);
}

export function clearCheckpoint(storage = defaultStorage()) {
  if (!storage) return false;
  try {
    storage.removeItem(CHECKPOINT_KEY);
    return true;
  } catch {
    return false;
  }
}

export function loadLastScan(storage = defaultStorage(), viewerHandle = "") {
  const scan = readJson(storage, LAST_SCAN_KEY);
  if (!scan) return null;
  if (!Array.isArray(scan.users)) return null;
  if (!isFresh(scan.savedAt)) return null;
  if (!sameViewer(viewerHandle, scan.viewerHandle)) return null;
  return scan;
}

export function saveLastScan(storage = defaultStorage(), snapshot = {}) {
  if (!storage) return false;
  const next = { ...snapshot };
  if (!Number.isFinite(Number(next.savedAt))) next.savedAt = Date.now();
  return writeJson(storage, LAST_SCAN_KEY, next);
}

function isFreshActivity(entry, now = Date.now()) {
  // Mirrors isActivityFresh in src/activity.js; keep the two in sync.
  const checkedAt = Number(entry?.checkedAt);
  return (
    Number.isFinite(checkedAt) &&
    checkedAt <= now + 60_000 &&
    now - checkedAt < ACTIVITY_TTL
  );
}

function freshActivityEntries(entries, now = Date.now()) {
  const fresh = {};
  for (const [key, entry] of Object.entries(entries || {})) {
    if (isFreshActivity(entry, now)) fresh[key] = entry;
  }
  return fresh;
}

export function loadActivity(storage = defaultStorage(), viewerHandle = "") {
  const parsed = readJson(storage, ACTIVITY_KEY);
  if (!parsed || !parsed.entries || typeof parsed.entries !== "object") {
    return {};
  }
  if (!sameViewer(viewerHandle, parsed.viewerHandle)) return {};
  const fresh = freshActivityEntries(parsed.entries);
  const storedCount = Object.keys(parsed.entries).length;
  const freshCount = Object.keys(fresh).length;
  if (freshCount !== storedCount) {
    if (freshCount > 0) {
      writeJson(storage, ACTIVITY_KEY, {
        version: parsed.version ?? 1,
        viewerHandle: parsed.viewerHandle,
        savedAt: Date.now(),
        entries: fresh,
      });
    } else {
      try {
        storage.removeItem(ACTIVITY_KEY);
      } catch {
        // Ignore storage failures; loading is best-effort.
      }
    }
  }
  return fresh;
}

export function saveActivity(
  storage = defaultStorage(),
  viewerHandle = "",
  entries = {}
) {
  if (!storage) return false;
  if (!viewerHandle) return false;
  const now = Date.now();
  return writeJson(storage, ACTIVITY_KEY, {
    version: 1,
    viewerHandle,
    savedAt: now,
    entries: freshActivityEntries(entries, now),
  });
}

export function clearActivity(storage = defaultStorage()) {
  if (!storage) return false;
  try {
    storage.removeItem(ACTIVITY_KEY);
    return true;
  } catch {
    return false;
  }
}

export function loadActivityScan(
  storage = defaultStorage(),
  viewerHandle = ""
) {
  const scan = readJson(storage, ACTIVITY_SCAN_KEY);
  if (!scan) return null;
  if (!sameViewer(viewerHandle, scan.viewerHandle)) return null;
  if (!isFresh(scan.savedAt, ACTIVITY_TTL)) {
    clearActivityScan(storage);
    return null;
  }
  return scan;
}

export function saveActivityScan(storage = defaultStorage(), scan = {}) {
  if (!storage) return false;
  const next = { ...scan };
  if (!Number.isFinite(Number(next.savedAt))) next.savedAt = Date.now();
  return writeJson(storage, ACTIVITY_SCAN_KEY, next);
}

export function clearActivityScan(storage = defaultStorage()) {
  if (!storage) return false;
  try {
    storage.removeItem(ACTIVITY_SCAN_KEY);
    return true;
  } catch {
    return false;
  }
}
