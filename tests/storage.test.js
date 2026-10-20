import {
  loadState,
  persistState,
  loadCheckpoint,
  saveCheckpoint,
  clearCheckpoint,
  loadLastScan,
  saveLastScan,
  TTL,
} from "../src/storage.js";
import test from "node:test";
import assert from "node:assert/strict";

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

test("state round-trips and drops corrupt json", () => {
  const s = memoryStorage();
  persistState(s, {
    language: "tr",
    hidden: ["1"],
    timings: { maxUnfollows: 50 },
  });
  const loaded = loadState(s);
  assert.equal(loaded.language, "tr");
  assert.deepEqual(loaded.hidden, ["1"]);
  assert.equal(loaded.timings.maxUnfollows, 50);
  s.setItem("ux_state_v1", "{oops");
  assert.deepEqual(loadState(s), {});
});

test("checkpoint expires after TTL and ignores another viewer", () => {
  const s = memoryStorage();
  const cp = {
    viewerHandle: "me",
    users: [{ handle: "a" }],
    cursor: "c",
    savedAt: Date.now(),
  };
  saveCheckpoint(s, cp);
  assert.equal(loadCheckpoint(s, "me").cursor, "c");
  assert.equal(loadCheckpoint(s, "other"), null);
  cp.savedAt = Date.now() - TTL - 1;
  saveCheckpoint(s, cp);
  assert.equal(loadCheckpoint(s, "me"), null);
  clearCheckpoint(s);
  assert.equal(loadCheckpoint(s, "me"), null);
});

test("last scan only returns the current viewer's fresh data", () => {
  const s = memoryStorage();
  saveLastScan(s, {
    viewerHandle: "me",
    users: [{ handle: "a" }],
    savedAt: Date.now(),
  });
  assert.equal(loadLastScan(s, "me").users.length, 1);
  assert.equal(loadLastScan(s, "other"), null);
});

test("storage errors never throw", () => {
  const broken = {
    getItem() {
      throw new Error("nope");
    },
    setItem() {
      throw new Error("quota");
    },
    removeItem() {
      throw new Error("nope");
    },
  };
  assert.deepEqual(loadState(broken), {});
  assert.equal(loadCheckpoint(broken, "me"), null);
  assert.equal(loadLastScan(broken, "me"), null);
  assert.doesNotThrow(() => persistState(broken, { language: "en" }));
  assert.doesNotThrow(() => saveCheckpoint(broken, { users: [] }));
  assert.doesNotThrow(() => clearCheckpoint(broken));
});
